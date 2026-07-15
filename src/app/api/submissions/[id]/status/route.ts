import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

const schema = z.object({ status: z.enum(["new", "in_review", "inserted_into_record", "archived"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const profile = await getApiProfile();
    if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    if (parsed.data.status === "archived" && profile.perfil !== "administrator") {
      return NextResponse.json({ error: "Somente administradores podem arquivar respostas." }, { status: 403 });
    }

    const { id } = await params;
    const admin = createAdminClient();
    const { data: current } = await admin
      .from("questionnaire_submissions")
      .select("status")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!current) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });
    if (current.status === "archived" && profile.perfil !== "administrator") {
      return NextResponse.json({ error: "Somente administradores podem alterar respostas arquivadas." }, { status: 403 });
    }

    const update: Record<string, unknown> = { status: parsed.data.status };
    if (parsed.data.status === "inserted_into_record") {
      update.inserted_into_record_at = new Date().toISOString();
      update.inserted_into_record_by = profile.id;
    }
    if (parsed.data.status === "archived") update.archived_at = new Date().toISOString();

    const { error } = await admin.from("questionnaire_submissions").update(update).eq("id", id).is("deleted_at", null);
    if (error) throw error;
    if (current.status !== parsed.data.status) {
      await admin.from("submission_status_history").insert({
        submission_id: id,
        previous_status: current.status,
        new_status: parsed.data.status,
        changed_by: profile.id,
      });
    }
    await admin.from("audit_logs").insert({
      user_id: profile.id,
      action: "change_status",
      entity_type: "questionnaire_submission",
      entity_id: id,
      metadata: { previous_status: current.status, status: parsed.data.status },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível alterar o status." }, { status: 500 });
  }
}
