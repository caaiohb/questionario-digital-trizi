export type AnswerPrimitive = string | number | boolean | null;
export type AnswerValue = AnswerPrimitive | { value: number; unit: "cm" | "m" };
export type RawAnswers = Record<string, AnswerValue>;

export type QuestionType =
  | "text"
  | "number"
  | "textarea"
  | "yes_no"
  | "yes_no_na"
  | "yes_no_prefer_not"
  | "radio"
  | "height";

export type SummaryMode = "always" | "when_yes" | "when_no" | "when_filled" | "never";

export interface ConditionalRule {
  questionId: string;
  equals?: AnswerPrimitive;
  in?: AnswerPrimitive[];
}

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionnaireQuestion {
  id: string;
  code: string;
  sectionId: string;
  text: string;
  type: QuestionType;
  required?: boolean;
  options?: QuestionOption[];
  helperText?: string;
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  condition?: ConditionalRule;
  sensitive?: boolean;
  priorityTriggerValue?: AnswerPrimitive;
  summaryMode?: SummaryMode;
  quickFill?: string;
  order: number;
  version: string;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  shortTitle: string;
  description?: string;
  order: number;
  questions: QuestionnaireQuestion[];
}

export interface StoredAnswer {
  questionId: string;
  code: string;
  question: string;
  answer: AnswerValue;
  sectionId: string;
  section: string;
  sensitive: boolean;
}

export type StoredAnswers = Record<string, StoredAnswer>;

export interface PublicSettings {
  institutionName: string;
  questionnaireName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  introText: string;
  finalMessage: string;
  privacyPolicy: string;
  consentText: string;
  consentVersion: string;
  emergencyMessage: string;
  emergencyContacts: Array<{ label: string; value: string }>;
  estimatedMinutes: number;
}
