import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOCKED_KEY = /full_name|name|nome|cpf|email|phone|telefone|whatsapp|document|rg_|address|endereco/i;

type StoredItem = { question?: string; answer?: unknown; section?: string };

function fmt(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(fmt).filter(Boolean).join(", ");
  return JSON.stringify(value);
}

const INSTRUCOES = `Você é um assistente de apoio da equipe do Instituto Trizi (clínica de emagrecimento e saúde hormonal). Abaixo estão as respostas ANONIMIZADAS de um questionário de avaliação inicial de uma paciente. Prepare um material de apoio para a Dra. Janifer conduzir a consulta e ajudar a paciente a decidir pelo "Plano Trizi".

Regras:
- Não faça diagnóstico, não prescreva e não prometa resultados. Fale em "sinais a explorar na consulta".
- Baseie-se SOMENTE no que foi respondido. Não invente dados.
- "Gatilhos" são as motivações reais da paciente (dor, objetivo, impacto na vida, tentativas anteriores), a serem acolhidas com empatia e ética, sem manipulação, sem pressão e sem explorar medos.
- Se houver sinal de sofrimento emocional importante ou pensamentos de morte, destaque em ALERTAS e oriente acolhimento antes de qualquer oferta.
- Português do Brasil, tom profissional e acolhedor.

Responda neste formato, com títulos e tópicos curtos:
1. RESUMO (4 a 6 linhas com o panorama da paciente)
2. QUEIXAS PRINCIPAIS
3. HISTÓRICO RELEVANTE (tentativas anteriores, condições, medicamentos, hábitos)
4. ALERTAS (pontos de atenção clínica/emocional; "nenhum" se não houver)
5. GATILHOS / PONTOS DE ABORDAGEM (para cada um: tema, o que ela respondeu, como a doutora pode abordar)
6. CONEXÃO COM O PLANO TRIZI (como o plano responde às dores citadas, em linguagem de benefício)
7. POSSÍVEIS OBJEÇÕES E COMO RESPONDER
8. PERGUNTAS ABERTAS PARA APROFUNDAR NA CONSULTA`;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("id,ativo").eq("user_id", auth.user.id).maybeSingle();
    if (!profile?.ativo) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const { id } = await ctx.params;
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("questionnaire_submissions")
      .select("id,answers,patient_age,current_weight,desired_weight,height,answers_archived_at,deleted_at")
      .eq("id", id)
      .maybeSingle();
    if (!row || (row as Record<string, unknown>).deleted_at) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });
    const r = row as unknown as Record<string, unknown>;
    const answers = (r.answers ?? {}) as Record<string, StoredItem>;
    const entries = Object.entries(answers).filter(([k]) => !BLOCKED_KEY.test(k));
    if (r.answers_archived_at || entries.length === 0) {
      return NextResponse.json({ error: "As respostas deste questionário já foram arquivadas (apenas PDF)." }, { status: 409 });
    }

    const lines: string[] = [];
    lines.push(`Idade: ${fmt(r.patient_age)} | Peso atual: ${fmt(r.current_weight)} kg | Peso desejado: ${fmt(r.desired_weight)} kg | Altura: ${fmt(r.height)}`);
    let section = "";
    for (const [, item] of entries) {
      const a = fmt(item?.answer).trim();
      if (!a) continue;
      if (item.section && item.section !== section) {
        section = item.section;
        lines.push(`\n## ${section}`);
      }
      lines.push(`- ${item.question ?? ""}: ${a}`);
    }

    const prompt = `${INSTRUCOES}\n\n=== RESPOSTAS DA PACIENTE (sem identificação) ===\n${lines.join("\n")}`;

    await admin.from("audit_logs").insert({ user_id: profile.id, action: "ai_prompt_copied", entity_type: "questionnaire_submission", entity_id: id, metadata: {} });
    return NextResponse.json({ prompt });
  } catch (e) {
    console.error("[ai-summary] error", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível gerar o texto." }, { status: 500 });
  }
}