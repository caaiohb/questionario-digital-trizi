import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";
import { questionnaireSections, sectionsById } from "@/config/questionnaireConfig";

export const dynamic = "force-dynamic";

const sectionIds = questionnaireSections.map((section) => section.id) as [string, ...string[]];
const schema = z.object({ sectionId: z.enum(sectionIds), ids: z.array(z.string().min(1).max(100)).min(1).max(300) });

/** Salva a ordem das perguntas de uma seção (padrão e personalizadas juntas). */
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor || actor.perfil !== "administrator") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const { sectionId, ids } = parsed.data;
    if (new Set(ids).size !== ids.length) return NextResponse.json({ error: "Lista de perguntas repetida." }, { status: 400 });

    const section = sectionsById.get(sectionId);
    const builtIn = new Set((section?.questions ?? []).map((question) => question.id));
    const admin = createAdminClient();
    const { data: customRows, error: customError } = await admin.from("custom_questions").select("id").eq("section_id", sectionId);
    if (customError) throw customError;
    const custom = new Set((customRows ?? []).map((row) => `custom_${row.id}`));
    if (ids.some((id) => !builtIn.has(id) && !custom.has(id))) return NextResponse.json({ error: "Há perguntas que não pertencem a esta seção." }, { status: 400 });

    const now = new Date().toISOString();
    const rows = ids.map((id, index) => ({ question_id: id, sort_order: (index + 1) * 10, updated_at: now }));
    const { error } = await admin.from("question_overrides").upsert(rows, { onConflict: "question_id" });
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: actor.id, action: "reorder_questions", entity_type: "question", entity_id: null, metadata: { section_id: sectionId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/questions/order] erro", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível salvar a ordem. Confirme que a migration do gerenciador de perguntas foi executada." }, { status: 500 });
  }
}