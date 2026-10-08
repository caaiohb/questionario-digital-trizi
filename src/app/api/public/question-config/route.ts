import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadQuestionOverrides } from "@/lib/question-overrides-server";
import type { PublicCustomQuestion } from "@/lib/custom-questions";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "cache-control": "no-store" };
  try {
    const admin = createAdminClient();
    const [{ data, error }, overrides] = await Promise.all([
      admin.from("custom_questions").select("id,section_id,gender,text,type,required,sensitive,sort_order").eq("active", true).order("sort_order"),
      loadQuestionOverrides(admin),
    ]);
    if (error) throw error;
    const custom: PublicCustomQuestion[] = (data ?? []).map((row) => ({
      id: row.id,
      sectionId: row.section_id,
      gender: row.gender,
      text: row.text,
      type: row.type,
      required: row.required,
      sensitive: row.sensitive,
      sortOrder: row.sort_order,
    }));
    return NextResponse.json({ custom, overrides }, { headers });
  } catch {
    return NextResponse.json({ custom: [], overrides: {} }, { headers });
  }
}