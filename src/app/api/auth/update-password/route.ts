import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/utils";
const schema = z.object({ password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/) });
export async function POST(request: Request) { try { assertSameOrigin(request); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "A senha deve ter 12 caracteres e incluir maiúscula, minúscula, número e símbolo." }, { status: 400 }); const supabase = await createClient(); const { data: claims } = await supabase.auth.getClaims(); if (!claims?.claims?.sub) return NextResponse.json({ error: "Link expirado. Solicite uma nova recuperação." }, { status: 401 }); const { error } = await supabase.auth.updateUser({ password: parsed.data.password }); if (error) throw error; return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Não foi possível atualizar a senha." }, { status: 500 }); } }
