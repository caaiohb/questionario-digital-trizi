import { NextResponse } from "next/server";
import { z } from "zod";
import { getAttendedApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({ attended: z.boolean() });

/** Marca (ou desfaz) que o paciente já foi atendido. A médica, o administrador ou um funcionário podem fazer isso (caso a médica esqueça). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const profile = await getAttendedApiProfile();
    if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("questionnaire_submissions")
      .update(parsed.data.attended ? { doctor_attended_at: new Date().toISOString(), doctor_attended_by: profile.id } : { doctor_attended_at: null, doctor_attended_by: null })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 });

    await admin.from("audit_logs").insert({ user_id: profile.id, action: parsed.data.attended ? "doctor_marked_attended" : "doctor_reopened", entity_type: "questionnaire_submission", entity_id: id, metadata: { by_role: profile.perfil, by_name: profile.nome } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[doctor/attended] erro", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível atualizar. Confirme que a migration da área da médica foi executada." }, { status: 500 });
  }
}