import type { Metadata } from "next";
import { QuestionnaireWizard } from "@/components/questionnaire/questionnaire-wizard";
export const metadata: Metadata = { title: "Questionário", description: "Preencha com segurança o questionário do Instituto Trizi." };
export default async function QuestionnairePage({ searchParams }: { searchParams: Promise<{ etapa?: string }> }) { const params = await searchParams; const stage = Number(params.etapa ?? 0); return <QuestionnaireWizard initialStage={Number.isFinite(stage) ? stage : 0} />; }
