import { z } from "zod";
import {
  allQuestions,
  isQuestionVisible,
  normalizeMenopauseAnswers,
  QUESTIONNAIRE_VERSION,
  sectionsById,
} from "@/config/questionnaireConfig";
import type { AnswerValue, QuestionnaireQuestion, RawAnswers, StoredAnswers } from "@/types/questionnaire";

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
  inviteToken: z.string().trim().min(1).max(100).optional().nullable(),
});

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;

function isEmpty(value: AnswerValue | undefined): boolean {
  return value === undefined || value === null || value === "";
}

function isValidCpf(rawValue: string): boolean {
  const digits = rawValue.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const calcCheckDigit = (base: string, factor: number): number => {
    let total = 0;
    for (const digit of base) total += Number(digit) * factor--;
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  const firstDigit = calcCheckDigit(digits.slice(0, 9), 10);
  if (firstDigit !== Number(digits[9])) return false;
  const secondDigit = calcCheckDigit(digits.slice(0, 10), 11);
  return secondDigit === Number(digits[10]);
}

function validateQuestionValue(questionId: string, value: AnswerValue, extraQuestions: QuestionnaireQuestion[]): string | null {
  const question = allQuestions.find((item) => item.id === questionId) ?? extraQuestions.find((item) => item.id === questionId);
  if (!question) return "Pergunta inválida.";

  if (question.type === "cpf") {
    if (typeof value !== "string" || !isValidCpf(value)) return "Informe um CPF válido.";
  }

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


export function validateSectionAnswers(sectionId: string, input: RawAnswers, extraQuestions: QuestionnaireQuestion[] = []): Record<string, string> {
  const answers = normalizeMenopauseAnswers(input);
  const errors: Record<string, string> = {};
  for (const question of [...allQuestions, ...extraQuestions].filter((item) => item.sectionId === sectionId)) {
    if (!isQuestionVisible(question, answers)) continue;
    const value = answers[question.id];
    if (question.required && isEmpty(value)) {
      errors[question.id] = "Esta resposta é obrigatória.";
      continue;
    }
    if (!isEmpty(value)) {
      const error = validateQuestionValue(question.id, value as AnswerValue, extraQuestions);
      if (error) errors[question.id] = error;
    }
  }
  return errors;
}

export function validateQuestionnaireAnswers(input: RawAnswers, extraQuestions: QuestionnaireQuestion[] = []): {
  success: boolean;
  answers: RawAnswers;
  errors: Record<string, string>;
} {
  const answers = normalizeMenopauseAnswers(input);
  const errors: Record<string, string> = {};

  for (const question of [...allQuestions, ...extraQuestions]) {
    if (!isQuestionVisible(question, answers)) continue;
    const value = answers[question.id];
    if (question.required && isEmpty(value)) {
      errors[question.id] = "Esta resposta é obrigatória.";
      continue;
    }
    if (!isEmpty(value)) {
      const error = validateQuestionValue(question.id, value as AnswerValue, extraQuestions);
      if (error) errors[question.id] = error;
    }
  }

  return { success: Object.keys(errors).length === 0, answers, errors };
}

export function buildStoredAnswers(rawAnswers: RawAnswers, extraQuestions: QuestionnaireQuestion[] = []): StoredAnswers {
  const normalized = normalizeMenopauseAnswers(rawAnswers);
  return Object.fromEntries(
    [...allQuestions, ...extraQuestions]
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
