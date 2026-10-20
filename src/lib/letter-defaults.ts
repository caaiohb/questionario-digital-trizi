import { buildAiPrompt, DATA_MARKER } from "@/lib/ai-prompt";
import type { LetterPlan, LetterValues, PlanOption } from "@/lib/letter-prompt";

/** Só o primeiro nome, com a primeira letra maiúscula (ex.: "MARIA APARECIDA SILVA" vira "Maria"). */
export function firstNameOnly(fullName: unknown): string {
  const first = String(fullName ?? "").trim().split(/\s+/)[0] ?? "";
  if (!first) return "";
  return first.charAt(0).toLocaleUpperCase("pt-BR") + first.slice(1).toLocaleLowerCase("pt-BR");
}

type Row = { patient_name?: unknown; patient_age?: unknown; answers?: unknown; ai_prompt_text?: unknown };

/** Respostas da paciente, sem nome nem CPF e sem a linha de peso e altura. Usa o texto guardado se as respostas já foram arquivadas. */
export function questionnaireForLetter(row: Row): string {
  let block = buildAiPrompt(row);
  if (!block) {
    const saved = typeof row.ai_prompt_text === "string" ? row.ai_prompt_text.trim() : "";
    if (saved) {
      const i = saved.indexOf(DATA_MARKER);
      block = i >= 0 ? saved.slice(i) : `${DATA_MARKER}\n${saved}`;
    }
  }
  if (!block) return "";
  const lines = block.split("\n").slice(1);
  if (lines[0]?.startsWith("Idade:")) lines.shift();
  return lines.join("\n").trim();
}

/** Tudo o que a carta precisa, menos o nome do marido e o plano escolhido (duração, valor e parcelas), que a médica escolhe na tela. */
export function buildLetterDefaults(row: Row, plan: LetterPlan): LetterValues {
  const age = Number(row.patient_age);
  const sex = ((row.answers ?? {}) as Record<string, { answer?: unknown } | undefined>).identification_sex?.answer;
  return {
    nome_paciente: firstNameOnly(row.patient_name),
    idade: Number.isFinite(age) && age > 0 ? String(age) : "",
    sexo: sex === "feminino" || sex === "masculino" ? sex : "",
    nome_destinatario: "",
    vinculo: "marido",
    questionario: questionnaireForLetter(row),
    duracao_meses: "",
    equipe: plan.equipe,
    qtd_parcelas: "",
    valor_parcela: "",
    contato: plan.contato,
    uf_crm: plan.uf_crm,
  };
}

/** Dados para a tela da médica: valores fixos da carta e as opções de plano cadastradas. */
export function buildLetterPanel(row: Row, plan: LetterPlan): { defaults: LetterValues; options: PlanOption[] } {
  return { defaults: buildLetterDefaults(row, plan), options: plan.opcoes };
}