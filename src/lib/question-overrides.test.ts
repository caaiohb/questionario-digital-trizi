import { describe, expect, it } from "vitest";
import { questionnaireSections } from "@/config/questionnaireConfig";
import { getEffectiveSections, mergeCustomQuestions } from "@/lib/custom-questions";
import { applyQuestionOverrides, isQuestionEnabled } from "@/lib/question-overrides";
import { buildStoredAnswers, validateQuestionnaireAnswers } from "@/lib/validation/questionnaire";
import type { QuestionOverrides } from "@/lib/question-overrides";
import type { RawAnswers } from "@/types/questionnaire";

const emotional = questionnaireSections.find((section) => section.id === "emocional")!;

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
      come_por_emocao: { active: false, removed: false, sortOrder: null },
      acompanhamento_psicologico: { active: true, removed: true, sortOrder: null },
      identification_cpf: { active: false, removed: true, sortOrder: null },
    };
    const ids = applyQuestionOverrides(emotional.questions, overrides).map((question) => question.id);
    expect(ids).not.toContain("come_por_emocao");
    expect(ids).not.toContain("acompanhamento_psicologico");
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
    expect(withoutOverride.errors.come_por_emocao).toBeDefined();
    const overrides: QuestionOverrides = { come_por_emocao: { active: false, removed: false, sortOrder: null } };
    const withOverride = validateQuestionnaireAnswers(answers, [], overrides);
    expect(withOverride.errors.come_por_emocao).toBeUndefined();
  });

  it("não guarda resposta de pergunta desativada", () => {
    const overrides: QuestionOverrides = { come_por_emocao: { active: false, removed: false, sortOrder: null } };
    const stored = buildStoredAnswers(fullAnswers({ come_por_emocao: "nunca", acompanhamento_psicologico: "nunca_fiz" }), [], overrides);
    expect(stored.come_por_emocao).toBeUndefined();
    expect(stored.acompanhamento_psicologico).toBeDefined();
  });

  it("seção sem nenhuma pergunta visível some do fluxo", () => {
    const overrides: QuestionOverrides = Object.fromEntries(emotional.questions.map((question) => [question.id, { active: false, removed: true, sortOrder: null }]));
    // todas as perguntas da seção emocional foram removidas, então a seção some do fluxo
    const words = questionnaireSections.find((section) => section.id === "com_suas_palavras")!;
    const wordsOverrides: QuestionOverrides = Object.fromEntries(words.questions.map((question) => [question.id, { active: false, removed: true, sortOrder: null }]));
    const ids = getEffectiveSections(fullAnswers(), [], { ...overrides, ...wordsOverrides }).map((section) => section.id);
    expect(ids).not.toContain("emocional");
    expect(ids).not.toContain("com_suas_palavras");
  });
});