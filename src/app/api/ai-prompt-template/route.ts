import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";
import { getActiveStaffId } from "@/lib/ai-staff";
import { AI_INSTRUCTIONS_KEY, DEFAULT_AI_INSTRUCTIONS } from "@/lib/ai-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ template: z.string().max(8000) });

async function readTemplate() {
  const admin = createAdminClient();
  const { data } = await admin.from("system_settings").select("setting_value").eq("setting_key", AI_INSTRUCTIONS_KEY).maybeSingle();
  const v = (data as { setting_value?: unknown } | null)?.setting_value;
  return typeof v === "string" && v.trim() ? v : null;
}

export async function GET() {
  try {
    const staff = await getActiveStaffId();
    if (!staff) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const saved = await readTemplate();
    return NextResponse.json({ template: saved ?? DEFAULT_AI_INSTRUCTIONS, isDefault: !saved, defaultTemplate: DEFAULT_AI_INSTRUCTIONS });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const staff = await getActiveStaffId();
    if (!staff) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Texto inválido (máx. 8000 caracteres)." }, { status: 400 });
    const admin = createAdminClient();
    const text = parsed.data.template.trim();
    if (!text || text === DEFAULT_AI_INSTRUCTIONS.trim()) {
      await admin.from("system_settings").delete().eq("setting_key", AI_INSTRUCTIONS_KEY);
    } else {
      const { error } = await admin.from("system_settings").upsert({ setting_key: AI_INSTRUCTIONS_KEY, setting_value: text }, { onConflict: "setting_key" });
      if (error) throw error;
    }
    await admin.from("audit_logs").insert({ user_id: staff, action: "ai_prompt_template_updated", entity_type: "system_settings", entity_id: null, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ai-prompt-template] error", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  }
}