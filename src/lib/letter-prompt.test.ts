import { describe, expect, it } from "vitest";
import { buildLetterDefaults, firstNameOnly, questionnaireForLetter } from "@/lib/letter-defaults";
import { normalizeLetterPlan } from "@/lib/letter-plan";
import { DEFAULT_LETTER_PLAN, installmentValue, parseMoney, renderLetterPrompt, LETTER_TEMPLATE } from "@/lib/letter-prompt";

const answers = {
  identification_full_name: { questionId: "identification_full_name", question: "Nome completo", answer: "Ana Paula Souza", section: "Identificação" },
  identification_cpf: { questionId: "identification_cpf", question: "CPF", answer: "12345678900", section: "Identificação" },
  identification_sex: { questionId: "identification_sex", question: "Sexo biológico", answer: "feminino", section: "Identificação" },
  queixa_principal: { questionId: "queixa_principal", question: "O que mais te incomoda hoje?", answer: ["cansaco"], section: "Motivo da consulta" },
  queixa_principal_detalhe: { questionId: "queixa_principal_detalhe", question: "Quer contar mais? (opcional)", answer: "Minha mente não para", section: "Motivo da consulta" },
  queixa_impacto: { questionId: "queixa_impacto", question: "De 0 a 10, quanto isso afeta seu dia a dia?", answer: "8", section: "Motivo da consulta" },
};
const row = { patient_name: "ANA PAULA SOUZA", patient_age: 45, current_weight: 70, desired_weight: 62, height: 1.65, answers };

describe("carta para o marido", () => {
  it("usa só o primeiro nome", () => {
    expect(firstNameOnly("MARIA APARECIDA da Silva")).toBe("Maria");
    expect(firstNameOnly("  joão ")).toBe("João");
    expect(firstNameOnly(null)).toBe("");
  });

  it("leva o questionário sem nome, CPF, peso nem altura", () => {
    const block = questionnaireForLetter(row);
    expect(block).toContain("Minha mente não para");
    expect(block).toContain("De 0 a 10, quanto isso afeta seu dia a dia?: 8");
    expect(block).not.toContain("12345678900");
    expect(block).not.toContain("Ana Paula Souza");
    expect(block).not.toContain("Peso");
    expect(block).not.toContain("Idade:");
  });

  it("usa o texto guardado quando as respostas já foram arquivadas", () => {
    const block = questionnaireForLetter({ patient_age: 40, answers: {}, ai_prompt_text: "=== RESPOSTAS DA PACIENTE (sem identificação) ===\nIdade: 40 | Peso atual: 70 kg\n\n## Motivo\n- Queixa: cansaço" });
    expect(block).toContain("- Queixa: cansaço");
    expect(block).not.toContain("Idade:");
  });

  it("monta os valores a partir do prontuário e do plano cadastrado", () => {
    const plan = normalizeLetterPlan({ duracao_meses: "12", qtd_parcelas: "10", contato: "(11) 99999-0000", uf_crm: "sp" });
    const values = buildLetterDefaults(row, plan);
    expect(values.nome_paciente).toBe("Ana");
    expect(values.idade).toBe("45");
    expect(values.sexo).toBe("feminino");
    expect(values.vinculo).toBe("marido");
    expect(values.uf_crm).toBe("SP");
    expect(values.equipe).toBe(DEFAULT_LETTER_PLAN.equipe);
    expect(values.nome_destinatario).toBe("");
  });

  it("o prompt final não tem nome completo nem CPF e todos os campos são trocados", () => {
    const plan = normalizeLetterPlan({ duracao_meses: "12", qtd_parcelas: "10", contato: "(11) 99999-0000", uf_crm: "SP" });
    const prompt = renderLetterPrompt({ ...buildLetterDefaults(row, plan), nome_destinatario: "Carlos", valor_parcela: installmentValue("12.000,00", "10") ?? "" });
    expect(prompt).toContain("Nome: Ana");
    expect(prompt).not.toContain("Paula");
    expect(prompt).not.toContain("12345678900");
    expect(prompt).toContain("10 parcelas de R$ 1.200,00");
    expect(prompt).not.toContain("12.000");
    expect(prompt).toContain("Minha mente não para");
    expect(prompt).toContain("começando com “Caro Carlos,”");
    expect(prompt).toContain("Duração: 12 meses");
    expect(prompt).toContain("transformar a vida de Ana");
    expect(prompt).not.toContain("Querido Carlos");
    expect(prompt).not.toMatch(/\{\{/);
  });

  it("campo em branco vira (vazio) e o modelo usa os 12 campos", () => {
    expect(renderLetterPrompt({})).toContain("Contato para agendar: (vazio)");
    const keys = new Set(Array.from(LETTER_TEMPLATE.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1]));
    expect(keys.size).toBe(12);
  });

  it("calcula a parcela a partir do valor do plano", () => {
    expect(installmentValue("12.000,00", "10")).toBe("R$ 1.200,00");
    expect(installmentValue("R$ 9900", "12")).toBe("R$ 825,00");
    expect(installmentValue("10000", "3")).toBe("R$ 3.333,33");
    expect(installmentValue("", "10")).toBeNull();
    expect(installmentValue("12000", "")).toBeNull();
    expect(installmentValue("12000", "0")).toBeNull();
    expect(parseMoney("1.234")).toBe(1234);
    expect(parseMoney("1.234,56")).toBe(1234.56);
  });
});