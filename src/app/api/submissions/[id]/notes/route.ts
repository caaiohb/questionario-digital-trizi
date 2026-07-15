import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

const schema = z.object({ note: z.string().trim().min(1).max(5000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const profile = await getApiProfile();
    if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Observação inválida" }, { status: 400 });

    const { id } = await params;
    const admin = createAdminClient();
    const { data: submission } = await admin
      .from("questionnaire_submissions")
      .select("id")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!submission) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });

    const { error } = await admin.from("internal_notes").insert({ submission_id: id, user_id: profile.id, note: parsed.data.note });
    if (error) throw error;
    await admin.from("audit_logs").insert({
      user_id: profile.id,
      action: "add_internal_note",
      entity_type: "questionnaire_submission",
      entity_id: id,
      metadata: {},
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar a observação." }, { status: 500 });
  }
}
