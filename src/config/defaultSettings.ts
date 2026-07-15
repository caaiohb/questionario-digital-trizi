import type { PublicSettings } from "@/types/questionnaire";

export const defaultPublicSettings: PublicSettings = {
  institutionName: "Instituto Trizi",
  questionnaireName: "Questionário Digital Trizi",
  logoUrl: null,
  primaryColor: "#24463d",
  secondaryColor: "#d7b989",
  introText: "Este questionário reúne informações importantes para apoiar sua avaliação e o acompanhamento realizado pelo Instituto Trizi. Reserve alguns minutos e responda com tranquilidade.",
  finalMessage: "Suas respostas foram encaminhadas com segurança à equipe do Instituto Trizi.",
  privacyPolicy: "O Instituto Trizi trata dados pessoais e dados de saúde exclusivamente para avaliação, atendimento, acompanhamento, registro em prontuário e cumprimento de obrigações legais. O acesso é restrito a profissionais autorizados, com medidas técnicas e administrativas de segurança. Os dados são mantidos pelo período necessário às finalidades assistenciais e legais, podendo a titular exercer seus direitos pelos canais oficiais do Instituto Trizi.",
  consentText: "Declaro que as informações fornecidas neste questionário são verdadeiras e autorizo o Instituto Trizi a armazená-las e utilizá-las exclusivamente para avaliação, atendimento, acompanhamento e registro em meu prontuário, conforme a legislação de proteção de dados vigente.",
  consentVersion: "2026.07.1",
  emergencyMessage: "Se você estiver em risco agora ou pensando em se machucar, procure imediatamente um serviço de emergência e permaneça com uma pessoa de confiança. Este questionário não substitui atendimento de urgência.",
  emergencyContacts: [
    { label: "CVV", value: "188" },
    { label: "Emergência", value: "Procure o pronto atendimento mais próximo" },
  ],
  estimatedMinutes: 15,
};
