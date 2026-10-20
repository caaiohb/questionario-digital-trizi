"use client";

import { useState } from "react";
import { Copy, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { renderLetterPrompt, type LetterKey, type LetterValues } from "@/lib/letter-prompt";

type Field = { key: LetterKey; label: string; placeholder?: string; area?: boolean; wide?: boolean };

const GROUPS: { title: string; hint?: string; fields: Field[] }[] = [
  {
    title: "Paciente",
    hint: "O nome vem do prontuário, só o primeiro nome.",
    fields: [
      { key: "nome_paciente", label: "Nome (primeiro nome)" },
      { key: "idade", label: "Idade" },
      { key: "sexo", label: "Sexo", placeholder: "feminino ou masculino" },
    ],
  },
  {
    title: "Quem vai receber a carta",
    fields: [
      { key: "nome_destinatario", label: "Nome de quem recebe", placeholder: "Ex.: Carlos" },
      { key: "vinculo", label: "Vínculo com a paciente", placeholder: "marido, esposa, companheiro, filha, mãe..." },
    ],
  },
  {
    title: "O que a paciente relatou",
    hint: "Preenchido com as respostas do questionário. Revise e apague o que não quiser que apareça na carta.",
    fields: [
      { key: "tempo_sintomas", label: "Há quanto tempo sente" },
      { key: "nota_impacto", label: "Impacto no dia a dia (0 a 10)" },
      { key: "sintomas", label: "Sintomas e queixas", area: true, wide: true },
      { key: "frases_paciente", label: "Frases dela, literais", area: true, wide: true },
      { key: "areas_afetadas", label: "Áreas da vida afetadas", area: true, wide: true },
      { key: "tentativas_anteriores", label: "O que já tentou antes e como foi", area: true, wide: true },
      { key: "objetivo_paciente", label: "O que quer conquistar", area: true, wide: true },
    ],
  },
  {
    title: "Plano",
    hint: "Estes campos ficam salvos neste computador para a próxima carta.",
    fields: [
      { key: "duracao_meses", label: "Duração (meses)", placeholder: "Ex.: 12" },
      { key: "qtd_parcelas", label: "Quantidade de parcelas", placeholder: "Ex.: 10" },
      { key: "valor_parcela", label: "Valor da parcela", placeholder: "Ex.: R$ 990,00" },
      { key: "contato", label: "Contato para agendar", placeholder: "Telefone ou WhatsApp" },
      { key: "uf_crm", label: "UF do CRM", placeholder: "Ex.: SP" },
      { key: "equipe", label: "Profissionais incluídos", area: true, wide: true },
    ],
  },
];

const PLAN_KEYS: LetterKey[] = ["duracao_meses", "qtd_parcelas", "valor_parcela", "contato", "uf_crm", "equipe"];
const STORAGE_KEY = "trizi_letter_plan_v1";

export function LetterPrompt({ id, defaults }: { id: string; defaults: LetterValues }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LetterValues>(defaults);
  const [prompt, setPrompt] = useState<string | null>(null);

  /** Ao abrir, preenche os dados do plano com os últimos usados neste computador. */
  function togglePanel() {
    if (!open) {
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Record<LetterKey, string>> | null;
        if (saved) {
          setValues((current) => {
            const next = { ...current };
            for (const key of PLAN_KEYS) if (typeof saved[key] === "string" && saved[key]) next[key] = saved[key] as string;
            return next;
          });
        }
      } catch {
        /* sem armazenamento local: segue com os valores padrão */
      }
    }
    setOpen((value) => !value);
  }

  function setField(key: LetterKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setPrompt(null);
  }

  function generate() {
    try {
      const plan: Partial<Record<LetterKey, string>> = {};
      for (const key of PLAN_KEYS) plan[key] = values[key];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      /* ignora */
    }
    setPrompt(renderLetterPrompt(values));
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

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Carta para o marido ou pessoa próxima</h3>
          <p className="text-xs text-neutral-500">Preencha os campos, gere o prompt e cole no Claude. Revise a carta com a paciente antes de entregar.</p>
        </div>
        <button type="button" onClick={togglePanel} className="rounded-md border px-3 py-2 text-sm">{open ? "Fechar" : "Preparar carta"}</button>
      </div>

      {open && (
        <div className="mt-4 space-y-5">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold">{group.title}</h4>
              {group.hint && <p className="text-xs text-neutral-500">{group.hint}</p>}
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <label key={field.key} className={`block text-sm ${field.wide ? "sm:col-span-2" : ""}`}>
                    <span className="mb-1 block text-xs font-medium text-neutral-600">{field.label}</span>
                    {field.area ? (
                      <textarea value={values[field.key]} onChange={(event) => setField(field.key, event.target.value)} rows={3} placeholder={field.placeholder} className="w-full rounded-md border bg-white p-2 text-sm" />
                    ) : (
                      <input value={values[field.key]} onChange={(event) => setField(field.key, event.target.value)} placeholder={field.placeholder} className="w-full rounded-md border bg-white p-2 text-sm" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={generate} className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">Gerar prompt da carta</button>
            <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><ExternalLink className="h-4 w-4" /> Abrir Claude</a>
          </div>

          {prompt && (
            <div>
              <textarea readOnly value={prompt} rows={10} className="w-full rounded-md border p-2 text-xs" onFocus={(event) => event.currentTarget.select()} />
              <button type="button" onClick={copy} className="mt-2 inline-flex items-center gap-1 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"><Copy className="h-4 w-4" /> Copiar prompt</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}