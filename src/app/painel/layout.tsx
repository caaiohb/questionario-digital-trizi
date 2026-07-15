import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PanelShell } from "@/components/panel/panel-shell";
import { IdleSession } from "@/components/panel/idle-session";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false, nocache: true } };
export default async function PanelLayout({ children }: { children: React.ReactNode }) { const profile = await requireStaff(); const supabase = await createClient(); const { data } = await supabase.from("system_settings").select("setting_value").eq("setting_key", "session_timeout_minutes").maybeSingle(); const minutes = typeof data?.setting_value === "number" ? data.setting_value : 30; return <PanelShell profile={profile}><IdleSession minutes={minutes} />{children}</PanelShell>; }
