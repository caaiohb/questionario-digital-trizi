"use client";
import { useEffect, useState } from "react";
import { toQuestionnaireQuestion } from "@/lib/custom-questions";
import type { PublicCustomQuestion } from "@/lib/custom-questions";
import type { QuestionOverrides } from "@/lib/question-overrides";
import type { QuestionnaireQuestion } from "@/types/questionnaire";

/** Perguntas personalizadas ativas + ajustes feitos no painel (ativa/inativa/removida/ordem). */
export function useQuestionConfig(): { customQuestions: QuestionnaireQuestion[]; overrides: QuestionOverrides } {
  const [customQuestions, setCustomQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [overrides, setOverrides] = useState<QuestionOverrides>({});
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/question-config", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { custom: PublicCustomQuestion[]; overrides: QuestionOverrides }) => {
        setCustomQuestions((data.custom ?? []).map(toQuestionnaireQuestion));
        setOverrides(data.overrides ?? {});
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return { customQuestions, overrides };
}