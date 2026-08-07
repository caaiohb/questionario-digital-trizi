"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Power, Trash2, User, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CustomQuestionRow } from "@/types/database";

const genderLabel: Record<string, string> = { todos: "Todos", feminino: "Só mulheres", masculino: "Só homens" };
const genderIcon: Record<string, typeof Users> = { todos: Users, feminino: User, masculino: User };
const typeLabel: Record<string, string> = { yes_no: "Sim/Não", text: "Texto curto", textarea: "Texto longo" };

export function CustomQuestionsManagement({ sections, questions }: { sections: Array<{ id: string; title: string }>; questions: CustomQuestionRow[] }) {
  const router = useRouter();
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [gender, setGender] = useState<"todos" | "feminino" | "masculino">("todos");
  const [text, setText] = useState("");
  const [type, setType] = useState<"yes_no" | "text" | "textarea">("yes_no");
  const [required, setRequired] = useState(true);
  const [sensitive, setSensitive] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState("");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/admin/custom-questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sectionId, gender, text, type, required, sensitive }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível criar a pergunta.");
      toast.success("Pergunta adicionada ao questionário.");
      setText("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setCreating(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/admin/custom-questions/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ active }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar.");
      toast.success(active ? "Pergunta reativada." : "Pergunta desativada.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoadingId("");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta pergunta definitivamente? Respostas já enviadas por pacientes não são afetadas.")) return;
    setLoadingId(id);
    try {
      const response = await fetch(`/api/admin/custom-questions/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível excluir.");
      toast.success("Pergunta excluída.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoadingId("");
    }
  }

  const bySection = sections
    .map((section) => ({ section, items: questions.filter((question) => question.section_id === section.id) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Plus size={20} />Adicionar pergunta</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="cq-section">Seção do questionário</label>
            <select id="cq-section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm focus:border-[var(--trizi-primary)]">
              {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="cq-gender">Mostrar para</label>
            <select id="cq-gender" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm focus:border-[var(--trizi-primary)]">
              <option value="todos">Todos os pacientes</option>
              <option value="feminino">Só pacientes do sexo feminino</option>
              <option value="masculino">Só pacientes do sexo masculino</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="cq-text">Texto da pergunta</label>
          <Textarea id="cq-text" value={text} onChange={(e) => setText(e.target.value)} required minLength={3} maxLength={500} className="min-h-20" placeholder="Ex: Tem histórico de alguma cirurgia bariátrica anterior?" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="cq-type">Tipo de resposta</label>
            <select id="cq-type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm focus:border-[var(--trizi-primary)]">
              <option value="yes_no">Sim/Não</option>
              <option value="text">Texto curto</option>
              <option value="textarea">Texto longo</option>
            </select>
          </div>
          <div className="flex items-end gap-6 pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="h-5 w-5 accent-[var(--trizi-primary)]" />Obrigatória</label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} className="h-5 w-5 accent-[var(--trizi-primary)]" />Sigilo reforçado</label>
          </div>
        </div>
        <Button className="mt-5" disabled={creating}>{creating ? <Loader2 className="animate-spin" /> : <Plus />}Adicionar pergunta</Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Perguntas adicionadas</h2></div>
        {bySection.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nenhuma pergunta personalizada ainda.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {bySection.map(({ section, items }) => (
              <div key={section.id} className="p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{section.title}</p>
                <div className="space-y-3">
                  {items.map((question) => {
                    const Icon = genderIcon[question.gender];
                    return (
                      <div key={question.id} className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${question.active ? "border-slate-200" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                        <div className="flex-1">
                          <p className="font-semibold">{question.text}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="neutral"><Icon size={12} className="mr-1 inline" />{genderLabel[question.gender]}</Badge>
                            <Badge tone="info">{typeLabel[question.type]}</Badge>
                            {question.required && <Badge tone="warning">Obrigatória</Badge>}
                            {question.sensitive && <Badge tone="danger">Sigilo</Badge>}
                            {!question.active && <Badge tone="neutral">Desativada</Badge>}
                          </div>
                          {question.creator?.nome && <p className="mt-2 text-xs text-slate-400">Criada por {question.creator.nome}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toggle(question.id, !question.active)} disabled={loadingId === question.id}><Power size={16} />{question.active ? "Desativar" : "Reativar"}</Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(question.id)} disabled={loadingId === question.id}><Trash2 size={16} />Excluir</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
