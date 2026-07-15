import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils";
export async function GET(request: Request) { const url = new URL(request.url); const code = url.searchParams.get("code"); const next = url.searchParams.get("next") || "/painel"; if (code) { const supabase = await createClient(); const { error } = await supabase.auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(`${siteUrl()}${next.startsWith("/") ? next : "/painel"}`); } return NextResponse.redirect(`${siteUrl()}/login?erro=link-invalido`); }
