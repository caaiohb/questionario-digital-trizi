import type { StoredAnswers } from "@/types/questionnaire";

export type SubmissionStatus = "draft" | "submitted" | "new" | "in_review" | "inserted_into_record" | "archived";

export interface ProfileRow {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  perfil: "administrator" | "employee";
  ativo: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface SubmissionRow {
  id: string;
  protocol: string;
  patient_name: string;
  patient_age: number;
  current_weight: number;
  desired_weight: number;
  height: number;
  answers: StoredAnswers;
  questionnaire_version: string;
  status: SubmissionStatus;
  priority_alert: boolean;
  priority_alert_at: string | null;
  possible_duplicate: boolean;
  possible_duplicate_of: string | null;
  consent_accepted: boolean;
  consent_version: string;
  consent_accepted_at: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  assigned_user_id: string | null;
  inserted_into_record_at: string | null;
  inserted_into_record_by: string | null;
  archived_at: string | null;
  pdf_path: string | null;
  answers_archived_at: string | null;
  assigned_profile?: Pick<ProfileRow, "id" | "nome"> | null;
}

export interface InternalNoteRow {
  id: string;
  submission_id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  author?: Pick<ProfileRow, "id" | "nome"> | null;
}

export type InviteStatus = "pending" | "completed" | "expired" | "cancelled";

export interface InviteRow {
  id: string;
  token: string;
  patient_name: string;
  patient_contact: string | null;
  notes: string | null;
  status: InviteStatus;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  submission_id: string | null;
  expires_at: string;
  creator?: Pick<ProfileRow, "id" | "nome"> | null;
}
