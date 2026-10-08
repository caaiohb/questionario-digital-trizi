import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

const schema = z
  .object({
    active: z.boolean().optional(),
    text: z.string().trim().min(3).max(500).optional(),
    required: z.boolean().optional(),
    sensitive: z.boolean().optional(),
    gender: z.enum(["todos", "feminino", "masculino"]).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined));

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor || actor.perfil !== "administrator") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const { id } = await params;

    const admin = createAdminClient();
    const { error } = await admin.from("custom_questions").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    const action = parsed.data.active === true ? "activate_custom_question" : parsed.data.active === false ? "deactivate_custom_question" : "update_custom_question";
    await admin.from("audit_logs").insert({ user_id: actor.id, action, entity_type: "custom_question", entity_id: id, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar a pergunta." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor || actor.perfil !== "administrator") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    const { id } = await params;

    const admin = createAdminClient();
    const { error } = await admin.from("custom_questions").delete().eq("id", id);
    if (error) throw error;
    await admin.from("question_overrides").delete().eq("question_id", `custom_${id}`);
    await admin.from("audit_logs").insert({ user_id: actor.id, action: "delete_custom_question", entity_type: "custom_question", entity_id: id, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir a pergunta." }, { status: 500 });
  }
}
