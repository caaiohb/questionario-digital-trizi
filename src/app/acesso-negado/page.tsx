import Link from "next/link";
export const metadata = { title: "Acesso negado", robots: { index: false, follow: false } };
export default function AccessDeniedPage() {
  return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm"><h1 className="text-3xl font-semibold">Acesso negado</h1><p className="mt-3 text-slate-600">Seu perfil não possui permissão para acessar esta área.</p><Link className="mt-6 inline-flex rounded-xl bg-[var(--trizi-primary)] px-5 py-3 font-semibold text-white" href="/painel">Voltar ao painel</Link></div></main>;
}
