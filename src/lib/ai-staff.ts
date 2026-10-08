import { createClient } from "@/lib/supabase/server";

/** Retorna o id do perfil somente se o usuário logado for médica(o) ativa(o) (perfil "doctor"); senão null. O prompt da IA é exclusivo dos médicos. */
export async function getActiveStaffId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,ativo,perfil").eq("user_id", auth.user.id).maybeSingle();
  return profile?.ativo && profile.perfil === "doctor" ? (profile.id as string) : null;
}