import { describe, expect, it } from "vitest";
import { allQuestions, menopauseAutoAnswerQuestionIds, normalizeMenopauseAnswers, questionnaireSections, QUESTIONNAIRE_VERSION } from "./questionnaireConfig";

describe("questionnaireConfig", () => {
  it("mantém IDs e códigos únicos", () => { expect(new Set(allQuestions.map((q) => q.id)).size).toBe(allQuestions.length); expect(new Set(allQuestions.map((q) => q.code)).size).toBe(allQuestions.length); });
  it("contém as 15 seções clínicas", () => { expect(questionnaireSections).toHaveLength(15); expect(allQuestions.length).toBeGreaterThan(90); });
  it("vincula todas as perguntas à versão atual", () => { expect(allQuestions.every((q) => q.version === QUESTIONNAIRE_VERSION)).toBe(true); });
  it("preenche perguntas menstruais como não aplicáveis na menopausa", () => { const result = normalizeMenopauseAnswers({ menstrual_status: "over_10_never_hormones" }); for (const id of menopauseAutoAnswerQuestionIds) expect(result[id]).toBe("nao_aplica"); });
  it("preserva respostas revisadas manualmente após a sugestão de menopausa", () => {
    const result = normalizeMenopauseAnswers({ menstrual_status: "over_10_never_hormones", hormonal_contraceptive: "sim" });
    expect(result.hormonal_contraceptive).toBe("sim");
  });
});
