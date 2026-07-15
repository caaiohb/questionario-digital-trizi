import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";

const schema = z.object({ assignedUserId: z.string().uuid().nullable() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const profile = await getApiProfile();
    if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Responsável inválido" }, { status: 400 });

    const { id } = await params;
    const admin = createAdminClient();
    if (parsed.data.assignedUserId) {
      const { data: target } = await admin.from("profiles").select("id,ativo").eq("id", parsed.data.assignedUserId).maybeSingle();
      if (!target?.ativo) return NextResponse.json({ error: "Funcionário indisponível" }, { status: 400 });
    }
    const { error } = await admin
      .from("questionnaire_submissions")
      .update({ assigned_user_id: parsed.data.assignedUserId })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) throw error;
    await admin.from("audit_logs").insert({
      user_id: profile.id,
      action: "assign_submission",
      entity_type: "questionnaire_submission",
      entity_id: id,
      metadata: { assigned_user_id: parsed.data.assignedUserId },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível atribuir o questionário." }, { status: 500 });
  }
}
