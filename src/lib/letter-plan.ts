import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_LETTER_PLAN, type LetterPlan } from "@/lib/letter-prompt";

export const LETTER_PLAN_KEY = "letter_plan";

/** Aceita o que veio do banco e devolve um plano completo, com texto em todos os campos. */
export function normalizeLetterPlan(raw: unknown): LetterPlan {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (key: keyof LetterPlan) => (typeof source[key] === "string" ? (source[key] as string).trim() : "");
  return {
    duracao_meses: pick("duracao_meses"),
    qtd_parcelas: pick("qtd_parcelas"),
    contato: pick("contato"),
    uf_crm: pick("uf_crm").toUpperCase(),
    equipe: pick("equipe") || DEFAULT_LETTER_PLAN.equipe,
  };
}

export async function readLetterPlan(): Promise<LetterPlan> {
  const admin = createAdminClient();
  const { data } = await admin.from("system_settings").select("setting_value").eq("setting_key", LETTER_PLAN_KEY).maybeSingle();
  return normalizeLetterPlan((data as { setting_value?: unknown } | null)?.setting_value);
}