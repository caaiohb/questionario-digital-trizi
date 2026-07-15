import type { Metadata } from "next";
import { Suspense } from "react";
import { InstituteLogo } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Login de funcionários", robots: { index: false, follow: false } };
export default function LoginPage() { return <main className="min-h-screen grid place-items-center px-5 py-10"><div className="w-full max-w-md"><div className="mb-7 flex justify-center"><InstituteLogo institutionName="Instituto Trizi" /></div><div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"><p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Área interna</p><h1 className="mt-2 text-2xl font-semibold">Acesso de funcionários</h1><p className="mt-2 mb-7 text-sm leading-relaxed text-slate-600">Use apenas sua conta individual. Todas as visualizações e ações são registradas.</p><Suspense><LoginForm /></Suspense></div></div></main>; }
