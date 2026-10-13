import type { ConditionalRule, QuestionOption, QuestionnaireQuestion, QuestionnaireSection, RawAnswers } from "@/types/questionnaire";

export const QUESTIONNAIRE_VERSION = "2026.10.1";

export const yesNo = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
];

/** Escala de 0 a 10 (0 = nada, 10 = muito). Guardada como texto: "0" a "10". */
export const scaleOptions: QuestionOption[] = Array.from({ length: 11 }, (_, index) => ({ value: String(index), label: String(index) }));

type Sex = "feminino" | "masculino";

const ifFemale: ConditionalRule = { questionId: "identification_sex", equals: "feminino" };
const ifMale: ConditionalRule = { questionId: "identification_sex", equals: "masculino" };

const o = (value: string, label: string, sex?: Sex): QuestionOption => (sex ? { value, label, sex } : { value, label });

const q = (
  sectionId: string,
  order: number,
  data: Omit<QuestionnaireQuestion, "sectionId" | "order" | "version" | "code"> & { code?: string },
): QuestionnaireQuestion => ({ ...data, code: data.code ?? data.id, sectionId, order, version: QUESTIONNAIRE_VERSION });

const MARK_MANY = "Marque quantas quiser.";

export const questionnaireSections: QuestionnaireSection[] = [
  {
    id: "identification",
    title: "Identificação e dados corporais",
    shortTitle: "Identificação",
    description: "Informe seus dados básicos para identificação do questionário.",
    order: 1,
    questions: [
      q("identification", 1, { id: "identification_full_name", code: "patient_full_name", text: "Nome completo", type: "text", required: true, placeholder: "Digite seu nome completo", summaryMode: "always" }),
      q("identification", 2, { id: "identification_age", code: "patient_age", text: "Idade", type: "number", required: true, min: 12, max: 120, step: 1, unit: "anos", summaryMode: "always" }),
      q("identification", 3, { id: "identification_current_weight", code: "current_weight_kg", text: "Peso atual", type: "number", required: true, min: 25, max: 400, step: 0.1, unit: "kg", summaryMode: "always" }),
      q("identification", 4, { id: "identification_desired_weight", code: "desired_weight_kg", text: "Peso desejado", type: "number", required: true, min: 25, max: 400, step: 0.1, unit: "kg", summaryMode: "always" }),
      q("identification", 5, { id: "identification_height", code: "height_meters", text: "Altura", type: "height", required: true, helperText: "Você pode informar em centímetros ou metros. O sistema padronizará o valor em metros.", summaryMode: "always" }),
      q("identification", 6, { id: "identification_cpf", code: "patient_cpf", text: "CPF", type: "cpf", required: true, placeholder: "000.000.000-00", helperText: "Usado apenas para identificação no seu prontuário.", summaryMode: "always" }),
      q("identification", 7, { id: "identification_sex", code: "patient_sex", text: "Sexo biológico", type: "radio", required: true, summaryMode: "always", options: [
        { value: "feminino", label: "Feminino" },
        { value: "masculino", label: "Masculino" },
      ] }),
    ],
  },
  {
    id: "motivo_consulta",
    title: "O que te trouxe",
    shortTitle: "O que te trouxe",
    description: "Estas perguntas ajudam a Dra. Janifer Trizi a conhecer você e a preparar uma consulta pensada na sua história.",
    order: 2,
    questions: [
      q("motivo_consulta", 1, { id: "queixa_principal", text: "O que mais te incomoda hoje?", type: "multi", required: true, helperText: MARK_MANY, summaryMode: "always", options: [
        o("cansaco", "Cansaço"),
        o("ganho_peso", "Ganho de peso"),
        o("libido_baixa", "Libido baixa"),
        o("erecao_fraca", "Ereção mais fraca ou difícil", "masculino"),
        o("ondas_calor", "Ondas de calor", "feminino"),
        o("secura_vaginal", "Secura vaginal", "feminino"),
        o("perda_massa_muscular", "Perda de massa muscular ou força"),
        o("tristeza_ansiedade", "Tristeza ou ansiedade"),
        o("irritabilidade", "Irritabilidade"),
        o("queda_cabelo_pele_seca", "Queda de cabelo ou pele seca"),
        o("dor_articulacoes", "Dor nas articulações"),
        o("autoestima", "Autoestima"),
        o("outro", "Outro"),
      ] }),
      q("motivo_consulta", 2, { id: "queixa_principal_outro", text: "Você marcou \"Outro\". Escreva aqui o que é:", type: "text", required: true, condition: { questionId: "queixa_principal", includes: "outro" }, summaryMode: "when_filled" }),
      q("motivo_consulta", 3, { id: "queixa_principal_detalhe", text: "Quer contar mais? (opcional)", type: "text", required: false, summaryMode: "when_filled" }),
      q("motivo_consulta", 4, { id: "queixa_tempo", text: "Há quanto tempo isso acontece?", type: "radio", required: true, summaryMode: "always", options: [
        o("menos_6_meses", "Menos de 6 meses"),
        o("6_meses_1_ano", "6 meses a 1 ano"),
        o("1_a_3_anos", "1 a 3 anos"),
        o("mais_3_anos", "Mais de 3 anos"),
      ] }),
      q("motivo_consulta", 5, { id: "queixa_impacto", text: "De 0 a 10, quanto isso afeta seu dia a dia?", type: "scale", required: true, helperText: "0 = nada · 10 = muito", options: scaleOptions, summaryMode: "always" }),
      q("motivo_consulta", 6, { id: "queixa_areas", text: "Onde isso mais te afeta na sua vida?", type: "multi", required: true, helperText: MARK_MANY, summaryMode: "always", options: [
        o("trabalho", "Trabalho"),
        o("relacionamento", "Relacionamento"),
        o("familia", "Família"),
        o("vida_social", "Vida social"),
        o("como_me_vejo", "Como me vejo"),
      ] }),
    ],
  },
  {
    id: "saude_geral",
    title: "Sua saúde",
    shortTitle: "Sua saúde",
    order: 3,
    questions: [
      q("saude_geral", 1, { id: "condicoes_saude", text: "Marque o que você tem ou já teve:", type: "multi", required: true, helperText: MARK_MANY, summaryMode: "always", sensitive: true, options: [
        o("pressao_alta", "Pressão alta"),
        o("diabetes_resistencia_insulina", "Diabetes ou resistência à insulina"),
        o("colesterol_triglicerides", "Colesterol ou triglicérides alto"),
        o("coracao_arritmia", "Doença no coração ou arritmia"),
        o("trombose_embolia_avc", "Trombose, embolia ou AVC"),
        o("tireoide", "Tireoide"),
        o("suprarrenal", "Suprarrenal"),
        o("figado", "Fígado (inclui gordura no fígado)"),
        o("apneia_sono", "Apneia do sono"),
        o("enxaqueca_aura", "Enxaqueca com aura"),
        o("endometriose_miomas", "Endometriose ou miomas", "feminino"),
        o("nodulo_mamas", "Nódulo ou alteração nas mamas", "feminino"),
        o("prostata_psa", "Próstata aumentada ou PSA alterado", "masculino"),
        o("osteopenia_osteoporose", "Osteopenia ou osteoporose"),
        o("depressao_ansiedade", "Depressão ou ansiedade diagnosticada"),
        o("fumo", "Fumo atualmente"),
        o("nenhuma", "Nenhuma"),
      ] }),
      q("saude_geral", 2, { id: "condicoes_saude_detalhe", text: "Outras condições ou detalhes (opcional)", type: "text", required: false, summaryMode: "when_filled", sensitive: true }),
      q("saude_geral", 3, { id: "historico_cancer", text: "Você já teve câncer?", type: "radio", required: true, summaryMode: "always", sensitive: true, options: [
        o("nao", "Não"),
        o("mama", "Sim, de mama", "feminino"),
        o("utero_endometrio_ovario", "Sim, de útero, endométrio ou ovário", "feminino"),
        o("prostata", "Sim, de próstata", "masculino"),
        o("testiculo", "Sim, de testículo", "masculino"),
        o("outro_tipo", "Sim, outro tipo"),
      ] }),
      q("saude_geral", 4, { id: "historico_cancer_detalhe", text: "Se sim, qual e em que ano? (opcional)", type: "text", required: false, summaryMode: "when_filled", sensitive: true }),
      q("saude_geral", 5, { id: "cirurgias", text: "Você já fez alguma destas cirurgias?", type: "multi", required: true, helperText: MARK_MANY, summaryMode: "always", options: [
        o("retirada_utero", "Retirada do útero", "feminino"),
        o("retirada_ovarios", "Retirada de um ou dos dois ovários", "feminino"),
        o("cirurgia_mamas", "Cirurgia nas mamas", "feminino"),
        o("cirurgia_prostata", "Cirurgia de próstata", "masculino"),
        o("vasectomia", "Vasectomia", "masculino"),
        o("bariatrica", "Bariátrica"),
        o("cirurgia_tireoide", "Cirurgia de tireoide"),
        o("outra", "Outra"),
        o("nenhuma", "Nenhuma"),
      ] }),
      q("saude_geral", 6, { id: "cirurgias_outra", text: "Você marcou \"Outra\". Escreva qual cirurgia e em que ano:", type: "text", required: true, condition: { questionId: "cirurgias", includes: "outra" }, summaryMode: "when_filled" }),
    ],
  },
  {
    id: "hormonios_medicamentos",
    title: "Hormônios e medicamentos",
    shortTitle: "Hormônios e medicamentos",
    order: 4,
    questions: [
      q("hormonios_medicamentos", 1, { id: "menstruacao", text: "Sobre sua menstruação:", type: "radio", required: true, condition: ifFemale, summaryMode: "always", options: [
        o("regular", "Menstruo regularmente"),
        o("irregular", "Está irregular"),
        o("parou_menos_1_ano", "Parou há menos de 1 ano"),
        o("parou_mais_1_ano", "Parou há mais de 1 ano"),
        o("parou_cirurgia_tratamento", "Parou por cirurgia ou tratamento"),
      ] }),
      q("hormonios_medicamentos", 2, { id: "saude_sexual_urinaria", text: "Sobre sua saúde sexual e urinária:", type: "multi", required: true, helperText: MARK_MANY, condition: ifMale, summaryMode: "always", sensitive: true, options: [
        o("sem_queixas", "Sem queixas"),
        o("erecao_mais_fraca", "Ereção mais fraca que antes"),
        o("dificuldade_erecao_frequente", "Dificuldade frequente de ereção"),
        o("levanta_noite_urinar", "Levanto à noite para urinar"),
        o("jato_fraco", "Jato de urina fraco"),
      ] }),
      q("hormonios_medicamentos", 3, { id: "uso_hormonal_feminino", text: "Já usou reposição hormonal, implante ou anticoncepcional hormonal?", type: "radio", required: true, condition: ifFemale, summaryMode: "always", sensitive: true, options: [
        o("nunca", "Nunca"),
        o("ja_usei_parei", "Já usei e parei"),
        o("uso_atualmente", "Uso atualmente"),
      ] }),
      q("hormonios_medicamentos", 4, { id: "uso_hormonal_feminino_detalhe", text: "Qual e por quanto tempo? (opcional)", type: "text", required: false, condition: ifFemale, summaryMode: "when_filled", sensitive: true }),
      q("hormonios_medicamentos", 5, { id: "uso_hormonal_masculino", text: "Já usou testosterona, anabolizante, implante ou remédio para ereção?", type: "radio", required: true, condition: ifMale, summaryMode: "always", sensitive: true, options: [
        o("nunca", "Nunca"),
        o("ja_usei_parei", "Já usei e parei"),
        o("uso_atualmente", "Uso atualmente"),
      ] }),
      q("hormonios_medicamentos", 6, { id: "uso_hormonal_masculino_detalhe", text: "Qual e por quanto tempo? (opcional)", type: "text", required: false, condition: ifMale, summaryMode: "when_filled", sensitive: true }),
      q("hormonios_medicamentos", 7, { id: "medicamentos_alergias", text: "Quais remédios, vitaminas ou suplementos você usa? Tem alguma alergia?", type: "textarea", required: true, helperText: "Se não usa nada e não tem alergia, escreva \"nenhum\".", quickFill: "nenhum", summaryMode: "always" }),
    ],
  },
  {
    id: "familia_exames",
    title: "Família e exames",
    shortTitle: "Família e exames",
    order: 5,
    questions: [
      q("familia_exames", 1, { id: "historico_familiar", text: "Na sua família (pais, irmãos, avós), alguém teve:", type: "multi", required: true, helperText: MARK_MANY, summaryMode: "always", options: [
        o("cancer_mama", "Câncer de mama"),
        o("cancer_ovario_utero", "Câncer de ovário ou útero"),
        o("cancer_prostata", "Câncer de próstata"),
        o("infarto_avc_antes_60", "Infarto ou AVC antes dos 60 anos"),
        o("trombose", "Trombose"),
        o("diabetes", "Diabetes"),
        o("osteoporose", "Osteoporose"),
        o("nenhuma", "Nenhuma"),
        o("nao_sei", "Não sei"),
      ] }),
      q("familia_exames", 2, { id: "exames_ultimo_ano", text: "Quais exames você fez no último ano?", type: "multi", required: true, helperText: MARK_MANY, summaryMode: "always", options: [
        o("exames_sangue", "Exames de sangue"),
        o("mamografia", "Mamografia", "feminino"),
        o("ultrassom_mamas", "Ultrassom de mamas", "feminino"),
        o("preventivo", "Preventivo (papanicolau)", "feminino"),
        o("ultrassom_transvaginal", "Ultrassom transvaginal", "feminino"),
        o("psa", "PSA", "masculino"),
        o("urologista", "Consulta com urologista", "masculino"),
        o("exames_coracao", "Exames do coração (eletro, teste ergométrico)"),
        o("densitometria", "Densitometria óssea"),
        o("nenhum", "Nenhum"),
      ] }),
    ],
  },
  {
    id: "rotina",
    title: "Sua rotina",
    shortTitle: "Sua rotina",
    order: 6,
    questions: [
      q("rotina", 1, { id: "sono", text: "Como está seu sono?", type: "multi", required: true, helperText: MARK_MANY, summaryMode: "always", options: [
        o("durmo_bem", "Durmo bem"),
        o("demoro_dormir", "Demoro a dormir"),
        o("acordo_varias_vezes", "Acordo várias vezes"),
        o("acordo_cansada", "Acordo cansada", "feminino"),
        o("acordo_cansado", "Acordo cansado", "masculino"),
        o("ronco_apneia", "Ronco ou dizem que paro de respirar"),
      ] }),
      q("rotina", 2, { id: "alimentacao", text: "Como está sua alimentação hoje?", type: "radio", required: true, summaryMode: "always", options: [
        o("muito_boa", "Muito boa"),
        o("boa_sem_resultado", "Boa, mas não vejo resultado"),
        o("irregular", "Irregular"),
        o("preciso_melhorar", "Sei que preciso melhorar"),
      ] }),
      q("rotina", 3, { id: "comportamentos_frequentes", text: "O que acontece com você com frequência?", type: "multi", required: true, helperText: MARK_MANY, summaryMode: "always", options: [
        o("vontade_doce", "Vontade de doce"),
        o("belisco", "Belisco ao longo do dia"),
        o("como_mais_noite", "Como mais à noite"),
        o("pulo_refeicoes", "Pulo refeições"),
        o("pouca_agua", "Bebo pouca água"),
        o("alcool_3x_semana", "Bebida alcoólica 3 vezes por semana ou mais"),
        o("intestino_preso", "Intestino preso"),
        o("nada_disso", "Nada disso"),
      ] }),
      q("rotina", 4, { id: "atividade_fisica", text: "E a atividade física?", type: "radio", required: true, summaryMode: "always", options: [
        o("regular", "Faço com regularidade"),
        o("as_vezes", "Às vezes"),
        o("quero_nao_consigo", "Quero, mas não consigo começar"),
        o("nao_gosto", "Não gosto"),
      ] }),
      q("rotina", 5, { id: "barreira_cuidado", text: "O que mais te impede de cuidar de você?", type: "radio", required: true, summaryMode: "always", options: [
        o("tempo", "Tempo"),
        o("cansaco", "Cansaço"),
        o("falta_orientacao", "Falta de orientação"),
        o("tentei_desisti", "Já tentei e desisti"),
        o("custo", "Custo"),
      ] }),
    ],
  },
  {
    id: "emocional",
    title: "Como você está por dentro",
    shortTitle: "Como você está por dentro",
    order: 7,
    questions: [
      q("emocional", 1, { id: "estresse_nivel", text: "De 0 a 10, como está seu nível de estresse ou esgotamento?", type: "scale", required: true, helperText: "0 = nada · 10 = muito", options: scaleOptions, summaryMode: "always" }),
      q("emocional", 2, { id: "come_por_emocao", text: "Com que frequência você come por ansiedade, tristeza ou tédio?", type: "radio", required: true, summaryMode: "always", options: [
        o("nunca", "Nunca"),
        o("as_vezes", "Às vezes"),
        o("quase_todos_dias", "Quase todos os dias"),
      ] }),
      q("emocional", 3, { id: "acompanhamento_psicologico", text: "Você faz ou já fez acompanhamento psicológico ou psiquiátrico?", type: "radio", required: true, summaryMode: "always", sensitive: true, options: [
        o("faco_atualmente", "Faço atualmente"),
        o("ja_fiz", "Já fiz"),
        o("nunca_fiz", "Nunca fiz"),
      ] }),
      // Pergunta de segurança mantida: aciona o alerta prioritário e a mensagem de apoio. Não pode ser desativada.
      q("emocional", 4, { id: "emotional_death_thoughts", code: "mental_health_death_thoughts", text: "Pensou, por mais de uma vez, que seria melhor se estivesse morta?", type: "yes_no", options: yesNo, required: true, priorityTriggerValue: "sim", summaryMode: "always", sensitive: true }),
    ],
  },
  {
    id: "seu_momento",
    title: "Seu momento",
    shortTitle: "Seu momento",
    order: 8,
    questions: [
      q("seu_momento", 1, { id: "tentativa_anterior", text: "Você já tentou resolver isso antes?", type: "radio", required: true, summaryMode: "always", options: [
        o("ainda_nao_tentei", "Ainda não tentei"),
        o("nao_consegui_manter", "Tentei, mas não consegui manter"),
        o("faltou_acompanhamento", "Tentei, mas faltou acompanhamento"),
        o("ninguem_achou_causa", "Tentei, mas ninguém encontrou a causa"),
      ] }),
      q("seu_momento", 2, { id: "decisao_saude", text: "Decisões sobre sua saúde, você costuma tomar:", type: "radio", required: true, summaryMode: "always", options: [
        o("sozinha", "Sozinha", "feminino"),
        o("sozinho", "Sozinho", "masculino"),
        o("com_parceiro", "Com meu parceiro", "feminino"),
        o("com_parceira_ou_parceiro", "Com minha parceira ou parceiro", "masculino"),
        o("com_familia", "Com a família"),
      ] }),
      q("seu_momento", 3, { id: "tipo_cuidado", text: "Que tipo de cuidado combina com você?", type: "radio", required: true, summaryMode: "always", options: [
        o("consulta_pontual", "Consulta pontual"),
        o("acompanhamento_meses", "Acompanhamento de alguns meses"),
        o("entender_na_consulta", "Quero entender melhor na consulta"),
      ] }),
      q("seu_momento", 4, { id: "sinais_alerta_feminino", text: "Nas últimas semanas, você teve tristeza intensa na maior parte dos dias, sangramento fora do padrão ou dor no peito?", type: "yes_no", options: yesNo, required: true, condition: ifFemale, priorityTriggerValue: "sim", alertWhenYes: "Obrigada por contar. Se algum desses sinais estiver acontecendo agora ou for intenso, procure atendimento médico ou fale com a clínica antes da consulta.", summaryMode: "always", sensitive: true }),
      q("seu_momento", 5, { id: "sinais_alerta_masculino", text: "Nas últimas semanas, você teve tristeza intensa na maior parte dos dias, sangue na urina ou dor no peito?", type: "yes_no", options: yesNo, required: true, condition: ifMale, priorityTriggerValue: "sim", alertWhenYes: "Obrigada por contar. Se algum desses sinais estiver acontecendo agora ou for intenso, procure atendimento médico ou fale com a clínica antes da consulta.", summaryMode: "always", sensitive: true }),
    ],
  },
  {
    id: "com_suas_palavras",
    title: "Com suas palavras",
    shortTitle: "Com suas palavras",
    order: 9,
    questions: [
      q("com_suas_palavras", 1, { id: "objetivo_seis_meses", text: "O que você mais precisa resolver hoje, e como quer estar se sentindo daqui a 6 meses?", type: "textarea", required: true, helperText: "Escreva em até 5 linhas, do seu jeito.", summaryMode: "always" }),
    ],
  },
];

