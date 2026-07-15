"use client";
import { AlertCircle } from "lucide-react";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { QuestionField } from "./question-field";
import type { QuestionnaireQuestion, RawAnswers } from "@/types/questionnaire";

export function QuestionCard({ question, value, register, setValue, error, index }: { question: QuestionnaireQuestion; value: unknown; register: UseFormRegister<RawAnswers>; setValue: UseFormSetValue<RawAnswers>; error?: string; index: number }) {
  return <Card className="p-5 sm:p-6"><div className="mb-4 flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--trizi-primary)]/10 text-sm font-bold text-[var(--trizi-primary)]">{index}</span><div><label id={`${question.id}-label`} htmlFor={question.id} className="text-base font-semibold leading-relaxed text-slate-900">{question.text}{question.required && <span className="ml-1 text-red-700" aria-label="obrigatório">*</span>}</label>{question.helperText && <p id={`${question.id}-helper`} className="mt-1 text-sm leading-relaxed text-slate-600">{question.helperText}</p>}</div></div><QuestionField question={question} value={value} register={register} setValue={setValue} error={error} />{error && <p id={`${question.id}-error`} role="alert" className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-700"><AlertCircle size={16} />{error}</p>}</Card>;
}
