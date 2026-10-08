import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";
import { questionsById } from "@/config/questionnaireConfig";
import { LOCKED_QUESTION_IDS } from "@/lib/question-overrides";

export const dynamic = "force-dynamic";

const schema = z.object({ active: z.boolean().optional(), removed: z.boolean().optional() }).refine((value) => value.active !== undefined || value.removed !== undefined);

/** Ativa/desativa ou remove (e restaura) uma pergunta padrão do questionário. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor || actor.perfil !== "administrator") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    const { id } = await params;
    if (!questionsById.has(id)) return NextResponse.json({ error: "Pergunta não encontrada." }, { status: 404 });
    if (LOCKED_QUESTION_IDS.has(id)) return NextResponse.json({ error: "Esta pergunta é essencial para o funcionamento do sistema e não pode ser desativada ou removida." }, { status: 400 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const row: Record<string, unknown> = { question_id: id, updated_at: new Date().toISOString() };
    if (parsed.data.active !== undefined) row.active = parsed.data.active;
    if (parsed.data.removed !== undefined) {
      row.removed = parsed.data.removed;
      if (parsed.data.removed === false && parsed.data.active === undefined) row.active = true;
    }

    const admin = createAdminClient();
    const { error } = await admin.from("question_overrides").upsert(row, { onConflict: "question_id" });
    if (error) throw error;
    const action = parsed.data.removed === true ? "remove_question" : parsed.data.removed === false ? "restore_question" : parsed.data.active ? "activate_question" : "deactivate_question";
    await admin.from("audit_logs").insert({ user_id: actor.id, action, entity_type: "question", entity_id: null, metadata: { question_id: id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/questions] erro", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível atualizar a pergunta. Confirme que a migration do gerenciador de perguntas foi executada." }, { status: 500 });
  }
}