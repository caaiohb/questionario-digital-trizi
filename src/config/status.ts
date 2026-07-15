import type { SubmissionStatus } from "@/types/database";

export const statusConfig: Record<SubmissionStatus, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }> = {
  draft: { label: "Rascunho", tone: "neutral" },
  submitted: { label: "Enviado", tone: "info" },
  new: { label: "Novo", tone: "warning" },
  in_review: { label: "Em análise", tone: "info" },
  inserted_into_record: { label: "Inserido no prontuário", tone: "success" },
  archived: { label: "Arquivado", tone: "neutral" },
};

export const staffStatusOptions: Array<{ value: SubmissionStatus; label: string }> = [
  { value: "new", label: "Novo" },
  { value: "in_review", label: "Em análise" },
  { value: "inserted_into_record", label: "Inserido no prontuário" },
  { value: "archived", label: "Arquivado" },
];
