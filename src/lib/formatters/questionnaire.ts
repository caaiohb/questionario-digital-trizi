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
  return [
    "QUESTIONÁRIO DIGITAL TRIZI",
    "",
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
