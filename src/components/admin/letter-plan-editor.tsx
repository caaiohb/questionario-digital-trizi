"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import type { LetterPlan } from "@/lib/letter-prompt";

const FIELDS: { key: keyof LetterPlan; label: string; placeholder?: string; area?: boolean }[] = [
  { key: "duracao_meses", label: "Duração do plano (meses)", placeholder: "Ex.: 12" },
  { key: "qtd_parcelas", label: "Quantidade de parcelas (sem juros)", placeholder: "Ex.: 10" },
  { key: "contato", label: "Contato para agendar", placeholder: "Telefone ou WhatsApp" },
  { key: "uf_crm", label: "UF do CRM", placeholder: "Ex.: SP" },
  { key: "equipe", label: "Profissionais incluídos no plano", area: true },
];

export function LetterPlanEditor({ initial }: { initial: LetterPlan }) {
  const [plan, setPlan] = useState<LetterPlan>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/letter-plan", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(plan) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar.");
      toast.success("Dados do plano salvos. Valem para as próximas cartas.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="carta-plano" className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Mail className="h-5 w-5" /> Carta para o marido: dados do plano</h2>
      <p className="mt-1 text-sm text-slate-600">
        Estes dados entram sozinhos na carta. A Dra. Janifer informa apenas o nome do marido e o valor do plano. A parcela é calculada com o valor que ela digitar e a quantidade de parcelas daqui.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className={`block text-sm ${field.area ? "sm:col-span-2" : ""}`}>
            <span className="mb-1 block text-xs font-medium text-slate-600">{field.label}</span>
            {field.area ? (
              <textarea value={plan[field.key]} onChange={(event) => setPlan({ ...plan, [field.key]: event.target.value })} rows={3} maxLength={600} className="w-full rounded-md border bg-white p-2 text-sm" />
            ) : (
              <input value={plan[field.key]} onChange={(event) => setPlan({ ...plan, [field.key]: event.target.value })} placeholder={field.placeholder} className="w-full rounded-md border bg-white p-2 text-sm" />
            )}
          </label>
        ))}
      </div>
      <button type="button" disabled={saving} onClick={save} className="mt-3 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar dados do plano"}</button>
    </section>
  );
}