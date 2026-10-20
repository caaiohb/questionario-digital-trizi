import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LETTER_PLAN_KEY, normalizeLetterPlan } from "@/lib/letter-plan";
import { assertSameOrigin } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  duracao_meses: z.string().trim().max(6),
  qtd_parcelas: z.string().trim().regex(/^(\d{1,2})?$/, "Use só números"),
  contato: z.string().trim().max(80),
  uf_crm: z.string().trim().max(2),
  equipe: z.string().trim().max(600),
});

/** Dados fixos do plano usados na carta. Só o administrador altera. */
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor || actor.perfil !== "administrator") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Revise os campos do plano." }, { status: 400 });
    const plan = normalizeLetterPlan(parsed.data);
    const admin = createAdminClient();
    const { error } = await admin.from("system_settings").upsert({ setting_key: LETTER_PLAN_KEY, setting_value: plan, updated_by: actor.id, updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: actor.id, action: "letter_plan_updated", entity_type: "system_settings", entity_id: null, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[letter-plan] erro", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  }
}