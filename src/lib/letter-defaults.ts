import { answerLabel, questionsById } from "@/config/questionnaireConfig";
import { DEFAULT_LETTER_TEAM, type LetterValues } from "@/lib/letter-prompt";
import type { StoredAnswers } from "@/types/questionnaire";

/** Só o primeiro nome, com a primeira letra maiúscula (ex.: "MARIA APARECIDA SILVA" vira "Maria"). */
export function firstNameOnly(fullName: unknown): string {
  const first = String(fullName ?? "").trim().split(/\s+/)[0] ?? "";
  if (!first) return "";
  return first.charAt(0).toLocaleUpperCase("pt-BR") + first.slice(1).toLocaleLowerCase("pt-BR");
}

type Row = { patient_name?: unknown; patient_age?: unknown; answers?: unknown };

/** Valores sugeridos a partir do prontuário e do questionário. A médica revisa e completa antes de gerar o prompt. */
export function buildLetterDefaults(row: Row): LetterValues {
  const answers = (row.answers ?? {}) as StoredAnswers;
  const raw = (id: string): unknown => answers[id]?.answer;
  const label = (id: string): string => {
    const value = raw(id);
    const question = questionsById.get(id);
    if (value === undefined || value === null || value === "" || !question) return "";
    const text = answerLabel(question, value);
    return text === "Não informado" ? "" : text;
  };
  const text = (id: string): string => {
    const value = raw(id);
    return typeof value === "string" ? value.trim() : "";
  };
  const quote = (value: string) => (value ? `“${value}”` : "");

  const symptoms = [label("queixa_principal"), text("queixa_principal_outro")].filter(Boolean).join(", ");
  const phrases = [quote(text("queixa_principal_detalhe")), quote(text("objetivo_seis_meses"))].filter(Boolean).join(" ");
  const barrier = label("barreira_cuidado");
  const tried = [label("tentativa_anterior"), barrier ? `O que mais a impede de se cuidar: ${barrier}` : ""].filter(Boolean).join(". ");
  const age = Number(row.patient_age);

  return {
    nome_paciente: firstNameOnly(row.patient_name),
    idade: Number.isFinite(age) && age > 0 ? String(age) : "",
    sexo: label("identification_sex").toLowerCase(),
    nome_destinatario: "",
    vinculo: "",
    tempo_sintomas: label("queixa_tempo"),
    sintomas: symptoms,
    frases_paciente: phrases,
    nota_impacto: label("queixa_impacto"),
    areas_afetadas: label("queixa_areas"),
    tentativas_anteriores: tried,
    objetivo_paciente: text("objetivo_seis_meses"),
    duracao_meses: "",
    equipe: DEFAULT_LETTER_TEAM,
    qtd_parcelas: "",
    valor_parcela: "",
    contato: "",
    uf_crm: "",
  };
}