export const allQuestions = questionnaireSections.flatMap((section) => section.questions);
export const questionsById = new Map(allQuestions.map((question) => [question.id, question]));
export const sectionsById = new Map(questionnaireSections.map((section) => [section.id, section]));

function ruleMatches(rule: ConditionalRule, answers: RawAnswers): boolean {
  const value = answers[rule.questionId] ?? null;
  if (rule.includes !== undefined) return Array.isArray(value) && value.includes(rule.includes);
  if (rule.equals !== undefined) return value === rule.equals;
  if (rule.in) return rule.in.includes(value as never);
  return true;
}

export function isSectionVisible(section: QuestionnaireSection, answers: RawAnswers): boolean {
  return section.condition ? ruleMatches(section.condition, answers) : true;
}

export function isQuestionVisible(question: QuestionnaireQuestion, answers: RawAnswers): boolean {
  const section = sectionsById.get(question.sectionId);
  if (section && !isSectionVisible(section, answers)) return false;
  return question.condition ? ruleMatches(question.condition, answers) : true;
}

export function getVisibleSections(answers: RawAnswers): QuestionnaireSection[] {
  return questionnaireSections.filter((section) => isSectionVisible(section, answers));
}

/** Opções que cabem ao sexo informado (opções sem sexo aparecem para todos). */
export function optionsForSex(question: QuestionnaireQuestion, sex: unknown): QuestionOption[] {
  return (question.options ?? []).filter((option) => !option.sex || option.sex === sex);
}

