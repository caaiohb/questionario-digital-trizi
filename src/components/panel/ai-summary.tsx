"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";

export function AiSummary({ id }: { id: string; archived?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [tpl, setTpl] = useState("");
  const [defaultTpl, setDefaultTpl] = useState("");
  const [saving, setSaving] = useState(false);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${id}/ai-summary`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gerar o texto.");
      setPrompt(json.prompt as string);
      const ok = await copyText(json.prompt as string);
      if (ok) toast.success("Prompt copiado! Cole no Claude.");
      else toast.message("Copie o texto da caixa abaixo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar o texto.");
    } finally {
      setLoading(false);
    }
  }

  async function openEditor() {
    if (editing) { setEditing(false); return; }
    try {
      const res = await fetch("/api/ai-prompt-template");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar.");
      setTpl(json.template as string);
      setDefaultTpl(json.defaultTemplate as string);
      setEditing(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar.");
    }
  }

  async function saveTemplate(text: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/ai-prompt-template", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ template: text }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar.");
      toast.success("Instruções salvas. Valem para os próximos prompts.");
      setTpl(text);
      setPrompt(null);
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4" /> Resumo com IA e pontos de abordagem</h3>
          <p className="text-xs text-neutral-500">Copie o prompt e cole no Claude. Nome e CPF não vão no texto.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openEditor} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
            <Pencil className="h-4 w-4" /> Editar instruções do prompt
          </button>
          <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
            <ExternalLink className="h-4 w-4" /> Abrir Claude
          </a>
          <button type="button" disabled={loading} onClick={generate} className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Copiar prompt da IA
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 rounded-md border bg-neutral-50 p-3">
          <p className="mb-2 text-xs text-neutral-600">Este texto vai antes das respostas da paciente, em todos os prompts. As respostas são acrescentadas automaticamente.</p>
          <textarea value={tpl} onChange={(e) => setTpl(e.target.value)} rows={14} maxLength={8000} className="w-full rounded-md border bg-white p-2 text-sm" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={saving} onClick={() => saveTemplate(tpl)} className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar instruções"}</button>
            <button type="button" disabled={saving} onClick={() => saveTemplate(defaultTpl)} className="rounded-md border px-3 py-2 text-sm">Restaurar padrão</button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md border px-3 py-2 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {prompt && (
        <div className="mt-3">
          <textarea readOnly value={prompt} rows={8} className="w-full rounded-md border p-2 text-xs" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="mt-2 inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm" onClick={async () => { if (await copyText(prompt)) toast.success("Prompt copiado!"); else toast.error("Selecione o texto e use Ctrl+C."); }}>
            <Copy className="h-4 w-4" /> Copiar de novo
          </button>
        </div>
      )}
    </section>
  );
}