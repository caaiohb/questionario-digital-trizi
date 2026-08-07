"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, LockKeyhole, MailWarning, ShieldCheck } from "lucide-react";
import { questionnaireSections, isQuestionVisible, getVisibleSections, menopauseAutoAnswerQuestionIds, menopauseStatuses, normalizeMenopauseAnswers } from "@/config/questionnaireConfig";
import { mergeCustomQuestions } from "@/lib/custom-questions";
import { useCustomQuestions } from "@/hooks/use-custom-questions";
import { usePublicSettings } from "@/hooks/use-public-settings";
import { loadDraft, saveDraft } from "@/lib/draft";
import { validateSectionAnswers } from "@/lib/validation/questionnaire";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { QuestionCard } from "./question-card";
import type { RawAnswers } from "@/types/questionnaire";
import type { InviteState } from "@/app/questionario/page";

export function QuestionnaireWizard({ initialStage = 0, invite = null }: { initialStage?: number; invite?: InviteState | null }) {
  const settings = usePublicSettings();
  const customQuestions = useCustomQuestions();
  const router = useRouter();
  const [stage, setStage] = useState(Math.max(0, Math.min(initialStage, questionnaireSections.length - 1)));
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [clientSubmissionId, setClientSubmissionId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = useForm<RawAnswers>({ defaultValues: {} });
  const answers = useWatch({ control: form.control }) as RawAnswers;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const draft = loadDraft();
      const id = draft?.clientSubmissionId ?? crypto.randomUUID();
      setClientSubmissionId(id);
      if (draft) {
        form.reset(draft.answers);
        setConsentAccepted(draft.consentAccepted);
        setConsentAcceptedAt(draft.consentAcceptedAt);
        setStarted(draft.consentAccepted);
      }
      if (invite && invite.status === "pending" && !invite.expired && !draft?.answers.identification_full_name) {
        form.setValue("identification_full_name", invite.patientName, { shouldDirty: true });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [form, invite]);

  useEffect(() => {
    if (!clientSubmissionId) return;
    const timer = window.setTimeout(() => saveDraft({ clientSubmissionId, answers, consentAccepted, consentAcceptedAt, consentVersion: settings.consentVersion, inviteToken: invite && invite.status === "pending" && !invite.expired ? invite.token : null }), 250);
    return () => window.clearTimeout(timer);
  }, [answers, clientSubmissionId, consentAccepted, consentAcceptedAt, settings.consentVersion, invite]);

  useEffect(() => {
    const status = answers.menstrual_status;
    if (typeof status === "string" && menopauseStatuses.has(status)) {
      for (const id of menopauseAutoAnswerQuestionIds) {
        const value = form.getValues(id);
        if (value === undefined || value === null || value === "") {
          form.setValue(id, "nao_aplica", { shouldDirty: true });
        }
      }
    }
  }, [answers.menstrual_status, form, answers]);

  const visibleSections = useMemo(() => getVisibleSections(answers), [answers]);
  const clampedStage = Math.min(stage, visibleSections.length - 1);
  const section = visibleSections[clampedStage];
  const visibleQuestions = useMemo(() => mergeCustomQuestions(section, customQuestions).filter((question) => isQuestionVisible(question, answers)), [section, answers, customQuestions]);
  const progress = Math.round(((clampedStage + 1) / visibleSections.length) * 100);
  const priorityYes = answers.emotional_death_thoughts === "sim";

  function begin() {
    if (!consentAccepted) return;
    const acceptedAt = new Date().toISOString();
    setConsentAcceptedAt(acceptedAt);
    setStarted(true);
  }

  function goBack() {
    setErrors({});
    setStage((value) => Math.max(0, value - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goForward() {
    const normalized = normalizeMenopauseAnswers(form.getValues());
    for (const [key, value] of Object.entries(normalized)) form.setValue(key, value, { shouldDirty: false });
    const sectionErrors = validateSectionAnswers(section.id, normalized, customQuestions);
    setErrors(sectionErrors);
    if (Object.keys(sectionErrors).length) {
      const first = document.getElementById(Object.keys(sectionErrors)[0]);
      first?.focus();
      return;
    }
    if (clampedStage === visibleSections.length - 1) {
      saveDraft({ clientSubmissionId, answers: normalized, consentAccepted, consentAcceptedAt, consentVersion: settings.consentVersion, inviteToken: invite && invite.status === "pending" && !invite.expired ? invite.token : null });
      router.push("/questionario/revisao");
      return;
    }
    setStage(clampedStage + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (invite && (invite.status !== "pending" || invite.expired)) {
    const messages: Record<string, string> = {
      completed: "Este link já foi utilizado para o envio de um questionário. Se você acredita que isso é um engano, entre em contato com a recepção do Instituto Trizi.",
      cancelled: "Este link foi cancelado pela equipe do Instituto Trizi. Solicite um novo link à recepção.",
      expired: "Este link expirou. Solicite um novo link à recepção do Instituto Trizi.",
    };
    const message = invite.expired ? messages.expired : messages[invite.status] ?? messages.expired;
    return <><PublicHeader settings={settings} /><main className="mx-auto min-h-[65vh] max-w-2xl px-5 py-12"><Card className="p-8 text-center"><MailWarning className="mx-auto text-amber-600" size={38} /><h1 className="mt-4 text-2xl font-semibold">Link não disponível</h1><p className="mt-2 leading-relaxed text-slate-600">{message}</p></Card></main><PublicFooter /></>;
  }

  if (!started) {
    return <><PublicHeader settings={settings} /><main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-10"><Card className="overflow-hidden"><div className="bg-[var(--trizi-primary)] px-6 py-8 text-white sm:px-10"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#e5cfad]">Instituto Trizi</p><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{settings.questionnaireName}</h1><p className="mt-4 max-w-2xl leading-relaxed text-white/85">{settings.introText}</p></div><div className="space-y-6 p-6 sm:p-10"><div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900"><ShieldCheck className="mt-0.5 shrink-0" /><div><p className="font-semibold">Privacidade e segurança</p><p className="mt-1 text-sm leading-relaxed">As informações de saúde são dados pessoais sensíveis e serão acessadas somente por pessoas autorizadas.</p></div></div><div><h2 className="text-lg font-semibold">Termo de consentimento</h2><p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{settings.consentText}</p></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={consentAccepted} onChange={(event) => setConsentAccepted(event.target.checked)} className="mt-1 h-5 w-5 accent-[var(--trizi-primary)]" /><span className="text-sm leading-relaxed">Li e aceito o termo de consentimento e a <a href="/politica-de-privacidade" target="_blank" className="font-semibold text-[var(--trizi-primary)] underline">política de privacidade</a>.</span></label><Button type="button" size="lg" className="w-full" disabled={!consentAccepted} onClick={begin}>Iniciar questionário <ChevronRight size={20} /></Button><p className="flex items-center justify-center gap-2 text-xs text-slate-500"><LockKeyhole size={14} />O rascunho é mantido somente nesta sessão do navegador e é apagado após o envio.</p></div></Card></main><PublicFooter /></>;
  }

  return <><PublicHeader settings={settings} /><main className="mx-auto max-w-5xl px-5 py-8"><div className="mb-7"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-[#8c744f]">Etapa {clampedStage + 1} de {visibleSections.length}</p><h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{section.title}</h1>{section.description && <p className="mt-2 text-slate-600">{section.description}</p>}</div><span className="text-sm font-semibold text-slate-600">{progress}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do questionário"><div className="h-full rounded-full bg-[var(--trizi-primary)] transition-all" style={{ width: `${progress}%` }} /></div></div>{priorityYes && <div role="alert" className="mb-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><AlertTriangle className="mt-0.5 shrink-0" /><div><p className="font-bold">Você não precisa enfrentar isso sozinha.</p><p className="mt-1 text-sm leading-relaxed">{settings.emergencyMessage}</p><div className="mt-3 flex flex-wrap gap-2">{settings.emergencyContacts.map((contact) => <span key={`${contact.label}-${contact.value}`} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-sm">{contact.label}: {contact.value}</span>)}</div></div></div>}<div className="space-y-4">{visibleQuestions.map((question, index) => <QuestionCard key={question.id} question={question} index={index + 1} value={answers[question.id]} register={form.register} setValue={form.setValue} error={errors[question.id]} />)}</div><div className="sticky bottom-0 z-10 -mx-5 mt-8 border-t border-slate-200 bg-[#f6f7f4]/95 px-5 py-4 backdrop-blur"><div className="mx-auto flex max-w-5xl justify-between gap-3"><Button type="button" variant="secondary" onClick={goBack} disabled={clampedStage === 0}><ChevronLeft size={19} />Voltar</Button><Button type="button" onClick={goForward}>{clampedStage === visibleSections.length - 1 ? "Revisar respostas" : "Continuar"}<ChevronRight size={19} /></Button></div></div></main><PublicFooter /></>;
}
