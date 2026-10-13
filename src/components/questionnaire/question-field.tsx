"use client";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Input, Textarea } from "@/components/ui/input";
import { optionsForSex, scaleOptions } from "@/config/questionnaireConfig";
import { cn } from "@/lib/utils";
import type { QuestionnaireQuestion, RawAnswers } from "@/types/questionnaire";

interface Props {
  question: QuestionnaireQuestion;
  value: unknown;
  register: UseFormRegister<RawAnswers>;
  setValue: UseFormSetValue<RawAnswers>;
  error?: string;
  sex?: unknown;
}

export function QuestionField({ question, value, register, setValue, error, sex }: Props) {
  const describedBy = `${question.id}-helper ${question.id}-error`;
  if (question.type === "text") {
    return <Input id={question.id} aria-invalid={Boolean(error)} aria-describedby={describedBy} placeholder={question.placeholder} {...register(question.id)} />;
  }
  if (question.type === "cpf") {
    const format = (digits: string) => digits.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return <Input id={question.id} inputMode="numeric" autoComplete="off" aria-invalid={Boolean(error)} aria-describedby={describedBy} placeholder={question.placeholder} value={typeof value === "string" ? value : ""} onChange={(event) => setValue(question.id, format(event.target.value.replace(/\D/g, "")), { shouldDirty: true, shouldValidate: true })} maxLength={14} />;
  }
  if (question.type === "textarea") {
    return <div className="space-y-3"><Textarea id={question.id} aria-invalid={Boolean(error)} aria-describedby={describedBy} placeholder={question.placeholder} {...register(question.id)} />{question.quickFill && <button type="button" onClick={() => setValue(question.id, question.quickFill!, { shouldDirty: true })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{question.quickFill}</button>}</div>;
  }
  if (question.type === "number") {
    return <div className="relative"><Input id={question.id} type="number" inputMode="decimal" min={question.min} max={question.max} step={question.step} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={question.unit ? "pr-20" : ""} {...register(question.id, { valueAsNumber: true })} />{question.unit && <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-500">{question.unit}</span>}</div>;
  }
  if (question.type === "height") {
    const meters = typeof value === "number" && Number.isFinite(value) ? value : undefined;
    return <div className="grid gap-3 sm:grid-cols-[1fr_150px]"><Input id={question.id} type="number" inputMode="decimal" min="1" max="250" step="0.01" defaultValue={meters ? meters.toFixed(2) : ""} aria-invalid={Boolean(error)} aria-describedby={describedBy} onChange={(event) => { const numeric = Number(event.target.value.replace(",", ".")); if (!Number.isFinite(numeric)) return setValue(question.id, null, { shouldDirty: true }); const normalized = numeric > 3 ? numeric / 100 : numeric; setValue(question.id, Math.round(normalized * 1000) / 1000, { shouldDirty: true }); }} /><select aria-label="Unidade de altura" className="h-12 rounded-xl border border-slate-300 bg-white px-4" onChange={(event) => { const current = Number(value); if (!Number.isFinite(current)) return; const next = event.target.value === "cm" ? (current > 3 ? current / 100 : current) : current; setValue(question.id, next, { shouldDirty: true }); }} defaultValue="m"><option value="m">Metros</option><option value="cm">Centímetros</option></select></div>;
  }
  if (question.type === "multi") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return <div className="grid gap-3" role="group" aria-labelledby={`${question.id}-label`} aria-describedby={describedBy}>{optionsForSex(question, sex).map((option) => { const checked = selected.includes(option.value); return <label key={option.value} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 transition", checked ? "border-[var(--trizi-primary)] bg-[var(--trizi-primary)]/5 ring-1 ring-[var(--trizi-primary)]" : "border-slate-200 bg-white hover:border-slate-300")}><input type="checkbox" className="h-5 w-5 rounded accent-[var(--trizi-primary)]" checked={checked} onChange={() => setValue(question.id, checked ? selected.filter((item) => item !== option.value) : [...selected, option.value], { shouldDirty: true, shouldValidate: true })} /><span className="leading-relaxed text-slate-800">{option.label}</span></label>; })}</div>;
  }
  if (question.type === "scale") {
    return <div><div className="grid grid-cols-6 gap-2 sm:grid-cols-11" role="radiogroup" aria-labelledby={`${question.id}-label`} aria-describedby={describedBy}>{scaleOptions.map((option) => <button key={option.value} type="button" role="radio" aria-checked={value === option.value} onClick={() => setValue(question.id, option.value, { shouldDirty: true, shouldValidate: true })} className={cn("h-12 rounded-xl border text-base font-bold transition", value === option.value ? "border-[var(--trizi-primary)] bg-[var(--trizi-primary)] text-white" : "border-slate-200 bg-white text-slate-800 hover:border-slate-300")}>{option.label}</button>)}</div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>Nada</span><span>Muito</span></div></div>;
  }
  return <div className="grid gap-3" role="radiogroup" aria-labelledby={`${question.id}-label`} aria-describedby={describedBy}>{optionsForSex(question, sex).map((option) => <label key={option.value} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 transition", value === option.value ? "border-[var(--trizi-primary)] bg-[var(--trizi-primary)]/5 ring-1 ring-[var(--trizi-primary)]" : "border-slate-200 bg-white hover:border-slate-300")}><input type="radio" className="h-5 w-5 accent-[var(--trizi-primary)]" value={option.value} checked={value === option.value} onChange={() => setValue(question.id, option.value, { shouldDirty: true, shouldValidate: true })} /><span className="leading-relaxed text-slate-800">{option.label}</span></label>)}</div>;
}
