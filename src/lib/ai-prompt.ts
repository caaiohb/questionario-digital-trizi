import { answerLabel, questionsById } from "@/config/questionnaireConfig";
import { legacyAnswerText } from "@/lib/legacy-answers";

const BLOCKED_KEY = /full_name|name|nome|cpf|email|phone|telefone|whatsapp|document|rg_|address|endereco|death/i;

export const AI_INSTRUCTIONS_KEY = "ai_prompt_instructions";
export const DATA_MARKER = "=== RESPOSTAS DA PACIENTE (sem identificação) ===";

export const DEFAULT_AI_INSTRUCTIONS = `Segue o questionário de uma paciente do Instituto Trizi, sem nome nem CPF.

Prepare a Dra. Janifer para fechar o Plano Trizi 360º. Seja direto, sem introdução, em no máximo 150 palavras, neste formato:

AVISOS: sinal de alerta clínico marcado ou sofrimento emocional importante (estresse muito alto, por exemplo). Se não houver, escreva "nenhum". Se houver, acolher antes de falar de plano.

GANCHOS CLÍNICOS (até 3): resposta dela > por que importa > frase para a doutora usar.

GANCHOS COMERCIAIS (até 3): dor, objetivo em 6 meses ou barreira que ela citou > como o Plano Trizi 360º responde (use o que você já sabe sobre o plano; se não tiver, avise e não invente).

Use só o que está respondido, cite as respostas dela, não diagnostique e não prometa cura.`;

type StoredItem = { questionId?: string; question?: string; answer?: unknown; section?: string };

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
    const known = item?.questionId ? questionsById.get(item.questionId) : undefined;
    const a = (known ? answerLabel(known, item.answer) : item?.questionId ? legacyAnswerText({ questionId: item.questionId, answer: item.answer as never }) : fmt(item?.answer)).trim();
    if (!a) continue;
    if (item.section && item.section !== section) {
      section = item.section;
      lines.push(`\n## ${section}`);
    }
    lines.push(`- ${item.question ?? ""}: ${a}`);
  }
  return `${DATA_MARKER}\n${lines.join("\n")}`;
}