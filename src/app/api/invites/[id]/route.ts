import { NextResponse } from "next/server";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const { id } = await params;
    const admin = createAdminClient();
    const { data: invite } = await admin.from("questionnaire_invites").select("id,status").eq("id", id).maybeSingle();
    if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    if (invite.status !== "pending") return NextResponse.json({ error: "Este convite não está mais pendente." }, { status: 400 });

    const { error } = await admin.from("questionnaire_invites").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: actor.id, action: "cancel_invite", entity_type: "questionnaire_invite", entity_id: id, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível cancelar o convite." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const { id } = await params;
    const admin = createAdminClient();
    const { data: invite } = await admin.from("questionnaire_invites").select("id").eq("id", id).maybeSingle();
    if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });

    const { error } = await admin.from("questionnaire_invites").delete().eq("id", id);
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: actor.id, action: "delete_invite", entity_type: "questionnaire_invite", entity_id: id, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir o convite." }, { status: 500 });
  }
}
