import { describe, expect, it } from "vitest";
import { optionsForSex, questionnaireSections } from "@/config/questionnaireConfig";
import { buildStoredAnswers, validateQuestionnaireAnswers } from "./questionnaire";
import type { RawAnswers } from "@/types/questionnaire";

function validAnswers(sex: "feminino" | "masculino" = "feminino"): RawAnswers {
  const answers: RawAnswers = { identification_full_name: "Paciente Teste", identification_age: 40, identification_current_weight: 80, identification_desired_weight: 68, identification_height: 1.65, identification_cpf: "123.456.789-09", identification_sex: sex };
  for (const section of questionnaireSections.slice(1)) {
    for (const question of section.questions) {
      if (question.required === false) continue;
      if (question.type === "text" || question.type === "textarea") answers[question.id] = "Teste";
      else if (question.type === "multi") answers[question.id] = [optionsForSex(question, sex)[0].value];
      else if (question.type === "radio" || question.type === "scale") answers[question.id] = optionsForSex(question, sex)[0].value;
      else if (question.type.startsWith("yes_no")) answers[question.id] = "nao";
    }
  }
  return answers;
}

describe("validação do questionário", () => {
  it("aceita um questionário completo", () => { const result = validateQuestionnaireAnswers(validAnswers()); expect(result.errors).toEqual({}); expect(result.success).toBe(true); });
  it("aceita um questionário completo para paciente do sexo masculino", () => { const result = validateQuestionnaireAnswers(validAnswers("masculino")); expect(result.errors).toEqual({}); expect(result.success).toBe(true); });
  it("rejeita identificação ausente", () => { const answers = validAnswers(); delete answers.identification_full_name; const result = validateQuestionnaireAnswers(answers); expect(result.errors.identification_full_name).toBeDefined(); });
  it("mantém IDs estáveis no JSON armazenado", () => { const stored = buildStoredAnswers(validAnswers()); expect(stored.queixa_principal.code).toBe("queixa_principal"); expect(stored.identification_full_name.answer).toBe("Paciente Teste"); });
  it("rejeita CPF com dígitos verificadores inválidos", () => { const answers = validAnswers(); answers.identification_cpf = "123.456.789-00"; const result = validateQuestionnaireAnswers(answers); expect(result.errors.identification_cpf).toBeDefined(); });
  it("rejeita CPF com todos os dígitos iguais", () => { const answers = validAnswers(); answers.identification_cpf = "111.111.111-11"; const result = validateQuestionnaireAnswers(answers); expect(result.errors.identification_cpf).toBeDefined(); });
  it("não exige perguntas femininas de um paciente do sexo masculino", () => { const stored = buildStoredAnswers(validAnswers("masculino")); expect(stored.menstruacao).toBeUndefined(); expect(stored.saude_sexual_urinaria).toBeDefined(); });
  it("não exige perguntas masculinas de uma paciente do sexo feminino", () => { const stored = buildStoredAnswers(validAnswers("feminino")); expect(stored.saude_sexual_urinaria).toBeUndefined(); expect(stored.menstruacao).toBeDefined(); });
  it("exige ao menos uma opção nas perguntas de marcar várias", () => { const answers = validAnswers(); answers.queixa_principal = []; const result = validateQuestionnaireAnswers(answers); expect(result.errors.queixa_principal).toBeDefined(); });
  it("rejeita opção que não existe", () => { const answers = validAnswers(); answers.queixa_areas = ["inventada"]; const result = validateQuestionnaireAnswers(answers); expect(result.errors.queixa_areas).toBeDefined(); });
  it("exige o texto quando \"Outro\" é marcado", () => {
    const answers = validAnswers(); answers.queixa_principal = ["cansaco", "outro"]; delete answers.queixa_principal_outro;
    expect(validateQuestionnaireAnswers(answers).errors.queixa_principal_outro).toBeDefined();
    answers.queixa_principal_outro = "Dor de cabeça";
    expect(validateQuestionnaireAnswers(answers).success).toBe(true);
  });
  it("descarta opção de outro sexo guardada por engano", () => {
    const answers = validAnswers("masculino"); answers.queixa_principal = ["ondas_calor"];
    expect(validateQuestionnaireAnswers(answers).errors.queixa_principal).toBeDefined();
  });
  it("exige a escala de 0 a 10 e rejeita valores fora dela", () => {
    const answers = validAnswers(); answers.queixa_impacto = "11";
    expect(validateQuestionnaireAnswers(answers).errors.queixa_impacto).toBeDefined();
    answers.queixa_impacto = "10";
    expect(validateQuestionnaireAnswers(answers).errors.queixa_impacto).toBeUndefined();
  });
  it("não guarda resposta de pergunta oculta", () => {
    const answers = validAnswers("masculino"); answers.menstruacao = "regular";
    expect(buildStoredAnswers(answers).menstruacao).toBeUndefined();
  });
});