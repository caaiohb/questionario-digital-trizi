"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function AiPromptEditor({ initial, defaultTemplate, isDefault }: { initial: string; defaultTemplate: string; isDefault: boolean }) {
  const [text, setText] = useState(initial);
  const [custom, setCustom] = useState(!isDefault);
  const [saving, setSaving] = useState(false);

  async function save(value: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/ai-prompt-template", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ template: value }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar.");
      setText(value);
      setCustom(value.trim() !== "" && value.trim() !== defaultTemplate.trim());
      toast.success("Prompt salvo. Vale para os próximos prompts copiados pela médica.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="prompt-ia" className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="h-5 w-5" /> Prompt da IA (resumo para a médica)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Este texto vai antes das respostas da paciente quando a Dra. Janifer clica em &quot;Copiar prompt da IA&quot;. As respostas são acrescentadas automaticamente, sem nome nem CPF.
      </p>
      <p className="mt-2 text-xs font-medium text-slate-500">Em uso agora: {custom ? "texto personalizado" : "texto padrão do sistema"}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={16} maxLength={8000} className="mt-3 w-full rounded-md border bg-white p-3 text-sm" />
      <p className="mt-1 text-right text-xs text-slate-400">{text.length}/8000</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={saving} onClick={() => save(text)} className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar prompt"}</button>
        <button type="button" disabled={saving} onClick={() => save(defaultTemplate)} className="rounded-md border px-4 py-2 text-sm disabled:opacity-60">Restaurar padrão</button>
      </div>
    </section>
  );
}