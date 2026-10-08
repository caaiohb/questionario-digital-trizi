import type { QuestionnaireQuestion } from "@/types/questionnaire";

export interface QuestionOverride {
  active: boolean;
  removed: boolean;
  sortOrder: number | null;
}

export type QuestionOverrides = Record<string, QuestionOverride>;

/**
 * Perguntas essenciais: o sistema depende delas para funcionar (identificação do
 * paciente, ramificação por sexo e alerta de segurança emocional). Não podem ser
 * desativadas nem removidas, apenas reordenadas.
 */
export const LOCKED_QUESTION_IDS: ReadonlySet<string> = new Set([
  "identification_full_name",
  "identification_age",
  "identification_current_weight",
  "identification_desired_weight",
  "identification_height",
  "identification_cpf",
  "identification_sex",
  "emotional_death_thoughts",
]);

export function isQuestionEnabled(questionId: string, overrides?: QuestionOverrides | null): boolean {
  if (LOCKED_QUESTION_IDS.has(questionId)) return true;
  const override = overrides?.[questionId];
  if (!override) return true;
  return override.active && !override.removed;
}

/** Remove perguntas desativadas/removidas e aplica a ordem personalizada. Ordem estável. */
export function applyQuestionOverrides(questions: QuestionnaireQuestion[], overrides?: QuestionOverrides | null): QuestionnaireQuestion[] {
  if (!overrides || Object.keys(overrides).length === 0) return questions;
  return questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => isQuestionEnabled(question.id, overrides))
    .map(({ question, index }) => {
      const sortOrder = overrides[question.id]?.sortOrder;
      return { question: sortOrder === null || sortOrder === undefined ? question : { ...question, order: sortOrder }, index };
    })
    .sort((a, b) => a.question.order - b.question.order || a.index - b.index)
    .map(({ question }) => question);
}

export interface OverrideRow {
  question_id: string;
  active: boolean;
  removed: boolean;
  sort_order: number | null;
}

export function rowsToOverrides(rows: OverrideRow[] | null | undefined): QuestionOverrides {
  const result: QuestionOverrides = {};
  for (const row of rows ?? []) {
    result[row.question_id] = { active: row.active, removed: row.removed, sortOrder: row.sort_order };
  }
  return result;
}