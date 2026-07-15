import Link from "next/link";
import { LockKeyhole } from "lucide-react";
export function PublicFooter() {
  return <footer className="mt-12 border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 text-sm text-slate-500"><span>© {new Date().getFullYear()} Instituto Trizi</span><Link href="/login" aria-label="Acesso de funcionários" title="Acesso de funcionários" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><LockKeyhole size={16} /></Link></div></footer>;
}
