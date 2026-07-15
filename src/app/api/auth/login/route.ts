import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, getRequestIp, hmac } from "@/lib/utils";

const schema = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(200) });
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 });
    const admin = createAdminClient();
    const key = hmac(`${getRequestIp(request.headers)}|${parsed.data.email.toLowerCase()}`, process.env.RATE_LIMIT_SECRET);
    const { data: allowed, error: rateError } = await admin.rpc("consume_rate_limit", { p_scope: "staff_login", p_key_hash: key, p_limit: 8, p_window_seconds: 900 });
    if (rateError) {
      console.error("[login] consume_rate_limit RPC error:", JSON.stringify(rateError));
      return NextResponse.json({ error: "Não foi possível entrar. Tente novamente em instantes." }, { status: 500 });
    }
    if (!allowed) return NextResponse.json({ error: "Não foi possível entrar. Aguarde alguns minutos e tente novamente." }, { status: 429 });

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email.toLowerCase(), password: parsed.data.password });
    if (error || !data.user) return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("id,ativo").eq("user_id", data.user.id).maybeSingle();
    if (!profile?.ativo) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }
    await admin.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("user_id", data.user.id);
    await admin.from("audit_logs").insert({ user_id: profile.id, action: "login", entity_type: "profile", entity_id: profile.id, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível entrar. Tente novamente." }, { status: 500 });
  }
}
