"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

type Summary = {
  resumo?: string;
  queixas_principais?: string[];
  historico_relevante?: string[];
  alertas?: string[];
  gatilhos?: Array<{ tema: string; evidencia: string; como_abordar: string }>;
  conexao_plano_trizi?: string;
  possiveis_objecoes?: Array<{ objecao: string; resposta_sugerida: string }>;
  perguntas_para_consulta?: string[];
};

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>
    </div>
  );
}

function toText(s: Summary) {
  const out: string[] = [];
  if (s.resumo) out.push(`RESUMO\n${s.resumo}`);
  const list = (t: string, a?: string[]) => a?.length && out.push(`${t}\n${a.map((x) => `- ${x}`).join("\n")}`);
  list("QUEIXAS PRINCIPAIS", s.queixas_principais);
  list("HISTÓRICO RELEVANTE", s.historico_relevante);
  list("ALERTAS", s.alertas);
  if (s.gatilhos?.length) out.push(`GATILHOS / PONTOS DE ABORDAGEM\n${s.gatilhos.map((g) => `- ${g.tema}\n  Ela disse: ${g.evidencia}\n  Como abordar: ${g.como_abordar}`).join("\n")}`);
  if (s.conexao_plano_trizi) out.push(`CONEXÃO COM O PLANO TRIZI\n${s.conexao_plano_trizi}`);
  if (s.possiveis_objecoes?.length) out.push(`POSSÍVEIS OBJEÇÕES\n${s.possiveis_objecoes.map((o) => `- ${o.objecao}\n  Resposta: ${o.resposta_sugerida}`).join("\n")}`);
  list("PERGUNTAS PARA A CONSULTA", s.perguntas_para_consulta);
  return out.join("\n\n");
}

export function AiSummary({ id, archived }: { id: string; archived?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Summary | null>(null);

  if (archived) return null;

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${id}/ai-summary`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gerar resumo.");
      setData(json.summary as Summary);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar resumo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4" /> Resumo com IA e pontos de abordagem</h3>
          <p className="text-xs text-neutral-500">Apoio para a consulta. Não substitui a avaliação da Dra. Janifer. Nome e CPF não são enviados à IA.</p>
        </div>
        <div className="flex gap-2">
          {data && (
            <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm" onClick={() => { navigator.clipboard.writeText(toText(data)); toast.success("Resumo copiado."); }}>
              <Copy className="h-4 w-4" /> Copiar
            </button>
          )}
          <button type="button" disabled={loading} onClick={generate} className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {data ? "Gerar novamente" : "Gerar resumo"}
          </button>
        </div>
      </div>

      {data && (
        <div className="mt-4 space-y-4">
          {data.resumo && <p className="text-sm leading-relaxed">{data.resumo}</p>}
          {!!data.alertas?.length && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3"><List title="⚠ Alertas" items={data.alertas} /></div>
          )}
          <List title="Queixas principais" items={data.queixas_principais} />
          <List title="Histórico relevante" items={data.historico_relevante} />
          {!!data.gatilhos?.length && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Gatilhos / pontos de abordagem</h4>
              <div className="space-y-2">
                {data.gatilhos.map((g, n) => (
                  <div key={n} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{g.tema}</p>
                    <p className="text-neutral-600">Ela respondeu: {g.evidencia}</p>
                    <p className="mt-1">💬 {g.como_abordar}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.conexao_plano_trizi && (
            <div className="rounded-md bg-amber-50 p-3"><h4 className="mb-1 text-sm font-semibold">Conexão com o Plano Trizi</h4><p className="text-sm">{data.conexao_plano_trizi}</p></div>
          )}
          {!!data.possiveis_objecoes?.length && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Possíveis objeções</h4>
              <div className="space-y-2">
                {data.possiveis_objecoes.map((o, n) => (
                  <div key={n} className="rounded-md border p-3 text-sm"><p className="font-medium">{o.objecao}</p><p>{o.resposta_sugerida}</p></div>
                ))}
              </div>
            </div>
          )}
          <List title="Perguntas para a consulta" items={data.perguntas_para_consulta} />
        </div>
      )}
    </section>
  );
}