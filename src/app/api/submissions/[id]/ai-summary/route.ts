import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const BLOCKED_KEY = /full_name|name|nome|cpf|email|phone|telefone|whatsapp|document|rg_|address|endereco/i;

type StoredItem = { question?: string; answer?: unknown; section?: string };

function fmt(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(fmt).filter(Boolean).join(", ");
  return JSON.stringify(value);
}

const SYSTEM = `Você é um assistente de apoio comercial-clínico do Instituto Trizi (clínica de emagrecimento e saúde hormonal). Você recebe as respostas ANONIMIZADAS de um questionário de avaliação inicial e prepara um material de apoio para a Dra. Janifer conduzir a consulta e ajudar a paciente a fechar o "Plano Trizi".

Regras:
- Não faça diagnóstico, não prescreva e não prometa resultados. Fale em "sinais a explorar na consulta".
- Baseie-se SOMENTE no que foi respondido. Nunca invente dados.
- Os "gatilhos" são motivações reais da paciente (dor, objetivo, impacto na vida, tentativas anteriores) a serem acolhidos com empatia, de forma ética, sem manipulação, sem pressão e sem explorar medos.
- Se houver sinal de sofrimento emocional importante ou pensamentos de morte, coloque em "alertas" e oriente acolhimento antes de qualquer oferta.
- Português do Brasil, tom profissional e acolhedor.

Responda APENAS com JSON válido, sem texto fora dele, neste formato:
{
 "resumo": "parágrafo de 4 a 6 linhas com o panorama da paciente",
 "queixas_principais": ["..."],
 "historico_relevante": ["tentativas anteriores, condições, medicamentos, hábitos relevantes"],
 "alertas": ["pontos de atenção clínica/emocional; vazio se não houver"],
 "gatilhos": [{"tema":"...","evidencia":"o que ela respondeu","como_abordar":"sugestão de fala/pergunta da doutora"}],
 "conexao_plano_trizi": "como o Plano Trizi pode responder às dores citadas, em linguagem de benefício",
 "possiveis_objecoes": [{"objecao":"...","resposta_sugerida":"..."}],
 "perguntas_para_consulta": ["perguntas abertas para aprofundar"]
}`;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Integração de IA não configurada (ANTHROPIC_API_KEY)." }, { status: 503 });

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

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        system: SYSTEM,
        messages: [{ role: "user", content: `Respostas da paciente (sem identificação):\n${lines.join("\n")}` }],
      }),
    });
    if (!res.ok) {
      console.error("[ai-summary] anthropic status", res.status);
      return NextResponse.json({ error: "A IA não conseguiu gerar o resumo agora. Tente novamente." }, { status: 502 });
    }
    const body = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (body.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Resposta da IA em formato inesperado. Tente novamente." }, { status: 502 });
    let summary: unknown;
    try { summary = JSON.parse(match[0]); } catch { return NextResponse.json({ error: "Resposta da IA em formato inesperado. Tente novamente." }, { status: 502 }); }

    await admin.from("audit_logs").insert({ user_id: profile.id, action: "ai_summary_generated", entity_type: "questionnaire_submission", entity_id: id, metadata: { model: MODEL } });
    return NextResponse.json({ summary });
  } catch (e) {
    console.error("[ai-summary] error", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível gerar o resumo." }, { status: 500 });
  }
}