/**
 * Remove das respostas as opções que não pertencem ao sexo informado (quem volta atrás e troca o sexo
 * não pode ficar com resposta "invisível" de outro sexo) e valores de escolha única que deixaram de existir.
 */
export function sanitizeAnswers(input: RawAnswers): RawAnswers {
  const next: RawAnswers = { ...input };
  const sex = next.identification_sex;
  for (const question of allQuestions) {
    const value = next[question.id];
    if (value === undefined || value === null || !question.options?.some((option) => option.sex)) continue;
    const allowed = new Set(optionsForSex(question, sex).map((option) => option.value));
    if (Array.isArray(value)) next[question.id] = value.filter((item) => allowed.has(item));
    else if (typeof value === "string" && !allowed.has(value)) delete next[question.id];
  }
  return next;
}

/** Verdadeiro se alguma pergunta visível com gatilho de prioridade recebeu a resposta de gatilho. */
export function computePriorityAlert(answers: RawAnswers): boolean {
  return allQuestions.some((question) => question.priorityTriggerValue !== undefined && isQuestionVisible(question, answers) && answers[question.id] === question.priorityTriggerValue);
}

export function answerLabel(question: QuestionnaireQuestion, value: unknown): string {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (Array.isArray(value)) {
    if (value.length === 0) return "Não informado";
    return value.map((item) => question.options?.find((option) => option.value === String(item))?.label ?? String(item)).join(", ");
  }
  if (question.type === "height" && typeof value === "number") return `${value.toFixed(2).replace(".", ",")} m`;
  if (question.type === "number" && typeof value === "number") {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
    return question.unit ? `${formatted} ${question.unit}` : formatted;
  }
  const option = question.options?.find((item) => item.value === String(value));
  if (option) return option.label;
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}