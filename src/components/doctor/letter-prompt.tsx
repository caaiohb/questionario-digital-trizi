"use client";

import { useState } from "react";
import { Copy, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { installmentValue, renderLetterPrompt, type LetterValues } from "@/lib/letter-prompt";

export function LetterPrompt({ id, defaults }: { id: string; defaults: LetterValues }) {
  const [husband, setHusband] = useState("");
  const [total, setTotal] = useState("");
  const [prompt, setPrompt] = useState<string | null>(null);

  const planReady = Boolean(defaults.qtd_parcelas.trim());
  const parcela = installmentValue(total, defaults.qtd_parcelas);
  const input = "w-full rounded-md border bg-white p-2 text-sm";

  async function generate() {
    if (!husband.trim()) { toast.error("Informe o nome do marido."); return; }
    if (!planReady) { toast.error("Falta cadastrar a quantidade de parcelas. Peça ao administrador em Configurações."); return; }
    if (!parcela) { toast.error("Informe o valor do plano (ex.: 12.000,00)."); return; }
    const text = renderLetterPrompt({ ...defaults, nome_destinatario: husband, valor_parcela: parcela });
    setPrompt(text);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Prompt copiado! Cole no Claude.");
    } catch {
      toast.message("Selecione o texto da caixa e use Ctrl+C.");
    }
    void fetch(`/api/doctor/submissions/${id}/letter`, { method: "POST" }).catch(() => undefined);
  }

  async function copyAgain() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copiado!");
    } catch {
      toast.error("Selecione o texto e use Ctrl+C.");
    }
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm print:hidden">
      <h3 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Carta para o marido</h3>
      <p className="text-xs text-neutral-500">O questionário da paciente vai junto no prompt, para o Claude achar os gatilhos e mostrar o que ela vai melhorar. Revise a carta com a paciente antes de entregar.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Nome do marido</span>
          <input value={husband} onChange={(event) => { setHusband(event.target.value); setPrompt(null); }} placeholder="Ex.: Carlos" className={input} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Valor do plano (R$)</span>
          <input value={total} onChange={(event) => { setTotal(event.target.value); setPrompt(null); }} inputMode="decimal" placeholder="Ex.: 12.000,00" className={input} />
        </label>
      </div>

      <p className="mt-2 text-xs text-neutral-600">
        {!planReady
          ? "Falta cadastrar a quantidade de parcelas do plano em Configurações (administrador)."
          : parcela
            ? <>Na carta: <strong>{defaults.qtd_parcelas}x de {parcela}</strong> sem juros no cartão, ou via PIX. O valor total não aparece.</>
            : "A carta mostra só a parcela. O valor total não aparece."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={generate} className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"><Copy className="h-4 w-4" /> Gerar e copiar prompt da carta</button>
        <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><ExternalLink className="h-4 w-4" /> Abrir Claude</a>
      </div>

      {prompt && (
        <div className="mt-3">
          <textarea readOnly value={prompt} rows={10} className="w-full rounded-md border p-2 text-xs" onFocus={(event) => event.currentTarget.select()} />
          <button type="button" onClick={copyAgain} className="mt-2 inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><Copy className="h-4 w-4" /> Copiar de novo</button>
        </div>
      )}
    </section>
  );
}