import { NextResponse } from "next/server";
import { getActiveStaffId } from "@/lib/ai-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Registra na auditoria que a médica copiou o prompt da carta (o texto em si não é guardado). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const staff = await getActiveStaffId();
    if (!staff) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({ user_id: staff, action: "letter_prompt_copied", entity_type: "questionnaire_submission", entity_id: id, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[doctor/letter] erro", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível registrar." }, { status: 500 });
  }
}