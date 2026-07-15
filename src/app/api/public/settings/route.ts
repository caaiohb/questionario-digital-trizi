import { NextResponse } from "next/server";
import { defaultPublicSettings } from "@/config/defaultSettings";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const keyMap: Record<string, keyof typeof defaultPublicSettings> = {
  institution_name: "institutionName", questionnaire_name: "questionnaireName", logo_url: "logoUrl", primary_color: "primaryColor", secondary_color: "secondaryColor", intro_text: "introText", final_message: "finalMessage", privacy_policy: "privacyPolicy", consent_text: "consentText", consent_version: "consentVersion", emergency_message: "emergencyMessage", emergency_contacts: "emergencyContacts", estimated_minutes: "estimatedMinutes",
};

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("system_settings").select("setting_key,setting_value").in("setting_key", Object.keys(keyMap));
    if (error) throw error;
    const settings = { ...defaultPublicSettings } as Record<string, unknown>;
    for (const row of data ?? []) settings[keyMap[row.setting_key]] = row.setting_value;
    return NextResponse.json(settings, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json(defaultPublicSettings, { headers: { "cache-control": "no-store" } });
  }
}
