import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList, Eye, ShieldAlert } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { requireDoctorArea } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AttendedButton, CopyPromptButton, PendingWatcher } from "@/components/doctor/doctor-actions";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const fmt = (value: string) => formatInTimeZone(new Date(value), TZ, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

interface PendingRow {
  id: string;
  protocol: string;
  patient_name: string;
  patient_age: number;
  submitted_at: string;
  priority_alert: boolean;
  answers_archived_at: string | null;
  ai_prompt_text: string | null;
}

interface AttendedRow {
  id: string;
  protocol: string;
  patient_name: string;
  doctor_attended_at: string;
  doctor_attended_by: string | null;
}

export default async function DoctorHomePage() {
  await requireDoctorArea();
  const admin = createAdminClient();
  const [pendingResult, attendedResult] = await Promise.all([
    admin
      .from("questionnaire_submissions")
      .select("id,protocol,patient_name,patient_age,submitted_at,priority_alert,answers_archived_at,ai_prompt_text")
      .is("doctor_attended_at", null)
      .is("deleted_at", null)
      .order("priority_alert", { ascending: false })
      .order("submitted_at", { ascending: true })
      .limit(100),
    admin
      .from("questionnaire_submissions")
      .select("id,protocol,patient_name,doctor_attended_at,doctor_attended_by")
      .not("doctor_attended_at", "is", null)
      .is("deleted_at", null)
      .order("doctor_attended_at", { ascending: false })
      .limit(10),
  ]);

  const setupError = pendingResult.error ? "Não foi possível carregar os pendentes. Confirme que a migration da área da médica foi executada no Supabase." : null;
  const pending = (pendingResult.data ?? []) as unknown as PendingRow[];
  const attended = (attendedResult.data ?? []) as unknown as AttendedRow[];
  const markerIds = Array.from(new Set(attended.map((row) => row.doctor_attended_by).filter((value): value is string => Boolean(value))));
  const markers = markerIds.length ? await admin.from("profiles").select("id,nome,perfil").in("id", markerIds) : { data: [] };
  const markerById = new Map(((markers.data ?? []) as Array<{ id: string; nome: string; perfil: string }>).map((m) => [m.id, m]));
  const priorityCount = pending.filter((row) => row.priority_alert).length;

  return (
    <div className="space-y-6">
      <PendingWatcher count={pending.length} />
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Área da médica</p>
        <h1 className="mt-2 text-3xl font-semibold">Pacientes aguardando atendimento</h1>
      </div>

      {setupError && <Card className="border-2 border-red-200 bg-red-50 p-5 text-red-900">{setupError}</Card>}

      {pending.length > 0 ? (
        <div role="alert" className="flex gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950">
          <AlertTriangle className="mt-0.5 shrink-0" />
          <div>
            <p className="text-lg font-bold">{pending.length} {pending.length === 1 ? "paciente aguardando" : "pacientes aguardando"} o seu atendimento</p>
            <p className="mt-1 text-sm">Copie o prompt, cole no seu Claude e, depois do atendimento, marque como atendido para tirar o alerta.</p>
            {priorityCount > 0 && <p className="mt-2 flex items-center gap-2 text-sm font-bold text-red-800"><ShieldAlert size={16} />{priorityCount} com atenção prioritária (resposta de segurança emocional).</p>}
          </div>
        </div>
      ) : (
        !setupError && (
          <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <CheckCircle2 className="mt-0.5 shrink-0" />
            <div><p className="font-bold">Tudo em dia!</p><p className="mt-1 text-sm">Nenhum paciente aguardando atendimento no momento. Esta tela atualiza sozinha.</p></div>
          </div>
        )
      )}

      <div className="space-y-4">
        {pending.map((row) => {
          const noAnswers = Boolean(row.answers_archived_at) && !row.ai_prompt_text;
          return (
            <Card key={row.id} className={`p-5 ${row.priority_alert ? "border-2 border-red-300" : ""}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{row.patient_name}</h2>
                    {row.priority_alert && <Badge tone="danger">Prioritário</Badge>}
                    <Badge tone="warning">Pendente</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{row.patient_age} anos · Enviado em {fmt(row.submitted_at)} · {row.protocol}</p>
                  {noAnswers && <p className="mt-2 text-sm text-amber-800">As respostas deste paciente já foram arquivadas e não há prompt disponível. Você pode apenas marcar como atendido.</p>}
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  {!noAnswers && <CopyPromptButton id={row.id} />}
                  <Link href={`/medica/${row.id}`}><Button variant="secondary"><Eye size={18} />Ver questionário</Button></Link>
                  <AttendedButton id={row.id} attended={false} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {attended.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-semibold"><ClipboardList size={18} />Atendidos recentemente</summary>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {attended.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{row.patient_name}</p>
                  <p className="text-xs text-slate-500">Atendido em {fmt(row.doctor_attended_at)}{(() => { const m = row.doctor_attended_by ? markerById.get(row.doctor_attended_by) : null; return m && m.perfil !== "doctor" ? ` · marcado por ${m.nome}` : ""; })()} · {row.protocol}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/medica/${row.id}`}><Button size="sm" variant="ghost"><Eye size={16} />Ver</Button></Link>
                  <AttendedButton id={row.id} attended size="sm" />
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}