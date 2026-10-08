import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";
import { getActiveStaffId } from "@/lib/ai-staff";
import { AI_INSTRUCTIONS_KEY, DATA_MARKER, DEFAULT_AI_INSTRUCTIONS, buildAiPrompt } from "@/lib/ai-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const staff = await getActiveStaffId();
    if (!staff) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { id } = await ctx.params;
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("questionnaire_submissions")
      .select("id,answers,patient_age,current_weight,desired_weight,height,ai_prompt_text,deleted_at")
      .eq("id", id)
      .maybeSingle();
    if (!row || (row as Record<string, unknown>).deleted_at) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });

    const saved = (row as unknown as Record<string, unknown>).ai_prompt_text;
    let data: string | null = null;
    if (typeof saved === "string" && saved.trim()) {
      const i = saved.indexOf(DATA_MARKER);
      data = i >= 0 ? saved.slice(i) : `${DATA_MARKER}\n${saved}`;
    } else {
      data = buildAiPrompt(row);
    }
    if (!data) {
      return NextResponse.json({ error: "Este questionário foi arquivado antes desta função existir e não tem mais as respostas." }, { status: 409 });
    }

    const { data: setting } = await admin.from("system_settings").select("setting_value").eq("setting_key", AI_INSTRUCTIONS_KEY).maybeSingle();
    const v = (setting as { setting_value?: unknown } | null)?.setting_value;
    const instructions = typeof v === "string" && v.trim() ? v : DEFAULT_AI_INSTRUCTIONS;

    await admin.from("audit_logs").insert({ user_id: staff, action: "ai_prompt_copied", entity_type: "questionnaire_submission", entity_id: id, metadata: {} });
    return NextResponse.json({ prompt: `${instructions.trim()}\n\n${data}` });
  } catch (e) {
    console.error("[ai-summary] error", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível gerar o texto." }, { status: 500 });
  }
}