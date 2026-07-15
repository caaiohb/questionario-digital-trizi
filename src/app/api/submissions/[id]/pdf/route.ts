import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getApiProfile } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { questionnaireSections, answerLabel } from "@/config/questionnaireConfig";
import type { StoredAnswers } from "@/types/questionnaire";

export const runtime = "nodejs";

function clean(text: string) { return text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "..."); }
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] { const words = clean(text).split(/\s+/); const lines: string[] = []; let line = ""; for (const word of words) { const test = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test; else { if (line) lines.push(line); line = word; } } if (line) lines.push(line); return lines; }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getApiProfile(); if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params; const supabase = await createClient();
  const { data: submission, error } = await supabase.from("questionnaire_submissions").select("*").eq("id", id).single();
  if (error || !submission) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  const pdf = await PDFDocument.create(); const regular = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28; const pageHeight = 841.89; const margin = 48; const contentWidth = pageWidth - margin * 2; let page: PDFPage; let y = 0;
  const newPage = () => { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin; page.drawText("INSTITUTO TRIZI", { x: margin, y, size: 10, font: bold, color: rgb(0.14, 0.27, 0.24) }); page.drawText(submission.protocol, { x: pageWidth - margin - regular.widthOfTextAtSize(submission.protocol, 9), y, size: 9, font: regular, color: rgb(0.4,0.4,0.4) }); y -= 28; };
  const ensure = (height: number) => { if (y - height < 62) newPage(); };
  const text = (value: string, size = 10, font: PDFFont = regular, gap = 4, color = rgb(0.15,0.17,0.16)) => { const lines = wrap(value, font, size, contentWidth); ensure(lines.length * (size + gap) + 4); for (const line of lines) { page.drawText(line, { x: margin, y, size, font, color }); y -= size + gap; } };
  const heading = (value: string) => { ensure(32); y -= 4; page.drawRectangle({ x: margin, y: y - 18, width: contentWidth, height: 25, color: rgb(0.94,0.95,0.94) }); page.drawText(clean(value.toUpperCase()), { x: margin + 9, y: y - 10, size: 10, font: bold, color: rgb(0.14,0.27,0.24) }); y -= 31; };
  const answers = submission.answers as StoredAnswers;
  const cpf = answers.identification_cpf?.answer;
  newPage(); text("QUESTIONÁRIO DIGITAL TRIZI", 19, bold, 5, rgb(0.14,0.27,0.24)); y -= 6; text(`Paciente: ${submission.patient_name}`, 12, bold); text(`Idade: ${submission.patient_age} anos`); if (cpf) text(`CPF: ${cpf}`); text(`Data do preenchimento: ${format(new Date(submission.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`); text(`Protocolo: ${submission.protocol}`); y -= 8; heading("Dados corporais"); text(`Peso atual: ${Number(submission.current_weight).toLocaleString("pt-BR")} kg`); text(`Peso desejado: ${Number(submission.desired_weight).toLocaleString("pt-BR")} kg`); text(`Altura: ${Number(submission.height).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`);
  for (const section of questionnaireSections.slice(1)) { const items = section.questions.filter((question) => answers[question.id]); if (!items.length) continue; heading(section.title); for (const question of items) { const stored = answers[question.id]; text(question.text, 9, bold, 3); text(answerLabel(question, stored.answer), 10, regular, 4, rgb(0.25,0.28,0.27)); y -= 5; } }
  if (submission.priority_alert) { heading("Alerta interno"); text("Este questionário contém resposta marcada para atenção prioritária da equipe autorizada. O documento não emite diagnóstico.", 10, bold, 4, rgb(0.65,0.1,0.1)); }
  y -= 10; text("Documento preenchido diretamente pela paciente.", 9, regular, 3, rgb(0.4,0.4,0.4));
  const pages = pdf.getPages(); pages.forEach((item, index) => { const footer = `Instituto Trizi · Página ${index + 1} de ${pages.length}`; item.drawLine({ start: { x: margin, y: 42 }, end: { x: pageWidth - margin, y: 42 }, thickness: 0.5, color: rgb(0.82,0.82,0.82) }); item.drawText(footer, { x: margin, y: 27, size: 8, font: regular, color: rgb(0.45,0.45,0.45) }); });
  const bytes = await pdf.save();
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({ user_id: profile.id, action: "export_pdf", entity_type: "questionnaire_submission", entity_id: id, metadata: {} });
  return new NextResponse(Buffer.from(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${submission.protocol}.pdf"`, "cache-control": "private, no-store" } });
}
