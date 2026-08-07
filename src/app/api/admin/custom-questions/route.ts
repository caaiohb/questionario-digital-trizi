import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiProfile } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/utils";
import { questionnaireSections } from "@/config/questionnaireConfig";

const sectionIds = questionnaireSections.map((section) => section.id) as [string, ...string[]];

const schema = z.object({
  sectionId: z.enum(sectionIds),
  gender: z.enum(["todos", "feminino", "masculino"]),
  text: z.string().trim().min(3).max(500),
  type: z.enum(["yes_no", "text", "textarea"]),
  required: z.boolean(),
  sensitive: z.boolean(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await getApiProfile();
    if (!actor || actor.perfil !== "administrator") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Revise os dados da pergunta." }, { status: 400 });

    const admin = createAdminClient();
    const { count } = await admin.from("custom_questions").select("id", { count: "exact", head: true }).eq("section_id", parsed.data.sectionId);

    const { data, error } = await admin
      .from("custom_questions")
      .insert({
        section_id: parsed.data.sectionId,
        gender: parsed.data.gender,
        text: parsed.data.text,
        type: parsed.data.type,
        required: parsed.data.required,
        sensitive: parsed.data.sensitive,
        sort_order: count ?? 0,
        created_by: actor.id,
      })
      .select("id")
      .single();
    if (error || !data) throw error;

    await admin.from("audit_logs").insert({ user_id: actor.id, action: "create_custom_question", entity_type: "custom_question", entity_id: data.id, metadata: { section_id: parsed.data.sectionId, gender: parsed.data.gender } });
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar a pergunta." }, { status: 500 });
  }
}
