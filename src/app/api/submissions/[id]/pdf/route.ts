import { NextResponse } from "next/server";
import { getApiProfile } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSubmissionPdfBytes } from "@/lib/pdf/generate-submission-pdf";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getApiProfile(); if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params; const supabase = await createClient();
  const { data: submission, error } = await supabase.from("questionnaire_submissions").select("*").eq("id", id).single();
  if (error || !submission) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  const admin = createAdminClient();
  let bytes: Uint8Array;

  if (submission.pdf_path) {
    const { data: file, error: downloadError } = await admin.storage.from("prontuario-pdfs").download(submission.pdf_path);
    if (downloadError || !file) return NextResponse.json({ error: "PDF arquivado não encontrado." }, { status: 404 });
    bytes = new Uint8Array(await file.arrayBuffer());
  } else {
    bytes = await generateSubmissionPdfBytes(submission);
  }

  await admin.from("audit_logs").insert({ user_id: profile.id, action: "export_pdf", entity_type: "questionnaire_submission", entity_id: id, metadata: {} });
  return new NextResponse(Buffer.from(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${submission.protocol}.pdf"`, "cache-control": "private, no-store" } });
}
