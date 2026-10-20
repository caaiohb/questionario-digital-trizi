"use client";

import { useState } from "react";
import { Copy, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { installmentValue, renderLetterPrompt, type LetterValues, type PlanOption } from "@/lib/letter-prompt";

export function LetterPrompt({ id, panel }: { id: string; panel: { defaults: LetterValues; options: PlanOption[] } }) {
  const { defaults, options } = panel;
  const [husband, setHusband] = useState("");
  const [planIndex, setPlanIndex] = useState(options.length === 1 ? 0 : -1);
  const [parcelas, setParcelas] = useState(options.length === 1 ? options[0].max_parcelas : "");
  const [prompt, setPrompt] = useState<string | null>(null);

  const option: PlanOption | undefined = options[planIndex];
  const parcela = option ? installmentValue(option.valor, parcelas) : null;
  const input = "w-full rounded-md border bg-white p-2 text-sm";

  function choosePlan(value: string) {
    const index = Number(value);
    setPlanIndex(index);
    setParcelas(options[index]?.max_parcelas ?? "");
    setPrompt(null);
  }

  async function generate() {
    if (!husband.trim()) { toast.error("Informe o nome do marido."); return; }
    if (!option) { toast.error("Escolha o plano."); return; }
    if (!parcela) { toast.error("Escolha a quantidade de parcelas."); return; }
    const text = renderLetterPrompt({ ...defaults, nome_destinatario: husband, duracao_meses: option.meses, qtd_parcelas: parcelas, valor_parcela: parcela }, { emAte: parcelas === option.max_parcelas });
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

  const maxParcelas = option ? Number(option.max_parcelas) : 0;

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm print:hidden">
      <h3 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Para quem divide os dias com ela</h3>
      <p className="text-xs text-neutral-500">O questionário da paciente vai junto no prompt, para o Claude achar os gatilhos e mostrar o que ela vai melhorar. Revise a carta com a paciente antes de entregar.</p>

      {options.length === 0 ? (
        <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Nenhum plano cadastrado. Peça ao administrador para cadastrar os planos em Configurações.</p>
      ) : (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-neutral-600">Nome do marido</span>
              <input value={husband} onChange={(event) => { setHusband(event.target.value); setPrompt(null); }} placeholder="Ex.: Carlos" className={input} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-neutral-600">Plano</span>
              <select value={planIndex >= 0 ? String(planIndex) : ""} onChange={(event) => choosePlan(event.target.value)} className={input}>
                <option value="" disabled>Escolha o plano</option>
                {options.map((item, index) => <option key={`${item.meses}-${index}`} value={index}>{item.meses} meses</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-neutral-600">Parcelas</span>
              <select value={parcelas} onChange={(event) => { setParcelas(event.target.value); setPrompt(null); }} disabled={!option} className={input}>
                {!option && <option value="">Escolha o plano primeiro</option>}
                {Array.from({ length: maxParcelas }, (_, i) => maxParcelas - i).map((count) => <option key={count} value={count}>{count}x{count === maxParcelas ? " (máximo)" : ""}</option>)}
              </select>
            </label>
          </div>

          <p className="mt-2 text-xs text-neutral-600">
            {option && parcela
              ? <>Plano de {option.meses} meses. Na carta: <strong>{parcelas === option.max_parcelas ? "em até " : ""}{parcelas}x de {parcela}</strong> sem juros no cartão, ou via PIX. O valor total não aparece.</>
              : "Escolha o plano. A carta mostra só a parcela, nunca o valor total."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={generate} className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"><Copy className="h-4 w-4" /> Gerar e copiar prompt da carta</button>
            <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><ExternalLink className="h-4 w-4" /> Abrir Claude</a>
          </div>
        </>
      )}

      {prompt && (
        <div className="mt-3">
          <textarea readOnly value={prompt} rows={10} className="w-full rounded-md border p-2 text-xs" onFocus={(event) => event.currentTarget.select()} />
          <button type="button" onClick={copyAgain} className="mt-2 inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><Copy className="h-4 w-4" /> Copiar de novo</button>
        </div>
      )}
    </section>
  );
}