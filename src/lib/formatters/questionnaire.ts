import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { answerLabel, questionnaireSections, questionsById } from "@/config/questionnaireConfig";
import type { StoredAnswers } from "@/types/questionnaire";

export interface SubmissionForFormatting {
  protocol: string;
  patient_name: string;
  patient_age: number;
  current_weight: number;
  desired_weight: number;
  height: number;
  submitted_at: string;
  priority_alert: boolean;
  answers: StoredAnswers;
}

function heading(title: string): string {
  return `\n${title.toUpperCase()}\n`;
}

function header(submission: SubmissionForFormatting): string {
  const date = format(new Date(submission.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const cpf = submission.answers.identification_cpf?.answer;
  return [
    "QUESTIONÁRIO DIGITAL TRIZI",
    "",
    `Paciente: ${submission.patient_name}`,
    `Idade: ${submission.patient_age} anos`,
    ...(cpf ? [`CPF: ${cpf}`] : []),
    `Data do preenchimento: ${date}`,
    `Protocolo: ${submission.protocol}`,
    "",
    "DADOS CORPORAIS",
    `Peso atual: ${submission.current_weight.toLocaleString("pt-BR")} kg`,
    `Peso desejado: ${submission.desired_weight.toLocaleString("pt-BR")} kg`,
    `Altura: ${submission.height.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`,
  ].join("\n");
}

export function formatCompleteQuestionnaire(submission: SubmissionForFormatting): string {
  const lines: string[] = [header(submission)];
  for (const section of questionnaireSections.slice(1)) {
    const answers = section.questions
      .map((question) => submission.answers[question.id])
      .filter(Boolean);
    if (!answers.length) continue;
    lines.push(heading(section.title));
    for (const stored of answers) {
      const question = questionsById.get(stored.questionId);
      lines.push(`${stored.question}: ${question ? answerLabel(question, stored.answer) : String(stored.answer)}`);
    }
  }
  if (submission.priority_alert) lines.push("\nALERTA INTERNO: resposta sinalizada para atenção prioritária.");
  lines.push("\nDocumento preenchido diretamente pela paciente.");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function formatSummaryQuestionnaire(submission: SubmissionForFormatting): string {
  const lines: string[] = [header(submission)];
  for (const section of questionnaireSections.slice(1)) {
    const relevant: string[] = [];
    for (const question of section.questions) {
      const stored = submission.answers[question.id];
      if (!stored) continue;
      const value = stored.answer;
      const mode = question.summaryMode ?? "when_filled";
      const include =
        mode === "always" ||
        (mode === "when_yes" && value === "sim") ||
        (mode === "when_no" && value === "nao") ||
        (mode === "when_filled" && value !== null && value !== undefined && value !== "");
      if (!include) continue;
      relevant.push(`${stored.question}: ${answerLabel(question, value)}`);
    }
    if (relevant.length) {
      lines.push(heading(section.title));
      lines.push(...relevant);
    }
  }
  if (submission.priority_alert) lines.push("\nALERTA PRIORITÁRIO: existe resposta que exige atenção da equipe autorizada.");
  lines.push("\nResumo gerado por regras determinísticas, sem diagnóstico e sem uso de inteligência artificial.");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
