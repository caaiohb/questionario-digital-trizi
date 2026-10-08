import { describe, expect, it } from "vitest";
import { questionnaireSections } from "@/config/questionnaireConfig";
import { getEffectiveSections, mergeCustomQuestions } from "@/lib/custom-questions";
import { applyQuestionOverrides, isQuestionEnabled } from "@/lib/question-overrides";
import { buildStoredAnswers, validateQuestionnaireAnswers } from "@/lib/validation/questionnaire";
import type { QuestionOverrides } from "@/lib/question-overrides";
import type { RawAnswers } from "@/types/questionnaire";

const emotional = questionnaireSections.find((section) => section.id === "emotional_health")!;

function fullAnswers(overrides: RawAnswers = {}): RawAnswers {
  const base: RawAnswers = { identification_full_name: "Maria Teste", identification_age: 40, identification_current_weight: 80, identification_desired_weight: 65, identification_height: 1.65, identification_cpf: "529.982.247-25", identification_sex: "masculino" };
  return { ...base, ...overrides };
}

describe("question overrides", () => {
  it("sem ajustes mantém as perguntas como estão", () => {
    expect(applyQuestionOverrides(emotional.questions, {})).toBe(emotional.questions);
  });

  it("desativada e removida somem; essenciais nunca somem", () => {
    const overrides: QuestionOverrides = {
      emotional_sadness: { active: false, removed: false, sortOrder: null },
      emotional_panic: { active: true, removed: true, sortOrder: null },
      emotional_death_thoughts: { active: false, removed: true, sortOrder: null },
      identification_cpf: { active: false, removed: true, sortOrder: null },
    };
    const ids = applyQuestionOverrides(emotional.questions, overrides).map((question) => question.id);
    expect(ids).not.toContain("emotional_sadness");
    expect(ids).not.toContain("emotional_panic");
    expect(ids).toContain("emotional_death_thoughts");
    expect(isQuestionEnabled("identification_cpf", overrides)).toBe(true);
  });

  it("aplica a ordem personalizada, misturando padrão e personalizadas", () => {
    const first = emotional.questions[0].id;
    const overrides: QuestionOverrides = { [first]: { active: true, removed: false, sortOrder: 9999 } };
    const merged = mergeCustomQuestions(emotional, [], overrides);
    expect(merged[merged.length - 1].id).toBe(first);
  });

  it("validação ignora pergunta obrigatória desativada", () => {
    const answers = fullAnswers();
    const withoutOverride = validateQuestionnaireAnswers(answers);
    expect(withoutOverride.errors.emotional_sadness).toBeDefined();
    const overrides: QuestionOverrides = { emotional_sadness: { active: false, removed: false, sortOrder: null } };
    const withOverride = validateQuestionnaireAnswers(answers, [], overrides);
    expect(withOverride.errors.emotional_sadness).toBeUndefined();
  });

  it("não guarda resposta de pergunta desativada", () => {
    const overrides: QuestionOverrides = { emotional_sadness: { active: false, removed: false, sortOrder: null } };
    const stored = buildStoredAnswers(fullAnswers({ emotional_sadness: "sim", emotional_anxiety: "nao" }), [], overrides);
    expect(stored.emotional_sadness).toBeUndefined();
    expect(stored.emotional_anxiety).toBeDefined();
  });

  it("seção sem nenhuma pergunta visível some do fluxo", () => {
    const overrides: QuestionOverrides = Object.fromEntries(emotional.questions.filter((question) => question.id !== "emotional_death_thoughts").map((question) => [question.id, { active: false, removed: true, sortOrder: null }]));
    // death_thoughts é essencial, então a seção continua; remover a seção de atenção mostra o caso vazio
    const attention = questionnaireSections.find((section) => section.id === "attention_memory")!;
    const attentionOverrides: QuestionOverrides = Object.fromEntries(attention.questions.map((question) => [question.id, { active: false, removed: true, sortOrder: null }]));
    const ids = getEffectiveSections(fullAnswers(), [], { ...overrides, ...attentionOverrides }).map((section) => section.id);
    expect(ids).toContain("emotional_health");
    expect(ids).not.toContain("attention_memory");
  });
});