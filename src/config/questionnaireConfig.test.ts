import { describe, expect, it } from "vitest";
import { allQuestions, answerLabel, computePriorityAlert, isQuestionVisible, optionsForSex, questionnaireSections, questionsById, QUESTIONNAIRE_VERSION, sanitizeAnswers } from "./questionnaireConfig";

describe("questionnaireConfig", () => {
  it("mantém IDs e códigos únicos", () => { expect(new Set(allQuestions.map((q) => q.id)).size).toBe(allQuestions.length); expect(new Set(allQuestions.map((q) => q.code)).size).toBe(allQuestions.length); });
  it("contém a identificação e as 8 etapas do formulário", () => { expect(questionnaireSections).toHaveLength(9); expect(allQuestions.length).toBeGreaterThan(30); });
  it("vincula todas as perguntas à versão atual", () => { expect(allQuestions.every((q) => q.version === QUESTIONNAIRE_VERSION)).toBe(true); });
  it("toda pergunta de escolha tem opções com valores únicos", () => {
    for (const question of allQuestions.filter((item) => ["radio", "multi", "scale", "yes_no"].includes(item.type))) {
      const values = (question.options ?? []).map((option) => option.value);
      expect(values.length, question.id).toBeGreaterThan(1);
      expect(new Set(values).size, question.id).toBe(values.length);
    }
  });
  it("mostra só as opções do sexo informado", () => {
    const question = questionsById.get("queixa_principal")!;
    const feminino = optionsForSex(question, "feminino").map((option) => option.value);
    const masculino = optionsForSex(question, "masculino").map((option) => option.value);
    expect(feminino).toContain("ondas_calor");
    expect(feminino).not.toContain("erecao_fraca");
    expect(masculino).toContain("erecao_fraca");
    expect(masculino).not.toContain("ondas_calor");
  });
  it("separa as perguntas exclusivas de cada sexo", () => {
    expect(isQuestionVisible(questionsById.get("menstruacao")!, { identification_sex: "feminino" })).toBe(true);
    expect(isQuestionVisible(questionsById.get("menstruacao")!, { identification_sex: "masculino" })).toBe(false);
    expect(isQuestionVisible(questionsById.get("saude_sexual_urinaria")!, { identification_sex: "masculino" })).toBe(true);
    expect(isQuestionVisible(questionsById.get("saude_sexual_urinaria")!, { identification_sex: "feminino" })).toBe(false);
  });
  it("a pergunta de texto do \"Outro\" só aparece quando a opção é marcada", () => {
    const outro = questionsById.get("queixa_principal_outro")!;
    expect(isQuestionVisible(outro, { identification_sex: "feminino", queixa_principal: ["cansaco"] })).toBe(false);
    expect(isQuestionVisible(outro, { identification_sex: "feminino", queixa_principal: ["cansaco", "outro"] })).toBe(true);
  });
  it("remove opções do outro sexo quando a pessoa troca o sexo", () => {
    const result = sanitizeAnswers({ identification_sex: "masculino", queixa_principal: ["ondas_calor", "cansaco"], sono: ["acordo_cansada"], decisao_saude: "sozinha" });
    expect(result.queixa_principal).toEqual(["cansaco"]);
    expect(result.sono).toEqual([]);
    expect(result.decisao_saude).toBeUndefined();
  });
  it("sinaliza alerta prioritário pelos sinais de alerta", () => {
    expect(computePriorityAlert({ identification_sex: "feminino", sinais_alerta_feminino: "sim" })).toBe(true);
    expect(computePriorityAlert({ identification_sex: "masculino", sinais_alerta_masculino: "sim" })).toBe(true);
    expect(computePriorityAlert({ identification_sex: "masculino", sinais_alerta_feminino: "sim" })).toBe(false);
    expect(computePriorityAlert({ identification_sex: "feminino", sinais_alerta_feminino: "nao" })).toBe(false);
  });
  it("mostra os rótulos das opções marcadas", () => {
    expect(answerLabel(questionsById.get("queixa_areas")!, ["trabalho", "como_me_vejo"])).toBe("Trabalho, Como me vejo");
    expect(answerLabel(questionsById.get("queixa_impacto")!, "7")).toBe("7");
    expect(answerLabel(questionsById.get("queixa_tempo")!, "1_a_3_anos")).toBe("1 a 3 anos");
  });
});