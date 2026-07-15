"use client";
import { Clock3, ShieldCheck } from "lucide-react";
import { InstituteLogo } from "@/components/brand/logo";
import type { PublicSettings } from "@/types/questionnaire";

export function PublicHeader({ settings }: { settings: PublicSettings }) {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><InstituteLogo logoUrl={settings.logoUrl} institutionName={settings.institutionName} /><div className="flex gap-4 text-sm text-slate-600"><span className="flex items-center gap-1.5"><Clock3 size={17} aria-hidden />Aproximadamente {settings.estimatedMinutes} min</span><span className="flex items-center gap-1.5"><ShieldCheck size={17} aria-hidden />Ambiente seguro</span></div></div></header>;
}
