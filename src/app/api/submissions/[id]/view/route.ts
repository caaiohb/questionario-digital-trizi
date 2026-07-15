import { NextResponse } from "next/server";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const profile = await getApiProfile();
    if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const { id } = await params;
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({ user_id: profile.id, action: "view_submission", entity_type: "questionnaire_submission", entity_id: id, metadata: {} });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro" }, { status: 400 });
  }
}
