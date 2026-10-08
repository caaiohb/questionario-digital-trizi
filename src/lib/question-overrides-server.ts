import { createAdminClient } from "@/lib/supabase/admin";
import { rowsToOverrides } from "@/lib/question-overrides";
import type { OverrideRow, QuestionOverrides } from "@/lib/question-overrides";

/** Lê as personalizações de perguntas. Se a tabela ainda não existir, devolve vazio (tudo ativo). */
export async function loadQuestionOverrides(admin = createAdminClient()): Promise<QuestionOverrides> {
  try {
    const { data, error } = await admin.from("question_overrides").select("question_id,active,removed,sort_order");
    if (error) return {};
    return rowsToOverrides(data as OverrideRow[]);
  } catch {
    return {};
  }
}