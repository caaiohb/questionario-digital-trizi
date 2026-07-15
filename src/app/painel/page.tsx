import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Clock3, Inbox, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDashboardStats } from "@/lib/data/submissions";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/panel/stat-card";
import { StatusBadge } from "@/components/panel/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SubmissionStatus } from "@/types/database";

export default async function DashboardPage() {
  const [stats, supabase] = await Promise.all([getDashboardStats(), createClient()]);
  const { data: recent } = await supabase.from("questionnaire_submissions").select("id,patient_name,protocol,submitted_at,status,priority_alert").order("submitted_at", { ascending: false }).limit(8);
  return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Painel interno</p><h1 className="mt-2 text-3xl font-semibold">Visão geral</h1><p className="mt-2 text-slate-600">Acompanhe os questionários recebidos pelo Instituto Trizi.</p></div><Link href="/painel/respostas"><Button><Search size={18} />Pesquisar questionários</Button></Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total ativo" value={stats.total} icon={ClipboardList} /><StatCard label="Novos" value={stats.newCount} icon={Inbox} tone="warning" /><StatCard label="Em análise" value={stats.inReview} icon={Clock3} /><StatCard label="No prontuário" value={stats.inserted} icon={CheckCircle2} tone="success" /><StatCard label="Alertas prioritários" value={stats.priority} icon={AlertTriangle} tone="danger" /><StatCard label="Recebidos hoje" value={stats.today} icon={CalendarDays} /><StatCard label="Últimos 7 dias" value={stats.lastSevenDays} icon={CalendarDays} /></div><Card className="mt-7 overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-semibold">Recebidos recentemente</h2><p className="mt-1 text-sm text-slate-500">Nenhuma resposta clínica é exibida nesta lista.</p></div><Link href="/painel/respostas" className="text-sm font-semibold text-[var(--trizi-primary)] hover:underline">Ver todos</Link></div>{recent?.length ? <div className="divide-y divide-slate-100">{recent.map((item) => <Link key={item.id} href={`/painel/respostas/${item.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_180px_160px_auto] sm:items-center"><div><p className="font-semibold text-slate-900">{item.patient_name}</p><p className="mt-1 text-xs text-slate-500">{item.protocol}</p></div><p className="text-sm text-slate-600">{format(new Date(item.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p><StatusBadge status={item.status as SubmissionStatus} /><div>{item.priority_alert && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800"><AlertTriangle size={14} />Prioritário</span>}</div></Link>)}</div> : <div className="px-5 py-12 text-center text-slate-500">Nenhum questionário recebido.</div>}</Card></div>;
}
