import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "administrator" | "employee";
export interface CurrentProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  perfil: StaffRole;
  ativo: boolean;
}

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId || typeof userId !== "string") return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,user_id,nome,email,perfil,ativo")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data || !data.ativo) return null;
  return data as CurrentProfile;
});

export async function requireStaff(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await requireStaff();
  if (profile.perfil !== "administrator") redirect("/acesso-negado");
  return profile;
}
