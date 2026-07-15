"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Menu, Send, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
import { InstituteLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";
import type { CurrentProfile } from "@/lib/auth";

const baseItems = [
  { href: "/painel", label: "Visão geral", icon: BarChart3, exact: true },
  { href: "/painel/respostas", label: "Questionários", icon: ClipboardList },
  { href: "/painel/convites", label: "Convites", icon: Send },
];
const adminItems = [
  { href: "/painel/usuarios", label: "Funcionários", icon: Users },
  { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
  { href: "/painel/auditoria", label: "Auditoria", icon: ShieldCheck },
];

export function PanelShell({ profile, children }: { profile: CurrentProfile; children: React.ReactNode }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false); const items = profile.perfil === "administrator" ? [...baseItems, ...adminItems] : baseItems;
  const nav = <><div className="border-b border-slate-200 px-5 py-5"><InstituteLogo institutionName="Instituto Trizi" compact /></div><nav className="flex-1 space-y-1 p-3">{items.map((item) => { const active = item.href === "/painel" ? pathname === item.href : pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition", active ? "bg-[var(--trizi-primary)] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}><Icon size={19} />{item.label}</Link>; })}</nav><div className="border-t border-slate-200 p-4"><p className="truncate text-sm font-semibold">{profile.nome}</p><p className="truncate text-xs text-slate-500">{profile.perfil === "administrator" ? "Administrador" : "Funcionário"}</p><div className="mt-3"><SignOutButton /></div></div></>;
  return <div className="min-h-screen bg-slate-50"><aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">{nav}</aside><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden"><InstituteLogo institutionName="Instituto Trizi" compact /><button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100" aria-label="Abrir menu"><Menu /></button></header>{open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/40" aria-label="Fechar menu" onClick={() => setOpen(false)} /><aside className="relative flex h-full w-72 flex-col bg-white shadow-xl"><button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Fechar menu"><X /></button>{nav}</aside></div>}<main className="lg:pl-64"><div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</div></main></div>;
}
