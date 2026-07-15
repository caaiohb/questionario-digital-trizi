import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { defaultPublicSettings } from "@/config/defaultSettings";
import { SettingsForm, type AdminSettings } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  await requireAdmin(); const admin = createAdminClient(); const { data } = await admin.from("system_settings").select("setting_key,setting_value"); const map = Object.fromEntries((data ?? []).map((row) => [row.setting_key, row.setting_value]));
  const initial: AdminSettings = {
    institution_name: String(map.institution_name ?? defaultPublicSettings.institutionName), questionnaire_name: String(map.questionnaire_name ?? defaultPublicSettings.questionnaireName), logo_url: typeof map.logo_url === "string" ? map.logo_url : "", primary_color: String(map.primary_color ?? defaultPublicSettings.primaryColor), secondary_color: String(map.secondary_color ?? defaultPublicSettings.secondaryColor), intro_text: String(map.intro_text ?? defaultPublicSettings.introText), final_message: String(map.final_message ?? defaultPublicSettings.finalMessage), privacy_policy: String(map.privacy_policy ?? defaultPublicSettings.privacyPolicy), consent_text: String(map.consent_text ?? defaultPublicSettings.consentText), consent_version: String(map.consent_version ?? defaultPublicSettings.consentVersion), emergency_message: String(map.emergency_message ?? defaultPublicSettings.emergencyMessage), emergency_contacts: Array.isArray(map.emergency_contacts) ? map.emergency_contacts as Array<{label:string;value:string}> : defaultPublicSettings.emergencyContacts, estimated_minutes: Number(map.estimated_minutes ?? defaultPublicSettings.estimatedMinutes), notification_emails: Array.isArray(map.notification_emails) ? map.notification_emails as string[] : [], session_timeout_minutes: Number(map.session_timeout_minutes ?? 30),
  };
  return <div><p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Administração</p><h1 className="mt-2 text-3xl font-semibold">Configurações</h1><p className="mt-2 mb-7 text-slate-600">Personalize a identidade, os textos públicos e os contatos de segurança do Instituto Trizi.</p><SettingsForm initial={initial} /></div>;
}
