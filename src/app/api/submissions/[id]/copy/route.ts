import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

const schema = z.object({
  format: z.enum(["summary", "complete", "section"]),
  sectionId: z.string().max(80).optional(),
  markInserted: z.boolean().default(false),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const profile = await getApiProfile();
    if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Ação inválida" }, { status: 400 });

    const { id } = await params;
    const admin = createAdminClient();
    if (parsed.data.markInserted) {
      const { data: current } = await admin
        .from("questionnaire_submissions")
        .select("status")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (!current) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });
      const { error } = await admin.from("questionnaire_submissions").update({
        status: "inserted_into_record",
        inserted_into_record_at: new Date().toISOString(),
        inserted_into_record_by: profile.id,
      }).eq("id", id).is("deleted_at", null);
      if (error) throw error;
      if (current.status !== "inserted_into_record") {
        await admin.from("submission_status_history").insert({
          submission_id: id,
          previous_status: current.status,
          new_status: "inserted_into_record",
          changed_by: profile.id,
        });
      }
    }
    await admin.from("audit_logs").insert({
      user_id: profile.id,
      action: "copy_submission",
      entity_type: "questionnaire_submission",
      entity_id: id,
      metadata: {
        format: parsed.data.format,
        section_id: parsed.data.sectionId ?? null,
        marked_inserted: parsed.data.markInserted,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível registrar a cópia." }, { status: 500 });
  }
}
