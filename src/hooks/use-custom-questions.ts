"use client";
import { useEffect, useState } from "react";
import { toQuestionnaireQuestion } from "@/lib/custom-questions";
import type { PublicCustomQuestion } from "@/lib/custom-questions";
import type { QuestionnaireQuestion } from "@/types/questionnaire";

export function useCustomQuestions(): QuestionnaireQuestion[] {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/custom-questions", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: PublicCustomQuestion[]) => setQuestions(data.map(toQuestionnaireQuestion)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return questions;
}
