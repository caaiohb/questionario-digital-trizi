import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/utils";
import { defaultInviteMessageTemplate } from "@/config/defaultSettings";
import { InviteManagement } from "@/components/panel/invite-management";
import type { InviteRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  await requireStaff();
  const admin = createAdminClient();
  const [{ data }, { data: settingRow }] = await Promise.all([
    admin.from("questionnaire_invites").select("*,creator:profiles!questionnaire_invites_created_by_fkey(id,nome)").order("created_at", { ascending: false }).limit(200),
    admin.from("system_settings").select("setting_value").eq("setting_key", "invite_message_template").maybeSingle(),
  ]);
  const messageTemplate = typeof settingRow?.setting_value === "string" ? settingRow.setting_value : defaultInviteMessageTemplate;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Recepção</p>
      <h1 className="mt-2 text-3xl font-semibold">Convites de questionário</h1>
      <p className="mt-2 mb-7 text-slate-600">Gere um link individual para cada paciente e acompanhe quem já respondeu.</p>
      <InviteManagement invites={(data ?? []) as InviteRow[]} baseUrl={siteUrl()} messageTemplate={messageTemplate} />
    </div>
  );
}
