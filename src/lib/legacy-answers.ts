import { questionsById, sectionsById } from "@/config/questionnaireConfig";
import type { StoredAnswer } from "@/types/questionnaire";

/**
 * Respostas de questionários antigos (versões anteriores das perguntas) continuam guardadas no banco,
 * mas as perguntas deixaram de existir na configuração. Estas funções permitem exibi-las mesmo assim.
 */
const LEGACY_OPTION_LABELS: Record<string, Record<string, string>> = {
  menstrual_status: {
    regular: "Ciclos regulares.",
    irregular_under_2_months: "Ciclos irregulares, mas não fico mais de dois meses sem menstruar.",
    failing_last_year: "No último ano, a menstruação vem falhando em alguns meses.",
    over_1_year_with_hormones: "Não menstruo há mais de um ano, mas utilizo terapia de reposição hormonal.",
    over_1_under_10_never_hormones: "Não menstruo há mais de um ano e há menos de dez anos e nunca fiz reposição hormonal.",
    over_10_stopped_over_3: "Não menstruo há mais de dez anos, já usei hormônios, mas parei há mais de três anos.",
    over_10_stopped_under_3: "Não menstruo há mais de dez anos, já usei hormônios e parei há menos de três anos.",
    over_10_never_hormones: "Não menstruo há mais de dez anos e nunca fiz reposição hormonal.",
    menopause_over_60_never_hormones: "Já estou na menopausa, tenho mais de 60 anos e nunca fiz reposição hormonal.",
  },
  activity_profile: {
    sedentary: "Não pratica atividades físicas ou faz caminhadas esporádicas.",
    light_2_3: "Pratica atividades leves, como pilates, dança, caminhada ou hidroginástica, de duas a três vezes por semana.",
    light_over_3: "Pratica atividades leves, como pilates, dança, caminhada ou hidroginástica, mais de três vezes por semana.",
    vigorous_up_to_2: "Pratica atividades mais vigorosas, como musculação, natação, corrida, funcional ou spinning, até duas vezes por semana.",
    vigorous_3_4: "Pratica atividades mais vigorosas, como musculação, natação, corrida, funcional ou spinning, de três a quatro vezes por semana.",
    vigorous_5_7: "Pratica atividades mais vigorosas, como musculação, natação, corrida, funcional ou spinning, de cinco a sete vezes por semana.",
  },
  stimulant_experience: {
    never: "Nunca utilizei.",
    used_no_adverse: "Utilizei e não me senti mal.",
    used_adverse: "Utilizei e me senti mal.",
  },
};

const COMMON_LABELS: Record<string, string> = {
  sim: "Sim",
  nao: "Não",
  nao_aplica: "Menopausa ou não se aplica",
  prefiro_nao_responder: "Prefiro não responder",
};

export function legacyAnswerText(stored: Pick<StoredAnswer, "questionId" | "answer">): string {
  const value = stored.answer as unknown;
  if (value === null || value === undefined || value === "") return "Não informado";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return String(value).replace(".", ",");
  if (typeof value === "object") {
    const measure = value as { value?: number; unit?: string };
    return measure.value !== undefined ? `${measure.value} ${measure.unit ?? ""}`.trim() : JSON.stringify(value);
  }
  const text = String(value);
  return LEGACY_OPTION_LABELS[stored.questionId]?.[text] ?? COMMON_LABELS[text] ?? text;
}

export interface LegacyAnswerGroup {
  section: string;
  items: StoredAnswer[];
}

/** Respostas cuja seção e pergunta não existem mais na configuração atual, agrupadas pelo nome da seção antiga. */
export function getLegacyAnswerGroups(answers: Record<string, StoredAnswer> | null | undefined): LegacyAnswerGroup[] {
  const groups = new Map<string, StoredAnswer[]>();
  for (const stored of Object.values(answers ?? {})) {
    if (sectionsById.has(stored.sectionId) || questionsById.has(stored.questionId)) continue;
    const title = stored.section || "Outras respostas";
    groups.set(title, [...(groups.get(title) ?? []), stored]);
  }
  return Array.from(groups, ([section, items]) => ({ section, items }));
}