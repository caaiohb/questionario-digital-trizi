import { describe, expect, it } from "vitest";
import { buildLetterDefaults, firstNameOnly } from "@/lib/letter-defaults";
import { installmentValue, parseMoney, renderLetterPrompt, LETTER_TEMPLATE } from "@/lib/letter-prompt";

describe("carta para pessoa próxima", () => {
  it("usa só o primeiro nome", () => {
    expect(firstNameOnly("MARIA APARECIDA da Silva")).toBe("Maria");
    expect(firstNameOnly("  joão ")).toBe("João");
    expect(firstNameOnly(null)).toBe("");
  });

  it("monta os valores a partir do prontuário e do questionário", () => {
    const answers = {
      identification_sex: { questionId: "identification_sex", answer: "feminino" },
      queixa_principal: { questionId: "queixa_principal", answer: ["cansaco"] },
      queixa_principal_detalhe: { questionId: "queixa_principal_detalhe", answer: "Minha mente não para" },
      queixa_impacto: { questionId: "queixa_impacto", answer: "8" },
      objetivo_seis_meses: { questionId: "objetivo_seis_meses", answer: "Voltar a ter energia" },
    };
    const values = buildLetterDefaults({ patient_name: "ANA PAULA SOUZA", patient_age: 45, answers });
    expect(values.nome_paciente).toBe("Ana");
    expect(values.idade).toBe("45");
    expect(values.sexo).toBe("feminino");
    expect(values.nota_impacto).toBe("8");
    expect(values.frases_paciente).toContain("“Minha mente não para”");
    expect(values.objetivo_paciente).toBe("Voltar a ter energia");
    expect(values.nome_destinatario).toBe("");
  });

  it("não deixa nome completo nem CPF no prompt e troca todos os campos", () => {
    const values = buildLetterDefaults({ patient_name: "Ana Paula Souza", patient_age: 45, answers: { identification_cpf: { questionId: "identification_cpf", answer: "12345678900" } } });
    const prompt = renderLetterPrompt({ ...values, nome_destinatario: "Carlos", vinculo: "marido", qtd_parcelas: "10", valor_parcela: "R$ 990,00" });
    expect(prompt).toContain("Nome: Ana");
    expect(prompt).not.toContain("Paula");
    expect(prompt).not.toContain("12345678900");
    expect(prompt).toContain("10 parcelas de R$ 990,00");
    expect(prompt).not.toMatch(/\{\{/);
  });

  it("campo em branco vira (vazio) e o modelo usa todos os campos", () => {
    expect(renderLetterPrompt({})).toContain("Contato para agendar: (vazio)");
    const keys = new Set(Array.from(LETTER_TEMPLATE.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1]));
    expect(keys.size).toBe(18);
  });

  it("calcula a parcela a partir do valor do plano", () => {
    expect(installmentValue("12.000,00", "10")).toBe("R$ 1.200,00");
    expect(installmentValue("R$ 9900", "12")).toBe("R$ 825,00");
    expect(installmentValue("12000", "3")).toBe("R$ 4.000,00");
    expect(installmentValue("10000", "3")).toBe("R$ 3.333,33");
    expect(installmentValue("", "10")).toBeNull();
    expect(installmentValue("12000", "0")).toBeNull();
    expect(installmentValue("12000", "abc")).toBeNull();
    expect(parseMoney("1.234")).toBe(1234);
    expect(parseMoney("1.234,56")).toBe(1234.56);
  });
});