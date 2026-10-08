import { getCurrentProfile } from "@/lib/auth";
import type { CurrentProfile, StaffProfile } from "@/lib/auth";

/** Perfil para as rotas do painel. A médica (perfil "doctor") não tem acesso a elas. */
export async function getApiProfile(): Promise<StaffProfile | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.perfil === "doctor") return null;
  return profile as StaffProfile;
}

/** Perfil para as rotas da área da médica (médica ou administrador). */
export async function getDoctorApiProfile(): Promise<CurrentProfile | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.perfil === "employee") return null;
  return profile;
}