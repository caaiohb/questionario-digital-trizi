import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

const createSchema = z.object({
  patientName: z.string().trim().min(2).max(180),
  patientContact: z.string().trim().max(180).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Revise o nome do paciente." }, { status: 400 });

    const admin = createAdminClient();
    const token = crypto.randomUUID().replace(/-/g, "");

    const { data, error } = await admin
      .from("questionnaire_invites")
      .insert({
        token,
        patient_name: parsed.data.patientName,
        patient_contact: parsed.data.patientContact || null,
        notes: parsed.data.notes || null,
        created_by: actor.id,
      })
      .select("id,token")
      .single();

    if (error || !data) throw error;
    await admin.from("audit_logs").insert({ user_id: actor.id, action: "create_invite", entity_type: "questionnaire_invite", entity_id: data.id, metadata: {} });
    return NextResponse.json({ id: data.id, token: data.token }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível gerar o convite." }, { status: 500 });
  }
}
