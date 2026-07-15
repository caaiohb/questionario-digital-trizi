import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/utils";
export async function POST(request: Request) { try { assertSameOrigin(request); const supabase = await createClient(); await supabase.auth.signOut(); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ ok: false }, { status: 400 }); } }
