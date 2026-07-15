import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserManagement } from "@/components/admin/user-management";
import type { ProfileRow } from "@/types/database";
export default async function UsersPage() { await requireAdmin(); const admin = createAdminClient(); const { data } = await admin.from("profiles").select("*").order("nome"); return <div><p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Administração</p><h1 className="mt-2 text-3xl font-semibold">Funcionários</h1><p className="mt-2 mb-7 text-slate-600">Cadastre, convide, desative e recupere acessos individuais.</p><UserManagement users={(data ?? []) as ProfileRow[]} /></div>; }
