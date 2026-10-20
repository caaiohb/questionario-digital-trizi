"use client";

import { useState } from "react";
import { Mail, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { LetterPlan, PlanOption } from "@/lib/letter-prompt";

export function LetterPlanEditor({ initial }: { initial: LetterPlan }) {
  const [plan, setPlan] = useState<LetterPlan>(initial);
  const [saving, setSaving] = useState(false);
  const input = "w-full rounded-md border bg-white p-2 text-sm";

  function setOption(index: number, patch: Partial<PlanOption>) {
    setPlan((current) => ({ ...current, opcoes: current.opcoes.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  }
  function addOption() {
    setPlan((current) => ({ ...current, opcoes: [...current.opcoes, { meses: "", valor: "", max_parcelas: "" }] }));
  }
  function removeOption(index: number) {
    setPlan((current) => ({ ...current, opcoes: current.opcoes.filter((_, i) => i !== index) }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/letter-plan", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(plan) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar.");
      if (json.plan) setPlan(json.plan as LetterPlan);
      toast.success("Planos salvos. A doutora já vê as opções na carta.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="carta-plano" className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Mail className="h-5 w-5" /> Carta para o marido: planos e valores</h2>
      <p className="mt-1 text-sm text-slate-600">
        Cadastre cada plano com a duração, o valor total e o máximo de parcelas sem juros. Na carta, a doutora escolhe só o plano, e o valor e as parcelas já vão certos para o Claude. Ela pode usar menos parcelas que o máximo.
      </p>

      <div className="mt-4 space-y-2">
        {plan.opcoes.length === 0 && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Nenhum plano cadastrado ainda. Sem planos, a doutora não consegue gerar a carta.</p>}
        {plan.opcoes.map((option, index) => (
          <div key={index} className="grid items-end gap-2 sm:grid-cols-[1fr_1.4fr_1fr_auto]">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Duração (meses)</span>
              <input value={option.meses} onChange={(event) => setOption(index, { meses: event.target.value })} inputMode="numeric" placeholder="Ex.: 12" className={input} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Valor total do plano (R$)</span>
              <input value={option.valor} onChange={(event) => setOption(index, { valor: event.target.value })} inputMode="decimal" placeholder="Ex.: 12.000,00" className={input} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Máximo de parcelas</span>
              <input value={option.max_parcelas} onChange={(event) => setOption(index, { max_parcelas: event.target.value })} inputMode="numeric" placeholder="Ex.: 10" className={input} />
            </label>
            <button type="button" onClick={() => removeOption(index)} aria-label="Remover plano" className="rounded-md border p-2 text-slate-600 hover:bg-slate-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" onClick={addOption} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><Plus className="h-4 w-4" /> Adicionar plano</button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Contato para agendar</span>
          <input value={plan.contato} onChange={(event) => setPlan({ ...plan, contato: event.target.value })} placeholder="Telefone ou WhatsApp" className={input} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">UF do CRM</span>
          <input value={plan.uf_crm} onChange={(event) => setPlan({ ...plan, uf_crm: event.target.value })} maxLength={2} placeholder="Ex.: SP" className={input} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">Profissionais incluídos no plano</span>
          <textarea value={plan.equipe} onChange={(event) => setPlan({ ...plan, equipe: event.target.value })} rows={3} maxLength={600} className={input} />
        </label>
      </div>

      <button type="button" disabled={saving} onClick={save} className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar planos"}</button>
    </section>
  );
}