import { QUESTIONNAIRE_VERSION, yesNo } from "@/config/questionnaireConfig";
import { getVisibleSections, isQuestionVisible } from "@/config/questionnaireConfig";
import { applyQuestionOverrides } from "@/lib/question-overrides";
import type { QuestionOverrides } from "@/lib/question-overrides";
import type { QuestionnaireQuestion, QuestionnaireSection, RawAnswers } from "@/types/questionnaire";

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

/**
 * Junta as perguntas personalizadas ativas de uma seção às perguntas fixas dela.
 * Com `overrides`, aplica também as perguntas desativadas/removidas e a ordem escolhida no painel.
 */
export function mergeCustomQuestions(section: QuestionnaireSection, customQuestions: QuestionnaireQuestion[], overrides?: QuestionOverrides | null): QuestionnaireQuestion[] {
  const extra = customQuestions.filter((question) => question.sectionId === section.id);
  const base = extra.length ? [...section.questions, ...extra] : section.questions;
  return overrides ? applyQuestionOverrides(base, overrides) : base;
}

/** Seções visíveis para as respostas atuais, sem as que ficaram sem nenhuma pergunta a exibir. */
export function getEffectiveSections(answers: RawAnswers, customQuestions: QuestionnaireQuestion[], overrides?: QuestionOverrides | null): QuestionnaireSection[] {
  return getVisibleSections(answers).filter((section) => mergeCustomQuestions(section, customQuestions, overrides).some((question) => isQuestionVisible(question, answers)));
}

/**
 * Respostas de perguntas personalizadas ficam salvas junto das demais, mas como não
 * fazem parte da lista fixa de perguntas, telas que percorrem `section.questions`
 * (PDF, painel, cópia para prontuário) precisam desta função para não perdê-las.
 */
export function getCustomAnswersForSection<T extends { sectionId: string; questionId: string }>(sectionId: string, answers: Record<string, T>, knownQuestionIds: Set<string>): T[] {
  return Object.values(answers).filter((answer) => answer.sectionId === sectionId && !knownQuestionIds.has(answer.questionId));
}
