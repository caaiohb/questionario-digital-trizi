import { z } from "zod";
import {
  allQuestions,
  isQuestionVisible,
  normalizeMenopauseAnswers,
  QUESTIONNAIRE_VERSION,
  sectionsById,
} from "@/config/questionnaireConfig";
import type { AnswerValue, RawAnswers, StoredAnswers } from "@/types/questionnaire";

const answerValueSchema = z.union([
  z.string().max(5000),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.object({ value: z.number().finite(), unit: z.enum(["cm", "m"]) }),
]);

export const submissionPayloadSchema = z.object({
  clientSubmissionId: z.string().uuid(),
  answers: z.record(z.string(), answerValueSchema),
  consentAccepted: z.literal(true),
  consentVersion: z.string().min(1).max(50),
  consentAcceptedAt: z.string().datetime(),
  questionnaireVersion: z.literal(QUESTIONNAIRE_VERSION),
});

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;

function isEmpty(value: AnswerValue | undefined): boolean {
  return value === undefined || value === null || value === "";
}

function validateQuestionValue(questionId: string, value: AnswerValue): string | null {
  const question = allQuestions.find((item) => item.id === questionId);
  if (!question) return "Pergunta inválida.";

  if (question.type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) return "Informe um número válido.";
    if (question.min !== undefined && value < question.min) return `O valor mínimo é ${question.min}.`;
    if (question.max !== undefined && value > question.max) return `O valor máximo é ${question.max}.`;
  }

  if (question.type === "height") {
    if (typeof value !== "number" || value < 1 || value > 2.5) return "Informe uma altura válida entre 1,00 m e 2,50 m.";
  }

  if (["yes_no", "yes_no_na", "yes_no_prefer_not", "radio"].includes(question.type)) {
    if (typeof value !== "string" || !question.options?.some((option) => option.value === value)) {
      return "Selecione uma opção válida.";
    }
  }

  if (["text", "textarea"].includes(question.type)) {
    if (typeof value !== "string") return "Informe um texto válido.";
    if (value.trim().length > 5000) return "O texto excedeu o limite permitido.";
  }

  return null;
}


export function validateSectionAnswers(sectionId: string, input: RawAnswers): Record<string, string> {
  const answers = normalizeMenopauseAnswers(input);
  const errors: Record<string, string> = {};
  for (const question of allQuestions.filter((item) => item.sectionId === sectionId)) {
    if (!isQuestionVisible(question, answers)) continue;
    const value = answers[question.id];
    if (question.required && isEmpty(value)) {
      errors[question.id] = "Esta resposta é obrigatória.";
      continue;
    }
    if (!isEmpty(value)) {
      const error = validateQuestionValue(question.id, value as AnswerValue);
      if (error) errors[question.id] = error;
    }
  }
  return errors;
}

export function validateQuestionnaireAnswers(input: RawAnswers): {
  success: boolean;
  answers: RawAnswers;
  errors: Record<string, string>;
} {
  const answers = normalizeMenopauseAnswers(input);
  const errors: Record<string, string> = {};

  for (const question of allQuestions) {
    if (!isQuestionVisible(question, answers)) continue;
    const value = answers[question.id];
    if (question.required && isEmpty(value)) {
      errors[question.id] = "Esta resposta é obrigatória.";
      continue;
    }
    if (!isEmpty(value)) {
      const error = validateQuestionValue(question.id, value as AnswerValue);
      if (error) errors[question.id] = error;
    }
  }

  return { success: Object.keys(errors).length === 0, answers, errors };
}

export function buildStoredAnswers(rawAnswers: RawAnswers): StoredAnswers {
  const normalized = normalizeMenopauseAnswers(rawAnswers);
  return Object.fromEntries(
    allQuestions
      .filter((question) => isQuestionVisible(question, normalized))
      .filter((question) => normalized[question.id] !== undefined && normalized[question.id] !== "")
      .map((question) => {
        const section = sectionsById.get(question.sectionId);
        return [
          question.id,
          {
            questionId: question.id,
            code: question.code,
            question: question.text,
            answer: normalized[question.id],
            sectionId: question.sectionId,
            section: section?.title ?? question.sectionId,
            sensitive: Boolean(question.sensitive),
          },
        ];
      }),
  );
}
