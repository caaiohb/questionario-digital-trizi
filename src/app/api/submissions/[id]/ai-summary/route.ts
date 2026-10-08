import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";
import { buildAiPrompt } from "@/lib/ai-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      .select("id,answers,patient_age,current_weight,desired_weight,height,ai_prompt_text,deleted_at")
      .eq("id", id)
      .maybeSingle();
    if (!row || (row as Record<string, unknown>).deleted_at) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });

    const saved = (row as unknown as Record<string, unknown>).ai_prompt_text;
    const prompt = typeof saved === "string" && saved.trim() ? saved : buildAiPrompt(row);
    if (!prompt) {
      return NextResponse.json({ error: "Este questionário foi arquivado antes desta função existir e não tem mais as respostas." }, { status: 409 });
    }

    await admin.from("audit_logs").insert({ user_id: profile.id, action: "ai_prompt_copied", entity_type: "questionnaire_submission", entity_id: id, metadata: {} });
    return NextResponse.json({ prompt });
  } catch (e) {
    console.error("[ai-summary] error", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível gerar o texto." }, { status: 500 });
  }
}