import { NextResponse } from "next/server";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const profile = await getApiProfile();
    if (!profile || profile.perfil !== "administrator") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    const { id } = await params;
    const admin = createAdminClient();
    const { data: current } = await admin.from("questionnaire_submissions").select("status").eq("id", id).is("deleted_at", null).maybeSingle();
    if (!current) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });

    const timestamp = new Date().toISOString();
    const { error } = await admin.from("questionnaire_submissions").update({
      deleted_at: timestamp,
      deleted_by: profile.id,
      status: "archived",
      archived_at: timestamp,
    }).eq("id", id).is("deleted_at", null);
    if (error) throw error;
    if (current.status !== "archived") {
      await admin.from("submission_status_history").insert({
        submission_id: id,
        previous_status: current.status,
        new_status: "archived",
        changed_by: profile.id,
      });
    }
    await admin.from("audit_logs").insert({
      user_id: profile.id,
      action: "soft_delete_submission",
      entity_type: "questionnaire_submission",
      entity_id: id,
      metadata: { previous_status: current.status },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir o registro." }, { status: 500 });
  }
}
