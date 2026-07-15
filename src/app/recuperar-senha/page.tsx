import type { Metadata } from "next";
import { InstituteLogo } from "@/components/brand/logo";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false, follow: false } };
export default function ResetPage() { return <main className="min-h-screen grid place-items-center px-5 py-10"><div className="w-full max-w-md"><div className="mb-7 flex justify-center"><InstituteLogo institutionName="Instituto Trizi" /></div><div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"><h1 className="text-2xl font-semibold">Recuperar acesso</h1><p className="mt-2 mb-7 text-sm text-slate-600">Informe seu e-mail corporativo para receber as instruções.</p><ResetPasswordForm /></div></div></main>; }
