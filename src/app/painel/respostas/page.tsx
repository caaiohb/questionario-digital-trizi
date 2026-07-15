import Link from "next/link";
import { AlertTriangle, ChevronRight, Download, FileSearch } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { listSubmissions } from "@/lib/data/submissions";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { SubmissionFilters } from "@/components/panel/submission-filters";
import { Pagination } from "@/components/panel/pagination";
import { StatusBadge } from "@/components/panel/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SubmissionStatus } from "@/types/database";

export default async function ResponsesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams; const profile = await requireStaff(); const supabase = await createClient();
  const [{ data, count, page, pages }, { data: profiles }] = await Promise.all([listSubmissions(params), supabase.from("profiles").select("id,nome").eq("ativo", true).order("nome")]);
  const exportParams = new URLSearchParams(); for (const key of ["dateFrom", "dateTo", "status", "priority", "assigned"]) if (params[key]) exportParams.set(key, params[key]!);
  return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Questionários</p><h1 className="mt-2 text-3xl font-semibold">Respostas recebidas</h1><p className="mt-2 text-slate-600">{count.toLocaleString("pt-BR")} registro(s) encontrado(s).</p></div>{profile.perfil === "administrator" && <a href={`/api/exports/csv?${exportParams.toString()}`}><Button variant="secondary"><Download size={18} />Exportar CSV</Button></a>}</div><div className="mt-7"><SubmissionFilters profiles={(profiles ?? []) as Array<{ id: string; nome: string }>} defaults={params} /></div><Card className="mt-5 overflow-hidden"><div className="hidden grid-cols-[minmax(220px,1.2fr)_110px_175px_150px_160px_40px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid"><span>Paciente</span><span>Idade</span><span>Envio</span><span>Status</span><span>Responsável</span><span /></div>{data.length ? <div className="divide-y divide-slate-100">{data.map((item: any) => <Link key={item.id} href={`/painel/respostas/${item.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[minmax(220px,1.2fr)_110px_175px_150px_160px_40px] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{item.patient_name}</p>{item.priority_alert && <span title="Atenção prioritária" className="text-red-700"><AlertTriangle size={17} /></span>}{item.possible_duplicate && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Possível duplicidade</span>}</div><p className="mt-1 text-xs text-slate-500">{item.protocol}</p></div><p className="text-sm text-slate-600"><span className="lg:hidden">Idade: </span>{item.patient_age} anos</p><p className="text-sm text-slate-600">{format(new Date(item.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p><div><StatusBadge status={item.status as SubmissionStatus} /></div><p className="truncate text-sm text-slate-600">{item.assigned_profile?.nome ?? "Não atribuído"}</p><ChevronRight size={18} className="hidden text-slate-400 lg:block" /></Link>)}</div> : <div className="px-5 py-14 text-center"><FileSearch className="mx-auto text-slate-400" size={40} /><h2 className="mt-4 font-semibold">Nenhum registro encontrado</h2><p className="mt-1 text-sm text-slate-500">Revise os filtros utilizados.</p></div>}</Card><Pagination page={page} pages={pages} searchParams={params} /></div>;
}
