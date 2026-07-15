import type { Metadata } from "next";
import { QuestionnaireWizard } from "@/components/questionnaire/questionnaire-wizard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InviteStatus } from "@/types/database";

export const metadata: Metadata = { title: "Questionário", description: "Preencha com segurança o questionário do Instituto Trizi." };

export interface InviteState {
  token: string;
  patientName: string;
  status: InviteStatus;
  expired: boolean;
}

async function loadInvite(token: string | undefined): Promise<InviteState | null> {
  if (!token) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("questionnaire_invites").select("token,patient_name,status,expires_at").eq("token", token).maybeSingle();
  if (!data) return null;
  const expired = data.status === "pending" && new Date(data.expires_at).getTime() < Date.now();
  return { token: data.token, patientName: data.patient_name, status: data.status as InviteStatus, expired };
}

export default async function QuestionnairePage({ searchParams }: { searchParams: Promise<{ etapa?: string; convite?: string }> }) {
  const params = await searchParams;
  const stage = Number(params.etapa ?? 0);
  const invite = await loadInvite(params.convite);
  return <QuestionnaireWizard initialStage={Number.isFinite(stage) ? stage : 0} invite={invite} />;
}
