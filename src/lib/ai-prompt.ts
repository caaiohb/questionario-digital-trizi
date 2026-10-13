import { answerLabel, questionsById } from "@/config/questionnaireConfig";
import { legacyAnswerText } from "@/lib/legacy-answers";

const BLOCKED_KEY = /full_name|name|nome|cpf|email|phone|telefone|whatsapp|document|rg_|address|endereco/i;

export const AI_INSTRUCTIONS_KEY = "ai_prompt_instructions";
export const DATA_MARKER = "=== RESPOSTAS DA PACIENTE (sem identificação) ===";

export const DEFAULT_AI_INSTRUCTIONS = `Segue o questionário de avaliação inicial de uma paciente do Instituto Trizi, sem nome nem CPF.

Seu papel: me preparar, em menos de 1 minuto de leitura, para conduzir a consulta e fechar o Plano Trizi. Seja direto, sem introdução e sem repetir o questionário. Resposta total de no máximo 250 palavras, em tópicos curtos, neste formato:

PERFIL: 2 linhas (idade, queixa principal, momento de vida e o que ela quer).

ALERTA: só se houver sofrimento emocional importante, pensamento de morte, tentativa anterior ou sinal de alerta clínico. Se houver, esta é a primeira linha e a conduta é acolher e avaliar antes de falar de plano. Se não houver, omita esta linha.

GATILHOS CLÍNICOS (3 a 4): para cada um, escreva: o que ela respondeu (citação curta) > por que isso importa clinicamente > uma frase que posso usar para mostrar por que o acompanhamento contínuo é necessário.

GATILHOS COMERCIAIS (3 a 4): use o impacto da queixa na vida dela, o objetivo em 6 meses, o que a impediu de se cuidar até agora, como ela decide sobre saúde e o tipo de cuidado que procura. Para cada um: o gancho > como transformar em benefício concreto do Plano Trizi.

PONTE PARA O PLANO: 1 frase ligando a maior dor dela ao Plano Trizi.

OBJEÇÃO MAIS PROVÁVEL: 1 ou 2, cada uma com resposta de 1 frase, de acordo com o jeito dela decidir (tempo, dinheiro, medo, precisa consultar alguém).

FRASE DE FECHAMENTO: 1 pergunta aberta que leve ela a decidir pelo plano.

Regras: use somente o que está respondido, sem inventar dados e sem diagnosticar. Cite as respostas dela. Não use pressão nem falsa escassez. Se houver ALERTA, não force a venda nesta consulta.`;

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