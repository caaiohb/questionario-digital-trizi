"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, Loader2, Lock, Pencil, Plus, Power, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Gender = "todos" | "feminino" | "masculino";

export interface ManagerQuestion {
  id: string;
  kind: "padrao" | "personalizada";
  customId?: string;
  text: string;
  type: string;
  required: boolean;
  sensitive: boolean;
  active: boolean;
  removed: boolean;
  locked: boolean;
  gender: Gender;
  dependents: number;
}

export interface ManagerSection {
  id: string;
  title: string;
  gender: Gender;
  questions: ManagerQuestion[];
}

const genderLabel: Record<Gender, string> = { todos: "Todos", feminino: "Só mulheres", masculino: "Só homens" };
const typeLabel: Record<string, string> = {
  yes_no: "Sim/Não", yes_no_na: "Sim/Não/N.A.", yes_no_prefer_not: "Sim/Não", radio: "Escolha única", text: "Texto curto", textarea: "Texto longo",
  number: "Número", height: "Altura", cpf: "CPF",
};
const selectClass = "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm focus:border-[var(--trizi-primary)]";

async function call(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || "Não foi possível concluir a ação.");
  return data;
}

export function QuestionManager({ sections }: { sections: ManagerSection[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editText, setEditText] = useState("");
  const [editRequired, setEditRequired] = useState(true);
  const [editGender, setEditGender] = useState<Gender>("todos");

  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [gender, setGender] = useState<Gender>("todos");
  const [text, setText] = useState("");
  const [type, setType] = useState<"yes_no" | "text" | "textarea">("yes_no");
  const [required, setRequired] = useState(true);
  const [sensitive, setSensitive] = useState(false);

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro");
    } finally {
      setBusy("");
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    await run("create", async () => {
      await call("/api/admin/custom-questions", "POST", { sectionId, gender, text, type, required, sensitive });
      setText("");
    }, "Pergunta adicionada ao final da seção.");
  }

  function toggleActive(question: ManagerQuestion) {
    const next = !question.active;
    if (!next && question.dependents > 0 && !window.confirm(`Outras ${question.dependents} pergunta(s) dependem da resposta desta e deixarão de aparecer. Desativar mesmo assim?`)) return;
    const url = question.kind === "personalizada" ? `/api/admin/custom-questions/${question.customId}` : `/api/admin/questions/${question.id}`;
    void run(question.id, () => call(url, "PATCH", { active: next }), next ? "Pergunta ativada." : "Pergunta desativada.");
  }

  function removeQuestion(question: ManagerQuestion) {
    if (question.kind === "personalizada") {
      if (!window.confirm("Excluir esta pergunta definitivamente? Respostas já enviadas por pacientes não são afetadas.")) return;
      void run(question.id, () => call(`/api/admin/custom-questions/${question.customId}`, "DELETE"), "Pergunta excluída.");
      return;
    }
    const extra = question.dependents > 0 ? ` Outras ${question.dependents} pergunta(s) dependem da resposta desta e deixarão de aparecer.` : "";
    if (!window.confirm(`Remover esta pergunta do questionário?${extra} Você poderá restaurá-la depois.`)) return;
    void run(question.id, () => call(`/api/admin/questions/${question.id}`, "PATCH", { removed: true }), "Pergunta removida do questionário.");
  }

  function restore(question: ManagerQuestion) {
    void run(question.id, () => call(`/api/admin/questions/${question.id}`, "PATCH", { removed: false }), "Pergunta restaurada.");
  }

  function move(section: ManagerSection, index: number, direction: -1 | 1) {
    const list = section.questions.filter((question) => !question.removed);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const ids = list.map((question) => question.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void run(`move-${section.id}`, () => call("/api/admin/questions/order", "PUT", { sectionId: section.id, ids }), "Ordem atualizada.");
  }

  function startEdit(question: ManagerQuestion) {
    setEditingId(question.id);
    setEditText(question.text);
    setEditRequired(question.required);
    setEditGender(question.gender);
  }

  function saveEdit(question: ManagerQuestion) {
    void run(question.id, async () => {
      await call(`/api/admin/custom-questions/${question.customId}`, "PATCH", { text: editText, required: editRequired, gender: editGender });
      setEditingId("");
    }, "Pergunta atualizada.");
  }

  const totals = sections.reduce(
    (acc, section) => {
      for (const question of section.questions) {
        if (question.removed) acc.removed += 1;
        else if (question.active) acc.active += 1;
        else acc.inactive += 1;
      }
      return acc;
    },
    { active: 0, inactive: 0, removed: 0 },
  );

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Plus size={20} />Adicionar pergunta</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="qm-section">Seção do questionário</label>
            <select id="qm-section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={selectClass}>
              {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="qm-gender">Mostrar para</label>
            <select id="qm-gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={selectClass}>
              <option value="todos">Todos os pacientes</option>
              <option value="feminino">Só pacientes do sexo feminino</option>
              <option value="masculino">Só pacientes do sexo masculino</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="qm-text">Texto da pergunta</label>
          <Textarea id="qm-text" value={text} onChange={(e) => setText(e.target.value)} required minLength={3} maxLength={500} className="min-h-20" placeholder="Ex: Tem histórico de alguma cirurgia bariátrica anterior?" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="qm-type">Tipo de resposta</label>
            <select id="qm-type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={selectClass}>
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
        <Button className="mt-5" disabled={busy === "create"}>{busy === "create" ? <Loader2 className="animate-spin" /> : <Plus />}Adicionar pergunta</Button>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge tone="success">{totals.active} ativas</Badge>
        <Badge tone="neutral">{totals.inactive} desativadas</Badge>
        <Badge tone="warning">{totals.removed} removidas</Badge>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const visible = section.questions.filter((question) => !question.removed);
          const removed = section.questions.filter((question) => question.removed);
          const activeCount = visible.filter((question) => question.active).length;
          return (
            <details key={section.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{section.title}</h2>
                  {section.gender !== "todos" && <Badge tone="info">{genderLabel[section.gender]}</Badge>}
                  <span className="text-xs text-slate-500">{activeCount} ativas de {visible.length}</span>
                </div>
                <ChevronDown size={20} className="shrink-0 text-slate-500 transition group-open:rotate-180" />
              </summary>
              <div className="space-y-3 border-t border-slate-100 p-4">
                {visible.map((question, index) => {
                  const isBusy = busy === question.id || busy === `move-${section.id}`;
                  const editing = editingId === question.id;
                  return (
                    <div key={question.id} className={`rounded-xl border p-4 ${question.active ? "border-slate-200" : "border-slate-100 bg-slate-50"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className={`flex-1 ${question.active ? "" : "opacity-60"}`}>
                          <p className="text-xs font-bold text-slate-400">#{index + 1}</p>
                          {editing ? (
                            <div className="mt-1 space-y-3">
                              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} minLength={3} maxLength={500} className="min-h-20" />
                              <div className="flex flex-wrap items-center gap-4">
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editRequired} onChange={(e) => setEditRequired(e.target.checked)} className="h-5 w-5 accent-[var(--trizi-primary)]" />Obrigatória</label>
                                <select value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm">
                                  <option value="todos">Todos os pacientes</option>
                                  <option value="feminino">Só sexo feminino</option>
                                  <option value="masculino">Só sexo masculino</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveEdit(question)} disabled={isBusy || editText.trim().length < 3}>{isBusy ? <Loader2 className="animate-spin" size={16} /> : null}Salvar</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId("")}>Cancelar</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="font-semibold">{question.text}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone={question.kind === "personalizada" ? "info" : "neutral"}>{question.kind === "personalizada" ? "Personalizada" : "Padrão"}</Badge>
                            <Badge tone="neutral">{typeLabel[question.type] ?? question.type}</Badge>
                            {question.gender !== "todos" && section.gender === "todos" && <Badge tone="neutral">{genderLabel[question.gender]}</Badge>}
                            {question.required && <Badge tone="warning">Obrigatória</Badge>}
                            {question.sensitive && <Badge tone="danger">Sigilo</Badge>}
                            {question.locked && <Badge tone="success"><Lock size={11} className="mr-1 inline" />Essencial</Badge>}
                            {!question.active && <Badge tone="neutral">Desativada</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" aria-label="Subir pergunta" onClick={() => move(section, index, -1)} disabled={isBusy || index === 0}><ArrowUp size={16} /></Button>
                          <Button size="sm" variant="ghost" aria-label="Descer pergunta" onClick={() => move(section, index, 1)} disabled={isBusy || index === visible.length - 1}><ArrowDown size={16} /></Button>
                          {question.kind === "personalizada" && !editing && <Button size="sm" variant="ghost" onClick={() => startEdit(question)} disabled={isBusy}><Pencil size={16} />Editar</Button>}
                          <Button size="sm" variant="secondary" onClick={() => toggleActive(question)} disabled={isBusy || question.locked} title={question.locked ? "Pergunta essencial: não pode ser desativada" : undefined}><Power size={16} />{question.active ? "Desativar" : "Ativar"}</Button>
                          <Button size="sm" variant="ghost" onClick={() => removeQuestion(question)} disabled={isBusy || question.locked} title={question.locked ? "Pergunta essencial: não pode ser removida" : undefined}><Trash2 size={16} />{question.kind === "personalizada" ? "Excluir" : "Remover"}</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {visible.length === 0 && <p className="text-sm text-slate-500">Nenhuma pergunta nesta seção.</p>}

                {removed.length > 0 && (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Removidas desta seção</p>
                    <div className="space-y-2">
                      {removed.map((question) => (
                        <div key={question.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-500 line-through">{question.text}</p>
                          <Button size="sm" variant="secondary" onClick={() => restore(question)} disabled={busy === question.id}><RotateCcw size={16} />Restaurar</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}