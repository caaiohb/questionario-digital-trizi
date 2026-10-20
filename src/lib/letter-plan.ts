import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_LETTER_PLAN, parseMoney, type LetterPlan, type PlanOption } from "@/lib/letter-prompt";

export const LETTER_PLAN_KEY = "letter_plan";

function cleanOption(raw: unknown): PlanOption | null {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const text = (key: string) => (typeof source[key] === "string" ? (source[key] as string).trim() : "");
  const meses = text("meses");
  const valor = text("valor");
  const max = text("max_parcelas");
  const maxNumber = Number.parseInt(max, 10);
  if (!/^\d{1,2}$/.test(meses) || Number(meses) < 1) return null;
  if (parseMoney(valor) === null) return null;
  if (!Number.isInteger(maxNumber) || maxNumber < 1 || maxNumber > 60) return null;
  return { meses: String(Number(meses)), valor, max_parcelas: String(maxNumber) };
}

/** Aceita o que veio do banco e devolve um plano completo. Opções inválidas são descartadas e as válidas ficam em ordem de duração. */
export function normalizeLetterPlan(raw: unknown): LetterPlan {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (key: "contato" | "uf_crm" | "equipe") => (typeof source[key] === "string" ? (source[key] as string).trim() : "");
  const options = (Array.isArray(source.opcoes) ? source.opcoes : [])
    .map(cleanOption)
    .filter((option): option is PlanOption => option !== null)
    .sort((a, b) => Number(a.meses) - Number(b.meses));
  return {
    contato: pick("contato"),
    uf_crm: pick("uf_crm").toUpperCase(),
    equipe: pick("equipe") || DEFAULT_LETTER_PLAN.equipe,
    opcoes: options,
  };
}

export async function readLetterPlan(): Promise<LetterPlan> {
  const admin = createAdminClient();
  const { data } = await admin.from("system_settings").select("setting_value").eq("setting_key", LETTER_PLAN_KEY).maybeSingle();
  return normalizeLetterPlan((data as { setting_value?: unknown } | null)?.setting_value);
}