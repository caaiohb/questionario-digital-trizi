import { createClient } from "@/lib/supabase/server";

/** Retorna o id do perfil se o usuário logado for funcionário ativo; senão null. */
export async function getActiveStaffId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,ativo").eq("user_id", auth.user.id).maybeSingle();
  return profile?.ativo ? (profile.id as string) : null;
}