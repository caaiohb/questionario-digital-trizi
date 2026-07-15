import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, getRequestIp, hmac, siteUrl } from "@/lib/utils";
const schema = z.object({ email: z.string().email().max(254) });
export async function POST(request: Request) { try { assertSameOrigin(request); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ ok: true }); const admin = createAdminClient(); const key = hmac(`${getRequestIp(request.headers)}|${parsed.data.email.toLowerCase()}`, process.env.RATE_LIMIT_SECRET); const { data: allowed } = await admin.rpc("consume_rate_limit", { p_scope: "password_reset", p_key_hash: key, p_limit: 3, p_window_seconds: 3600 }); if (allowed) await admin.auth.resetPasswordForEmail(parsed.data.email.toLowerCase(), { redirectTo: `${siteUrl()}/auth/callback?next=/atualizar-senha` }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ ok: true }); } }
