"use client";

import { useState } from "react";
import { Copy, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { installmentValue, renderLetterPrompt, type LetterKey, type LetterValues } from "@/lib/letter-prompt";

type Field = { key: LetterKey; label: string; placeholder?: string; area?: boolean; wide?: boolean };

/** Já vem do prontuário e do questionário: a médica só confere, se quiser. */
const IMPORTED: Field[] = [
  { key: "nome_paciente", label: "Nome (primeiro nome)" },
  { key: "idade", label: "Idade" },
  { key: "sexo", label: "Sexo" },
  { key: "tempo_sintomas", label: "Há quanto tempo sente" },
  { key: "nota_impacto", label: "Impacto no dia a dia (0 a 10)" },
  { key: "sintomas", label: "Sintomas e queixas", area: true, wide: true },
  { key: "frases_paciente", label: "Frases dela, literais", area: true, wide: true },
  { key: "areas_afetadas", label: "Áreas da vida afetadas", area: true, wide: true },
  { key: "tentativas_anteriores", label: "O que já tentou antes e como foi", area: true, wide: true },
  { key: "objetivo_paciente", label: "O que quer conquistar", area: true, wide: true },
];

/** Dados fixos do plano: preenchidos uma vez e lembrados neste computador. */
const FIXED: Field[] = [
  { key: "vinculo", label: "Vínculo com a paciente", placeholder: "marido" },
  { key: "duracao_meses", label: "Duração (meses)", placeholder: "Ex.: 12" },
  { key: "contato", label: "Contato para agendar", placeholder: "Telefone ou WhatsApp" },
  { key: "uf_crm", label: "UF do CRM", placeholder: "Ex.: SP" },
  { key: "equipe", label: "Profissionais incluídos", area: true, wide: true },
];

const FIXED_KEYS: LetterKey[] = FIXED.map((field) => field.key);
const STORAGE_KEY = "trizi_letter_plan_v2";

function readStored(): Partial<Record<LetterKey, string>> {
  try {
    return (JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Record<LetterKey, string>> | null) ?? {};
  } catch {
    return {};
  }
}

export function LetterPrompt({ id, defaults }: { id: string; defaults: LetterValues }) {
  const [values, setValues] = useState<LetterValues>(defaults);
  const [total, setTotal] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [prompt, setPrompt] = useState<string | null>(null);

  const parcela = installmentValue(total, parcelas);

  function setField(key: LetterKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setPrompt(null);
  }

  /** Ao abrir os dados fixos, mostra os últimos usados neste computador (só onde o campo está vazio). */
  function loadFixed() {
    const stored = readStored();
    setValues((current) => {
      const next = { ...current };
      for (const key of FIXED_KEYS) if (!next[key]?.trim() && stored[key]) next[key] = stored[key] as string;
      return next;
    });
  }

  function generate() {
    if (!values.nome_destinatario.trim()) { toast.error("Informe o nome do marido."); return; }
    if (!parcela) { toast.error("Informe o valor do plano e a quantidade de parcelas (ex.: 12.000,00 e 10)."); return; }
    const stored = readStored();
    const merged = { ...values };
    for (const key of FIXED_KEYS) if (!merged[key]?.trim() && stored[key]) merged[key] = stored[key] as string;
    try {
      const fixed: Partial<Record<LetterKey, string>> = {};
      for (const key of FIXED_KEYS) fixed[key] = merged[key];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fixed));
    } catch {
      /* sem armazenamento local: segue normalmente */
    }
    setPrompt(renderLetterPrompt({ ...merged, qtd_parcelas: parcelas.trim(), valor_parcela: parcela }));
  }

  async function copy() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copiado! Cole no Claude.");
    } catch {
      toast.message("Selecione o texto da caixa e use Ctrl+C.");
    }
    void fetch(`/api/doctor/submissions/${id}/letter`, { method: "POST" }).catch(() => undefined);
  }

  const input = "w-full rounded-md border bg-white p-2 text-sm";
  const renderField = (field: Field) => (
    <label key={field.key} className={`block text-sm ${field.wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-neutral-600">{field.label}</span>
      {field.area ? (
        <textarea value={values[field.key]} onChange={(event) => setField(field.key, event.target.value)} rows={3} placeholder={field.placeholder} className={input} />
      ) : (
        <input value={values[field.key]} onChange={(event) => setField(field.key, event.target.value)} placeholder={field.placeholder} className={input} />
      )}
    </label>
  );

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm print:hidden">
      <h3 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Carta para o marido</h3>
      <p className="text-xs text-neutral-500">O relato da paciente já vem do questionário. Preencha os 3 campos, gere o prompt e cole no Claude. Revise a carta com a paciente antes de entregar.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Nome do marido</span>
          <input value={values.nome_destinatario} onChange={(event) => setField("nome_destinatario", event.target.value)} placeholder="Ex.: Carlos" className={input} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Valor do plano (R$)</span>
          <input value={total} onChange={(event) => { setTotal(event.target.value); setPrompt(null); }} inputMode="decimal" placeholder="Ex.: 12.000,00" className={input} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Quantidade de parcelas</span>
          <input value={parcelas} onChange={(event) => { setParcelas(event.target.value); setPrompt(null); }} inputMode="numeric" placeholder="Ex.: 10" className={input} />
        </label>
      </div>
      <p className="mt-2 text-xs text-neutral-600">
        {parcela ? <>Na carta: <strong>{parcelas.trim()}x de {parcela}</strong> sem juros no cartão, ou via PIX. O valor total não aparece.</> : "A carta mostra só a parcela, calculada com o valor do plano e a quantidade de parcelas. O valor total não aparece."}
      </p>

      <details className="mt-3 rounded-md border bg-neutral-50 p-3">
        <summary className="cursor-pointer text-sm font-medium">Ver ou ajustar o que foi importado do questionário</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{IMPORTED.map(renderField)}</div>
      </details>

      <details className="mt-2 rounded-md border bg-neutral-50 p-3" onToggle={(event) => { if (event.currentTarget.open) loadFixed(); }}>
        <summary className="cursor-pointer text-sm font-medium">Dados fixos do plano (preencher uma vez)</summary>
        <p className="mt-2 text-xs text-neutral-500">Ficam salvos neste computador e valem para as próximas cartas.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{FIXED.map(renderField)}</div>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={generate} className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">Gerar prompt da carta</button>
        <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><ExternalLink className="h-4 w-4" /> Abrir Claude</a>
      </div>

      {prompt && (
        <div className="mt-3">
          <textarea readOnly value={prompt} rows={10} className="w-full rounded-md border p-2 text-xs" onFocus={(event) => event.currentTarget.select()} />
          <button type="button" onClick={copy} className="mt-2 inline-flex items-center gap-1 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"><Copy className="h-4 w-4" /> Copiar prompt</button>
        </div>
      )}
    </section>
  );
}