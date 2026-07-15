import type { QuestionnaireQuestion, QuestionnaireSection, RawAnswers } from "@/types/questionnaire";

export const QUESTIONNAIRE_VERSION = "2026.07.1";

const yesNo = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
];

const yesNoNa = [
  ...yesNo,
  { value: "nao_aplica", label: "Menopausa ou não se aplica" },
];

const yesNoPreferNot = [
  ...yesNo,
  { value: "prefiro_nao_responder", label: "Prefiro não responder" },
];

const q = (
  sectionId: string,
  order: number,
  data: Omit<QuestionnaireQuestion, "sectionId" | "order" | "version">,
): QuestionnaireQuestion => ({ ...data, sectionId, order, version: QUESTIONNAIRE_VERSION });

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
    ],
  },
  {
    id: "emotional_health",
    title: "Saúde emocional",
    shortTitle: "Saúde emocional",
    order: 2,
    questions: [
      q("emotional_health", 1, { id: "emotional_relationships", code: "emotional_relationships", text: "Tem dificuldade de ter relacionamentos duradouros?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 2, { id: "emotional_carries_people", code: "emotional_carries_people", text: "Tem a impressão de que carrega algumas pessoas nas costas?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 3, { id: "emotional_perfectionist", code: "emotional_perfectionist", text: "É perfeccionista ou exigente demais?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 4, { id: "emotional_sadness", code: "emotional_sadness", text: "Tem se sentido triste sem motivo?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 5, { id: "emotional_death_thoughts", code: "mental_health_death_thoughts", text: "Pensou, por mais de uma vez, que seria melhor se estivesse morta?", type: "yes_no", options: yesNo, required: true, priorityTriggerValue: "sim", summaryMode: "when_yes", sensitive: true, helperText: "Sua resposta é confidencial. Caso exista risco atual, procure ajuda imediata." }),
      q("emotional_health", 6, { id: "emotional_anguish", code: "emotional_anguish", text: "Tem sentido um aperto no peito, tipo angústia?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 7, { id: "emotional_anxiety", code: "mental_health_anxiety", text: "Tem se sentido ansiosa?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 8, { id: "emotional_uncontrollable_worry", code: "emotional_uncontrollable_worry", text: "Tem se preocupado com situações que estão fora do seu alcance?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 9, { id: "emotional_panic", code: "emotional_panic", text: "Sentiu alguma vez como se estivesse em pânico, com medo e sem ação?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 10, { id: "emotional_exhaustion", code: "emotional_exhaustion", text: "Tem se sentido exausta e sem energia?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("emotional_health", 11, { id: "emotional_stress", code: "emotional_stress", text: "Tem se sentido muito nervosa ou estressada?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
    ],
  },
  {
    id: "attention_memory",
    title: "Atenção, memória e concentração",
    shortTitle: "Atenção e memória",
    order: 3,
    questions: [
      q("attention_memory", 1, { id: "attention_forgets_task", code: "attention_forgets_task", text: "Tem acontecido de ir fazer alguma coisa e, depois de alguns minutos, esquecer o que era?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("attention_memory", 2, { id: "attention_forgets_names", code: "attention_forgets_names", text: "Tem esquecido o nome de pessoas conhecidas ou palavras de uso habitual?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("attention_memory", 3, { id: "attention_errors", code: "attention_errors", text: "Tem cometido erros por falta de atenção quando precisa trabalhar em um projeto chato ou difícil?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("attention_memory", 4, { id: "attention_listening", code: "attention_listening", text: "Tem dificuldade de se concentrar no que as pessoas dizem, mesmo quando estão falando diretamente com você?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("attention_memory", 5, { id: "attention_organization", code: "attention_organization", text: "Tem dificuldade de manter as coisas no lugar em casa ou no trabalho?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("attention_memory", 6, { id: "attention_procrastination", code: "attention_procrastination", text: "Frequentemente começa algo e não termina ou posterga para terminar?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
    ],
  },
  {
    id: "mobility_activity",
    title: "Mobilidade e atividade física",
    shortTitle: "Mobilidade",
    order: 4,
    questions: [
      q("mobility_activity", 1, { id: "mobility_pain", code: "mobility_pain", text: "Tem sentido dificuldade para subir escadas, correr ou carregar pesos do dia a dia por causa de dor?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("mobility_activity", 2, { id: "mobility_limitation", code: "mobility_limitation", text: "Tem alguma limitação ou deformidade nos membros que limite sua locomoção ou a prática de atividades físicas?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("mobility_activity", 3, { id: "activity_profile", code: "activity_profile", text: "Escolha a opção que melhor representa seu perfil de atividade", type: "radio", required: true, summaryMode: "always", options: [
        { value: "sedentary", label: "Não pratica atividades físicas ou faz caminhadas esporádicas." },
        { value: "light_2_3", label: "Pratica atividades leves, como pilates, dança, caminhada ou hidroginástica, de duas a três vezes por semana." },
        { value: "light_over_3", label: "Pratica atividades leves, como pilates, dança, caminhada ou hidroginástica, mais de três vezes por semana." },
        { value: "vigorous_up_to_2", label: "Pratica atividades mais vigorosas, como musculação, natação, corrida, funcional ou spinning, até duas vezes por semana." },
        { value: "vigorous_3_4", label: "Pratica atividades mais vigorosas, como musculação, natação, corrida, funcional ou spinning, de três a quatro vezes por semana." },
        { value: "vigorous_5_7", label: "Pratica atividades mais vigorosas, como musculação, natação, corrida, funcional ou spinning, de cinco a sete vezes por semana." },
      ] }),
    ],
  },
  {
    id: "habits_metabolic",
    title: "Hábitos e histórico metabólico",
    shortTitle: "Hábitos",
    order: 5,
    questions: [
      q("habits_metabolic", 1, { id: "habits_smoking", code: "habits_smoking", text: "Tem fumado mais de três cigarros por semana?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("habits_metabolic", 2, { id: "habits_alcohol", code: "habits_alcohol", text: "Tem ingerido mais de três doses de bebida alcoólica por semana?", type: "yes_no", options: yesNo, required: true, helperText: "Uma dose corresponde aproximadamente a uma taça de vinho, um copo de chope ou uma dose de destilado.", summaryMode: "when_yes" }),
      q("habits_metabolic", 3, { id: "metabolic_prediabetes", code: "metabolic_prediabetes", text: "Tem pré-diabetes?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("habits_metabolic", 4, { id: "metabolic_diabetes", code: "metabolic_diabetes", text: "Tem diagnóstico de diabetes?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("habits_metabolic", 5, { id: "cardiac_disease", code: "cardiac_disease", text: "Tem alguma doença cardíaca?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("habits_metabolic", 6, { id: "cardiac_disease_name", code: "cardiac_disease_name", text: "Qual doença cardíaca?", type: "text", required: true, condition: { questionId: "cardiac_disease", equals: "sim" }, summaryMode: "when_filled" }),
    ],
  },
  {
    id: "cardiovascular",
    title: "Histórico cardiovascular e vascular",
    shortTitle: "Cardiovascular",
    order: 6,
    questions: [
      q("cardiovascular", 1, { id: "vascular_thrombosis", code: "vascular_thrombosis", text: "Tem histórico de trombose?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("cardiovascular", 2, { id: "vascular_lipedema", code: "vascular_lipedema", text: "Possui lipedema?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("cardiovascular", 3, { id: "vascular_thrombophilia", code: "vascular_thrombophilia", text: "Tem diagnóstico de trombofilia?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("cardiovascular", 4, { id: "autoimmune_active_lupus", code: "autoimmune_active_lupus", text: "Tem lúpus ativo?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("cardiovascular", 5, { id: "coronary_disease", code: "coronary_disease", text: "Tem doença coronariana, como infarto ou angina?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("cardiovascular", 6, { id: "carotid_stroke", code: "carotid_stroke", text: "Tem placa na carótida ou já teve derrame ou AVC?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("cardiovascular", 7, { id: "antihypertensive_use", code: "antihypertensive_use", text: "Faz uso de medicamentos anti-hipertensivos?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
    ],
  },
  {
    id: "menstrual_menopause",
    title: "Ciclo menstrual e menopausa",
    shortTitle: "Ciclo menstrual",
    order: 7,
    questions: [
      q("menstrual_menopause", 1, { id: "menstrual_status", code: "menstrual_status", text: "Como está sua menstruação?", type: "radio", required: true, summaryMode: "always", options: [
        { value: "regular", label: "Ciclos regulares." },
        { value: "irregular_under_2_months", label: "Ciclos irregulares, mas não fico mais de dois meses sem menstruar." },
        { value: "failing_last_year", label: "No último ano, a menstruação vem falhando em alguns meses." },
        { value: "over_1_year_with_hormones", label: "Não menstruo há mais de um ano, mas utilizo terapia de reposição hormonal." },
        { value: "over_1_under_10_never_hormones", label: "Não menstruo há mais de um ano e há menos de dez anos e nunca fiz reposição hormonal." },
        { value: "over_10_stopped_over_3", label: "Não menstruo há mais de dez anos, já usei hormônios, mas parei há mais de três anos." },
        { value: "over_10_stopped_under_3", label: "Não menstruo há mais de dez anos, já usei hormônios e parei há menos de três anos." },
        { value: "over_10_never_hormones", label: "Não menstruo há mais de dez anos e nunca fiz reposição hormonal." },
        { value: "menopause_over_60_never_hormones", label: "Já estou na menopausa, tenho mais de 60 anos e nunca fiz reposição hormonal." },
      ] }),
      q("menstrual_menopause", 2, { id: "menopause_hot_flashes", code: "menopause_hot_flashes", text: "Tem sentido episódios de ondas de calor ou suor excessivo?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("menstrual_menopause", 3, { id: "bone_osteopenia", code: "bone_osteopenia", text: "Tem diagnóstico de osteopenia ou osteoporose?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("menstrual_menopause", 4, { id: "urinary_symptoms", code: "urinary_symptoms", text: "Tem apresentado dificuldade para urinar, aumento da necessidade de urinar, dificuldade de segurar a urina ou infecção urinária?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("menstrual_menopause", 5, { id: "vaginal_dryness", code: "vaginal_dryness", text: "Tem observado ressecamento vaginal?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
    ],
  },
  {
    id: "gynecological_hormonal",
    title: "Saúde ginecológica e hormonal",
    shortTitle: "Saúde ginecológica",
    order: 8,
    questions: [
      q("gynecological_hormonal", 1, { id: "hormonal_contraceptive", code: "hormonal_contraceptive", text: "Usa método contraceptivo que contenha hormônios?", type: "yes_no_na", options: yesNoNa, required: true, summaryMode: "when_yes" }),
      q("gynecological_hormonal", 2, { id: "menstrual_severe_cramps", code: "menstrual_severe_cramps", text: "Tem cólicas severas ou grande fluxo de sangue durante a menstruação?", type: "yes_no_na", options: yesNoNa, required: true, summaryMode: "when_yes" }),
      q("gynecological_hormonal", 3, { id: "uterine_conditions", code: "uterine_conditions", text: "Tem miomas uterinos, endometriose ou adenomiose?", type: "yes_no_na", options: yesNoNa, required: true, summaryMode: "when_yes" }),
      q("gynecological_hormonal", 4, { id: "breast_fibrocystic", code: "breast_fibrocystic", text: "Tem doença fibrocística da mama, nódulos ou mamas que frequentemente incham e doem?", type: "yes_no_na", options: yesNoNa, required: true, summaryMode: "when_yes" }),
      q("gynecological_hormonal", 5, { id: "infertility_abortions", code: "infertility_abortions", text: "Já teve problemas de infertilidade ou mais de um aborto?", type: "yes_no_na", options: yesNoNa, required: true, summaryMode: "when_yes", sensitive: true }),
      q("gynecological_hormonal", 6, { id: "premenstrual_migraines", code: "premenstrual_migraines", text: "Tem enxaquecas principalmente no período pré-menstrual?", type: "yes_no_na", options: yesNoNa, required: true, summaryMode: "when_yes" }),
      q("gynecological_hormonal", 7, { id: "premenstrual_swelling", code: "premenstrual_swelling", text: "Sente-se muito inchada ou retida, principalmente no período pré-menstrual?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("gynecological_hormonal", 8, { id: "acne_hair", code: "acne_hair", text: "Tem tendência a acne e excesso de pelos?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
    ],
  },
  {
    id: "sexual_health",
    title: "Saúde sexual",
    shortTitle: "Saúde sexual",
    description: "Estas respostas possuem tratamento de sigilo reforçado.",
    order: 9,
    questions: [
      q("sexual_health", 1, { id: "sexual_libido", code: "sexual_libido", text: "Gostaria que sua libido fosse melhor?", type: "yes_no_prefer_not", options: yesNoPreferNot, required: true, summaryMode: "when_yes", sensitive: true }),
      q("sexual_health", 2, { id: "sexual_lubrication", code: "sexual_lubrication", text: "Tem ficado lubrificada durante a relação sexual?", type: "yes_no_prefer_not", options: yesNoPreferNot, required: true, summaryMode: "when_no", sensitive: true }),
      q("sexual_health", 3, { id: "sexual_painless", code: "sexual_painless", text: "Consegue fazer sexo vaginal sem dor ou incômodo?", type: "yes_no_prefer_not", options: yesNoPreferNot, required: true, summaryMode: "when_no", sensitive: true }),
      q("sexual_health", 4, { id: "sexual_stimuli", code: "sexual_stimuli", text: "Estímulos sexuais, como beijos, abraços, palavras sensuais ou histórias eróticas, despertam vontade de fazer sexo?", type: "yes_no_prefer_not", options: yesNoPreferNot, required: true, summaryMode: "when_no", sensitive: true }),
      q("sexual_health", 5, { id: "sexual_orgasm", code: "sexual_orgasm", text: "Tem conseguido atingir o orgasmo sozinha ou na maior parte das relações sexuais?", type: "yes_no_prefer_not", options: yesNoPreferNot, required: true, summaryMode: "when_no", sensitive: true }),
    ],
  },
  {
    id: "breast_oncology",
    title: "Saúde das mamas e histórico oncológico",
    shortTitle: "Mamas e oncologia",
    order: 10,
    questions: [
      q("breast_oncology", 1, { id: "breast_exam_normal", code: "breast_exam_normal", text: "Tem realizado o autoexame das mamas regularmente, feito avaliação médica e está tudo normal?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_no" }),
      q("breast_oncology", 2, { id: "gynecological_exam_normal", code: "gynecological_exam_normal", text: "Fez avaliação ginecológica no último ano e está tudo normal?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_no" }),
      q("breast_oncology", 3, { id: "breast_cancer_diagnosis", code: "breast_cancer_diagnosis", text: "Recebeu diagnóstico de câncer de mama nos últimos anos?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
      q("breast_oncology", 4, { id: "breast_cancer_treatment", code: "breast_cancer_treatment", text: "Está em tratamento ou acompanhamento para câncer de mama?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
      q("breast_oncology", 5, { id: "gynecological_cancer_discharge", code: "gynecological_cancer_discharge", text: "Recebeu diagnóstico de câncer ginecológico nos últimos anos e já recebeu alta?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
      q("breast_oncology", 6, { id: "gynecological_cancer_treatment", code: "gynecological_cancer_treatment", text: "Está em tratamento ou acompanhamento para câncer ginecológico?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
      q("breast_oncology", 7, { id: "mother_breast_cancer_under_45", code: "mother_breast_cancer_under_45", text: "Sua mãe teve câncer de mama antes dos 45 anos de idade?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("breast_oncology", 8, { id: "unknown_vaginal_bleeding", code: "unknown_vaginal_bleeding", text: "Apresenta sangramento vaginal de causa desconhecida?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
      q("breast_oncology", 9, { id: "hysterectomy", code: "hysterectomy", text: "Já fez cirurgia para retirar o útero?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
    ],
  },
  {
    id: "eating_weight",
    title: "Comportamento alimentar e peso",
    shortTitle: "Alimentação e peso",
    order: 11,
    questions: [
      q("eating_weight", 1, { id: "eating_for_pleasure", code: "eating_for_pleasure", text: "Costuma comer apenas por prazer ou para relaxar, mesmo sem sentir fome?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("eating_weight", 2, { id: "eating_more_than_should", code: "eating_more_than_should", text: "Tem observado que come mais do que deveria?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("eating_weight", 3, { id: "weight_cycling", code: "weight_cycling", text: "Já tentou emagrecer algumas vezes e sempre recuperou o peso?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("eating_weight", 4, { id: "weight_gain_4kg", code: "weight_gain_4kg", text: "Ganhou mais de quatro quilos nos últimos dois anos?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("eating_weight", 5, { id: "eating_bulimia", code: "eating_bulimia", text: "Tem bulimia?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
      q("eating_weight", 6, { id: "eating_anorexia", code: "eating_anorexia", text: "Tem anorexia nervosa?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
      q("eating_weight", 7, { id: "hypothyroidism_medication", code: "hypothyroidism_medication", text: "Usa medicamento para hipotireoidismo?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("eating_weight", 8, { id: "hypothyroidism_medication_name", code: "hypothyroidism_medication_name", text: "Nome do medicamento para hipotireoidismo", type: "text", required: true, condition: { questionId: "hypothyroidism_medication", equals: "sim" }, summaryMode: "when_filled" }),
      q("eating_weight", 9, { id: "hypothyroidism_medication_dose", code: "hypothyroidism_medication_dose", text: "Dosagem", type: "text", required: true, condition: { questionId: "hypothyroidism_medication", equals: "sim" }, summaryMode: "when_filled" }),
      q("eating_weight", 10, { id: "hypothyroidism_medication_frequency", code: "hypothyroidism_medication_frequency", text: "Frequência de uso", type: "text", required: true, condition: { questionId: "hypothyroidism_medication", equals: "sim" }, summaryMode: "when_filled" }),
    ],
  },
  {
    id: "weight_loss_sleep_medications",
    title: "Medicamentos para emagrecimento e sono",
    shortTitle: "Medicamentos e sono",
    order: 12,
    questions: [
      q("weight_loss_sleep_medications", 1, { id: "weight_loss_medications_used", code: "weight_loss_medications_used", text: "Já usou medicamentos para emagrecer?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("weight_loss_sleep_medications", 2, { id: "weight_loss_medication_adverse", code: "weight_loss_medication_adverse", text: "Passou mal com algum medicamento para emagrecer?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("weight_loss_sleep_medications", 3, { id: "weight_loss_adverse_medication", code: "weight_loss_adverse_medication", text: "Qual medicamento?", type: "text", required: true, condition: { questionId: "weight_loss_medication_adverse", equals: "sim" }, summaryMode: "when_filled" }),
      q("weight_loss_sleep_medications", 4, { id: "weight_loss_adverse_symptoms", code: "weight_loss_adverse_symptoms", text: "O que sentiu?", type: "textarea", required: true, condition: { questionId: "weight_loss_medication_adverse", equals: "sim" }, summaryMode: "when_filled" }),
      q("weight_loss_sleep_medications", 5, { id: "stimulant_experience", code: "stimulant_experience", text: "Sobre Venvanse, Concerta ou Ritalina", type: "radio", required: true, summaryMode: "always", options: [
        { value: "never", label: "Nunca utilizei." },
        { value: "used_no_adverse", label: "Utilizei e não me senti mal." },
        { value: "used_adverse", label: "Utilizei e me senti mal." },
      ] }),
      q("weight_loss_sleep_medications", 6, { id: "stimulant_adverse_description", code: "stimulant_adverse_description", text: "Descreva o que ocorreu", type: "textarea", required: true, condition: { questionId: "stimulant_experience", equals: "used_adverse" }, summaryMode: "when_filled" }),
      q("weight_loss_sleep_medications", 7, { id: "sleep_seven_hours", code: "sleep_seven_hours", text: "Consegue dormir sete horas por noite sem acordar por qualquer motivo?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_no" }),
      q("weight_loss_sleep_medications", 8, { id: "sleep_not_rested", code: "sleep_not_rested", text: "Ao acordar, sente que não descansou o suficiente?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
    ],
  },
  {
    id: "gastrointestinal",
    title: "Saúde gastrointestinal",
    shortTitle: "Gastrointestinal",
    order: 13,
    questions: [
      q("gastrointestinal", 1, { id: "gi_reflux", code: "gi_reflux", text: "Costuma sentir azia ou refluxo?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("gastrointestinal", 2, { id: "gi_medication", code: "gi_medication", text: "Às vezes precisa usar medicamento para dor no estômago ou má digestão?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("gastrointestinal", 3, { id: "gi_gas_bloating", code: "gi_gas_bloating", text: "Sente gases ou sensação de barriga inchada pelo menos uma vez por semana?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("gastrointestinal", 4, { id: "gi_constipation", code: "gi_constipation", text: "Tem dificuldade para evacuar ou fica mais de dois dias sem evacuar?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("gastrointestinal", 5, { id: "gi_frequent_bowel", code: "gi_frequent_bowel", text: "Costuma evacuar mais de duas vezes ao dia?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
    ],
  },
  {
    id: "allergies_neurological",
    title: "Alergias, imunidade e histórico neurológico",
    shortTitle: "Alergias e imunidade",
    order: 14,
    questions: [
      q("allergies_neurological", 1, { id: "food_allergy", code: "food_allergy", text: "Tem algum tipo de alergia ou intolerância alimentar?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("allergies_neurological", 2, { id: "food_allergy_name", code: "food_allergy_name", text: "Qual alergia ou intolerância?", type: "text", required: true, condition: { questionId: "food_allergy", equals: "sim" }, summaryMode: "when_filled" }),
      q("allergies_neurological", 3, { id: "autoimmune_disease", code: "autoimmune_disease", text: "Tem diagnóstico de alguma doença autoimune?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("allergies_neurological", 4, { id: "autoimmune_disease_name", code: "autoimmune_disease_name", text: "Qual doença autoimune?", type: "text", required: true, condition: { questionId: "autoimmune_disease", equals: "sim" }, summaryMode: "when_filled" }),
      q("allergies_neurological", 5, { id: "respiratory_infections", code: "respiratory_infections", text: "Tem crises de infecção respiratória mais de uma vez ao ano?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("allergies_neurological", 6, { id: "skin_mucosa_problems", code: "skin_mucosa_problems", text: "Tem algum problema de pele ou na mucosa da boca ou vagina mais de uma vez ao ano?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes", sensitive: true }),
      q("allergies_neurological", 7, { id: "seizure_history", code: "seizure_history", text: "Tem histórico de crises convulsivas?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("allergies_neurological", 8, { id: "parkinson_medications", code: "parkinson_medications", text: "Usa medicamentos para Parkinson?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("allergies_neurological", 9, { id: "parkinson_medication_names", code: "parkinson_medication_names", text: "Quais medicamentos?", type: "textarea", required: true, condition: { questionId: "parkinson_medications", equals: "sim" }, summaryMode: "when_filled" }),
    ],
  },
  {
    id: "medications_other_conditions",
    title: "Medicamentos e outras doenças",
    shortTitle: "Medicamentos",
    order: 15,
    questions: [
      q("medications_other_conditions", 1, { id: "antidepressant_use", code: "antidepressant_use", text: "Usa medicamentos antidepressivos?", type: "yes_no", options: yesNo, required: true, summaryMode: "when_yes" }),
      q("medications_other_conditions", 2, { id: "antidepressant_names", code: "antidepressant_names", text: "Nome dos medicamentos antidepressivos", type: "textarea", required: true, condition: { questionId: "antidepressant_use", equals: "sim" }, summaryMode: "when_filled" }),
      q("medications_other_conditions", 3, { id: "antidepressant_dose", code: "antidepressant_dose", text: "Dosagem, caso saiba", type: "text", required: false, condition: { questionId: "antidepressant_use", equals: "sim" }, summaryMode: "when_filled" }),
      q("medications_other_conditions", 4, { id: "antidepressant_frequency", code: "antidepressant_frequency", text: "Frequência de uso", type: "text", required: true, condition: { questionId: "antidepressant_use", equals: "sim" }, summaryMode: "when_filled" }),
      q("medications_other_conditions", 5, { id: "current_medications", code: "current_medications", text: "Liste todos os medicamentos que utiliza atualmente", type: "textarea", required: true, quickFill: "Não utilizo nenhum medicamento", helperText: "Inclua nome, dosagem e frequência, quando souber.", summaryMode: "always" }),
      q("medications_other_conditions", 6, { id: "other_conditions", code: "other_conditions", text: "Possui alguma doença ou condição que não tenha sido mencionada anteriormente?", type: "textarea", required: true, quickFill: "Não possuo outra condição", summaryMode: "always" }),
    ],
  },
];

export const allQuestions = questionnaireSections.flatMap((section) => section.questions);
export const questionsById = new Map(allQuestions.map((question) => [question.id, question]));
export const sectionsById = new Map(questionnaireSections.map((section) => [section.id, section]));

export const menopauseStatuses = new Set([
  "over_1_year_with_hormones",
  "over_1_under_10_never_hormones",
  "over_10_stopped_over_3",
  "over_10_stopped_under_3",
  "over_10_never_hormones",
  "menopause_over_60_never_hormones",
]);

export const menopauseAutoAnswerQuestionIds = [
  "hormonal_contraceptive",
  "menstrual_severe_cramps",
  "uterine_conditions",
  "breast_fibrocystic",
  "infertility_abortions",
  "premenstrual_migraines",
];

export function isQuestionVisible(question: QuestionnaireQuestion, answers: RawAnswers): boolean {
  if (!question.condition) return true;
  const value = answers[question.condition.questionId] ?? null;
  if (question.condition.equals !== undefined) return value === question.condition.equals;
  if (question.condition.in) return question.condition.in.includes(value as never);
  return true;
}

export function normalizeMenopauseAnswers(answers: RawAnswers): RawAnswers {
  const next = { ...answers };
  const status = next.menstrual_status;
  if (typeof status === "string" && menopauseStatuses.has(status)) {
    for (const id of menopauseAutoAnswerQuestionIds) {
      // Preenche automaticamente apenas quando a paciente ainda não respondeu.
      // Respostas revisadas manualmente devem ser preservadas.
      if (next[id] === undefined || next[id] === null || next[id] === "") next[id] = "nao_aplica";
    }
  }
  return next;
}

export function answerLabel(question: QuestionnaireQuestion, value: unknown): string {
  if (value === null || value === undefined || value === "") return "Não informado";
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
