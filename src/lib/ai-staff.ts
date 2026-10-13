import { createClient } from "@/lib/supabase/server";

/** Retorna o id do perfil somente se o usuário logado for a médica (perfil "doctor") ativa; senão null. O prompt da IA é exclusivo dela. */
export async function getActiveStaffId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,ativo,perfil").eq("user_id", auth.user.id).maybeSingle();
  return profile?.ativo && profile.perfil === "doctor" ? (profile.id as string) : null;
}

/** Quem pode editar o texto do prompt: a médica ou o administrador. Copiar o prompt continua exclusivo da médica. */
export async function getPromptEditorId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,ativo,perfil").eq("user_id", auth.user.id).maybeSingle();
  return profile?.ativo && (profile.perfil === "doctor" || profile.perfil === "administrator") ? (profile.id as string) : null;
}