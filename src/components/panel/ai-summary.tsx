"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function AiSummary({ id }: { id: string; archived?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);


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

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4" /> Resumo com IA e pontos de abordagem</h3>
          <p className="text-xs text-neutral-500">Copie o prompt e cole no Claude para receber o resumo e os gatilhos. Nome e CPF não vão no texto.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
            <ExternalLink className="h-4 w-4" /> Abrir Claude
          </a>
          <button type="button" disabled={loading} onClick={generate} className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Copiar prompt da IA
          </button>
        </div>
      </div>
      {prompt && (
        <div className="mt-3">
          <textarea readOnly value={prompt} rows={8} className="w-full rounded-md border p-2 text-xs" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="mt-2 inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm" onClick={async () => { (await copyText(prompt)) ? toast.success("Prompt copiado!") : toast.error("Selecione o texto e use Ctrl+C."); }}>
            <Copy className="h-4 w-4" /> Copiar de novo
          </button>
        </div>
      )}
    </section>
  );
}