const BLOCKED_KEY = /full_name|name|nome|cpf|email|phone|telefone|whatsapp|document|rg_|address|endereco/i;

export const AI_INSTRUCTIONS_KEY = "ai_prompt_instructions";
export const DATA_MARKER = "=== RESPOSTAS DA PACIENTE (sem identificação) ===";

export const DEFAULT_AI_INSTRUCTIONS = `Segue o questionário de avaliação inicial de uma paciente do Instituto Trizi, sem nome nem CPF.

Com base no que você já conhece do meu estilo de consulta e do que busco captar nas pacientes, me ajude a me preparar para a consulta:

1. Resumo da paciente (4 a 6 linhas)
2. Principais dores, queixas e motivações que ela demonstrou
3. Pontos de atenção clínica ou emocional (se houver sinal de sofrimento importante, destaque primeiro)
4. Gatilhos e pontos de abordagem: o que ela respondeu e como posso conduzir a conversa
5. Como conectar o Plano Trizi ao que ela vive e deseja
6. Possíveis objeções e como respondê-las
7. Perguntas abertas para aprofundar na consulta

Baseie-se somente no que está respondido, sem inventar dados e sem diagnosticar.`;

type StoredItem = { question?: string; answer?: unknown; section?: string };

function fmt(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(fmt).filter(Boolean).join(", ");
  return JSON.stringify(value);
}

/** Bloco com as respostas anonimizadas (sem instruções). Null se não houver respostas. */
export function buildAiPrompt(row: unknown): string | null {
  const r = (row ?? {}) as Record<string, unknown>;
  const answers = (r.answers ?? {}) as Record<string, StoredItem>;
  const entries = Object.entries(answers).filter(([k]) => !BLOCKED_KEY.test(k));
  if (entries.length === 0) return null;

  const lines: string[] = [];
  lines.push(`Idade: ${fmt(r.patient_age)} | Peso atual: ${fmt(r.current_weight)} kg | Peso desejado: ${fmt(r.desired_weight)} kg | Altura: ${fmt(r.height)}`);
  let section = "";
  for (const [, item] of entries) {
    const a = fmt(item?.answer).trim();
    if (!a) continue;
    if (item.section && item.section !== section) {
      section = item.section;
      lines.push(`\n## ${section}`);
    }
    lines.push(`- ${item.question ?? ""}: ${a}`);
  }
  return `${DATA_MARKER}\n${lines.join("\n")}`;
}