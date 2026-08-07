import { QUESTIONNAIRE_VERSION, yesNo } from "@/config/questionnaireConfig";
import type { QuestionnaireQuestion, QuestionnaireSection } from "@/types/questionnaire";

export type CustomQuestionGender = "todos" | "feminino" | "masculino";

export interface PublicCustomQuestion {
  id: string;
  sectionId: string;
  gender: CustomQuestionGender;
  text: string;
  type: "yes_no" | "text" | "textarea";
  required: boolean;
  sensitive: boolean;
  sortOrder: number;
}

export function toQuestionnaireQuestion(row: PublicCustomQuestion): QuestionnaireQuestion {
  return {
    id: `custom_${row.id}`,
    code: `custom_${row.id}`,
    sectionId: row.sectionId,
    text: row.text,
    type: row.type,
    required: row.required,
    options: row.type === "yes_no" ? yesNo : undefined,
    sensitive: row.sensitive,
    order: 1000 + row.sortOrder,
    version: QUESTIONNAIRE_VERSION,
    condition: row.gender === "todos" ? undefined : { questionId: "identification_sex", equals: row.gender },
  };
}

/** Junta as perguntas personalizadas ativas de uma seção às perguntas fixas dela, na ordem certa. */
export function mergeCustomQuestions(section: QuestionnaireSection, customQuestions: QuestionnaireQuestion[]): QuestionnaireQuestion[] {
  const extra = customQuestions.filter((question) => question.sectionId === section.id);
  if (!extra.length) return section.questions;
  return [...section.questions, ...extra];
}

/**
 * Respostas de perguntas personalizadas ficam salvas junto das demais, mas como não
 * fazem parte da lista fixa de perguntas, telas que percorrem `section.questions`
 * (PDF, painel, cópia para prontuário) precisam desta função para não perdê-las.
 */
export function getCustomAnswersForSection<T extends { sectionId: string; questionId: string }>(sectionId: string, answers: Record<string, T>, knownQuestionIds: Set<string>): T[] {
  return Object.values(answers).filter((answer) => answer.sectionId === sectionId && !knownQuestionIds.has(answer.questionId));
}
