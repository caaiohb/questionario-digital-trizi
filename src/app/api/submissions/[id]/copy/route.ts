import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";
import { generateSubmissionPdfBytes } from "@/lib/pdf/generate-submission-pdf";
import { toQuestionnaireQuestion } from "@/lib/custom-questions";
import type { PublicCustomQuestion } from "@/lib/custom-questions";

const schema = z.object({
  format: z.enum(["complete", "section"]),
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
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (!current) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });

      // Gera e arquiva o PDF antes de remover as respostas, para nunca perder o registro.
      let pdfPath = current.pdf_path as string | null;
      if (!pdfPath) {
        const { data: customRows } = await admin.from("custom_questions").select("id,section_id,gender,text,type,required,sensitive,sort_order").eq("active", true);
        const customQuestions = (customRows ?? []).map((row) =>
          toQuestionnaireQuestion({ id: row.id, sectionId: row.section_id, gender: row.gender, text: row.text, type: row.type, required: row.required, sensitive: row.sensitive, sortOrder: row.sort_order } as PublicCustomQuestion),
        );
        const bytes = await generateSubmissionPdfBytes(current, customQuestions);
        pdfPath = `${id}.pdf`;
        const { error: uploadError } = await admin.storage.from("prontuario-pdfs").upload(pdfPath, Buffer.from(bytes), { contentType: "application/pdf", upsert: true });
        if (uploadError) return NextResponse.json({ error: "Não foi possível arquivar o PDF. As respostas não foram removidas." }, { status: 500 });
      }

      const { error } = await admin.from("questionnaire_submissions").update({
        status: "inserted_into_record",
        inserted_into_record_at: new Date().toISOString(),
        inserted_into_record_by: profile.id,
        pdf_path: pdfPath,
        answers: {},
        answers_archived_at: new Date().toISOString(),
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
