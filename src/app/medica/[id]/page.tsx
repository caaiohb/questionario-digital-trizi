import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { requireDoctorArea } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerLabel, questionnaireSections } from "@/config/questionnaireConfig";
import { mergeCustomQuestions, toQuestionnaireQuestion } from "@/lib/custom-questions";
import type { PublicCustomQuestion } from "@/lib/custom-questions";
import type { StoredAnswers } from "@/types/questionnaire";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AiSummary } from "@/components/panel/ai-summary";
import { AttendedButton } from "@/components/doctor/doctor-actions";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const fmt = (value: string) => formatInTimeZone(new Date(value), TZ, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

export default async function DoctorSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireDoctorArea();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("questionnaire_submissions")
    .select("id,protocol,patient_name,patient_age,current_weight,desired_weight,height,answers,answers_archived_at,submitted_at,priority_alert,doctor_attended_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const submission = data as unknown as {
    id: string; protocol: string; patient_name: string; patient_age: number; current_weight: number; desired_weight: number; height: number;
    answers: StoredAnswers; answers_archived_at: string | null; submitted_at: string; priority_alert: boolean; doctor_attended_at: string | null;
  };
  const answers = (submission.answers ?? {}) as StoredAnswers;
  const archived = Boolean(submission.answers_archived_at) && Object.keys(answers).length === 0;

  const { data: customRows } = await admin.from("custom_questions").select("id,section_id,gender,text,type,required,sensitive,sort_order");
  const customQuestions = (customRows ?? []).map((row) =>
    toQuestionnaireQuestion({ id: row.id, sectionId: row.section_id, gender: row.gender, text: row.text, type: row.type, required: row.required, sensitive: row.sensitive, sortOrder: row.sort_order } as PublicCustomQuestion),
  );

  await admin.from("audit_logs").insert({ user_id: profile.id, action: "view_submission", entity_type: "questionnaire_submission", entity_id: id, metadata: { area: "medica" } });

  const attended = Boolean(submission.doctor_attended_at);

  return (
    <div className="space-y-6">
      <Link href="/medica" className="text-sm font-semibold text-[var(--trizi-primary)] hover:underline">← Voltar aos pacientes</Link>

      <Card className="p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold">{submission.patient_name}</h1>
              {submission.priority_alert && <Badge tone="danger">Prioritário</Badge>}
              <Badge tone={attended ? "success" : "warning"}>{attended ? "Atendido" : "Pendente"}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">{submission.protocol} · Enviado em {fmt(submission.submitted_at)}</p>
          </div>
          <AttendedButton id={id} attended={attended} redirectTo={attended ? undefined : "/medica"} />
        </div>
        <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-4">
          <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Idade</dt><dd className="mt-1 font-semibold">{submission.patient_age} anos</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Peso atual</dt><dd className="mt-1 font-semibold">{Number(submission.current_weight).toLocaleString("pt-BR")} kg</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Peso desejado</dt><dd className="mt-1 font-semibold">{Number(submission.desired_weight).toLocaleString("pt-BR")} kg</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Altura</dt><dd className="mt-1 font-semibold">{Number(submission.height).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} m</dd></div>
        </dl>
      </Card>

      <AiSummary id={id} archived={archived} />

      {archived && (
        <Card className="border-2 border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3"><Archive className="mt-0.5 shrink-0 text-amber-700" /><p className="text-sm text-amber-900">As respostas detalhadas deste paciente já foram inseridas no prontuário e removidas do sistema. O prompt guardado continua disponível acima, se existir.</p></div>
        </Card>
      )}

      {!archived && questionnaireSections.slice(1).map((section) => {
        const items = mergeCustomQuestions(section, customQuestions).map((question) => ({ question, stored: answers[question.id] })).filter((item) => item.stored);
        if (!items.length) return null;
        return (
          <Card key={section.id} className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h2 className="font-semibold">{section.title}</h2></div>
            <dl className="divide-y divide-slate-100">
              {items.map(({ question, stored }) => (
                <div key={question.id} className="grid gap-1 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(200px,0.65fr)] md:gap-8">
                  <dt className="text-sm leading-relaxed text-slate-600">{question.text}</dt>
                  <dd className="font-semibold text-slate-900">{answerLabel(question, stored.answer)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}