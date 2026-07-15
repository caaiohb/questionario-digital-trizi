import Link from "next/link";
export default function NotFound() {
  return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm"><p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">404</p><h1 className="mt-3 text-3xl font-semibold">Página não encontrada</h1><p className="mt-3 text-slate-600">O endereço informado não existe ou foi removido.</p><Link className="mt-6 inline-flex rounded-xl bg-[var(--trizi-primary)] px-5 py-3 font-semibold text-white" href="/questionario">Ir para o questionário</Link></div></main>;
}
