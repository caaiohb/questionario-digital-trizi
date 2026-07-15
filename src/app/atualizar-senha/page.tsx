import type { Metadata } from "next";
import { InstituteLogo } from "@/components/brand/logo";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
export const metadata: Metadata = { title: "Atualizar senha", robots: { index: false, follow: false } };
export default function UpdatePasswordPage() { return <main className="min-h-screen grid place-items-center px-5 py-10"><div className="w-full max-w-md"><div className="mb-7 flex justify-center"><InstituteLogo institutionName="Instituto Trizi" /></div><div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"><h1 className="text-2xl font-semibold">Defina uma nova senha</h1><p className="mt-2 mb-7 text-sm text-slate-600">A nova senha será usada no próximo acesso ao painel.</p><UpdatePasswordForm /></div></div></main>; }
