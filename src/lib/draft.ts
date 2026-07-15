import type { RawAnswers } from "@/types/questionnaire";

export const DRAFT_KEY = "trizi_questionnaire_draft_v1";
export const RESULT_KEY = "trizi_questionnaire_result_v1";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export interface QuestionnaireDraft {
  clientSubmissionId: string;
  answers: RawAnswers;
  consentAccepted: boolean;
  consentAcceptedAt: string | null;
  consentVersion: string;
  updatedAt: number;
}

export function loadDraft(): QuestionnaireDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as QuestionnaireDraft;
    if (!draft.updatedAt || Date.now() - draft.updatedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    sessionStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export function saveDraft(draft: Omit<QuestionnaireDraft, "updatedAt">): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, updatedAt: Date.now() }));
}

export function clearDraft(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(DRAFT_KEY);
}
