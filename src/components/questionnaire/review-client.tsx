"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Edit3, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { answerLabel, isQuestionVisible, getVisibleSections, questionsById, QUESTIONNAIRE_VERSION } from "@/config/questionnaireConfig";
import { mergeCustomQuestions } from "@/lib/custom-questions";
import { useCustomQuestions } from "@/hooks/use-custom-questions";
import { clearDraft, loadDraft, RESULT_KEY } from "@/lib/draft";
import { validateQuestionnaireAnswers } from "@/lib/validation/questionnaire";
import { usePublicSettings } from "@/hooks/use-public-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import type { QuestionnaireDraft } from "@/lib/draft";

export function ReviewClient() {
  const router = useRouter();
  const settings = usePublicSettings();
  const customQuestions = useCustomQuestions();
  const [draft, setDraft] = useState<QuestionnaireDraft | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { const timer = window.setTimeout(() => setDraft(loadDraft()), 0); return () => window.clearTimeout(timer); }, []);

  async function submit() {
    if (!draft || !confirm || sending) return;
    const validation = validateQuestionnaireAnswers(draft.answers, customQuestions);
    if (!validation.success) {
      toast.error("Existem respostas obrigatórias pendentes.");
      const questionId = Object.keys(validation.errors)[0];
      const question = questionsById.get(questionId) ?? customQuestions.find((item) => item.id === questionId);
      const stage = getVisibleSections(draft.answers).findIndex((section) => section.id === question?.sectionId);
      router.push(`/questionario?etapa=${Math.max(stage, 0)}`);
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientSubmissionId: draft.clientSubmissionId, answers: validation.answers, consentAccepted: true, consentVersion: draft.consentVersion || settings.consentVersion, consentAcceptedAt: draft.consentAcceptedAt ?? new Date().toISOString(), questionnaireVersion: QUESTIONNAIRE_VERSION, inviteToken: draft.inviteToken ?? null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o questionário.");
      sessionStorage.setItem(RESULT_KEY, JSON.stringify({ protocol: data.protocol, message: data.message || settings.finalMessage }));
      clearDraft();
      router.replace("/questionario/concluido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar o questionário.");
      setSending(false);
    }
  }

  if (!draft) return <><PublicHeader settings={settings} /><main className="mx-auto min-h-[65vh] max-w-3xl px-5 py-12"><Card className="p-8 text-center"><AlertTriangle className="mx-auto text-amber-600" size={38} /><h1 className="mt-4 text-2xl font-semibold">Rascunho não encontrado</h1><p className="mt-2 text-slate-600">O rascunho pode ter expirado ou sido apagado. Inicie o questionário novamente.</p><Button className="mt-6" onClick={() => router.replace("/questionario")}>Voltar ao início</Button></Card></main><PublicFooter /></>;

  const visibleSections = getVisibleSections(draft.answers);
  return <><PublicHeader settings={settings} /><main className="mx-auto max-w-5xl px-5 py-8"><div className="mb-7"><p className="text-sm font-bold text-[#8c744f]">Revisão final</p><h1 className="mt-1 text-3xl font-semibold">Confira suas respostas</h1><p className="mt-2 text-slate-600">Você pode voltar a qualquer etapa antes do envio definitivo.</p></div><div className="space-y-5">{visibleSections.map((section, stageIndex) => { const items = mergeCustomQuestions(section, customQuestions).filter((question) => isQuestionVisible(question, draft.answers) && draft.answers[question.id] !== undefined && draft.answers[question.id] !== ""); if (!items.length) return null; return <Card key={section.id} className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4"><h2 className="font-semibold">{section.title}</h2><button onClick={() => router.push(`/questionario?etapa=${stageIndex}`)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--trizi-primary)] hover:bg-white"><Edit3 size={16} />Editar</button></div><dl className="divide-y divide-slate-100">{items.map((question) => <div key={question.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)] sm:gap-6"><dt className="text-sm leading-relaxed text-slate-600">{question.text}</dt><dd className="font-semibold text-slate-900">{answerLabel(question, draft.answers[question.id])}</dd></div>)}</dl></Card>; })}</div><Card className="mt-7 p-5"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} className="mt-1 h-5 w-5 accent-[var(--trizi-primary)]" /><span className="text-sm leading-relaxed"><strong>Confirmo que revisei as respostas</strong> e autorizo o envio definitivo ao Instituto Trizi conforme o termo de consentimento aceito.</span></label></Card><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="secondary" onClick={() => router.push(`/questionario?etapa=${visibleSections.length - 1}`)}>Voltar e editar</Button><Button size="lg" disabled={!confirm || sending} onClick={submit}>{sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}{sending ? "Enviando com segurança..." : "Confirmar e enviar"}</Button></div></main><PublicFooter /></>;
}
