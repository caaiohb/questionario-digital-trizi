import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicCustomQuestion } from "@/lib/custom-questions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("custom_questions")
      .select("id,section_id,gender,text,type,required,sensitive,sort_order")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    const questions: PublicCustomQuestion[] = (data ?? []).map((row) => ({
      id: row.id,
      sectionId: row.section_id,
      gender: row.gender,
      text: row.text,
      type: row.type,
      required: row.required,
      sensitive: row.sensitive,
      sortOrder: row.sort_order,
    }));
    return NextResponse.json(questions, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json([], { headers: { "cache-control": "no-store" } });
  }
}
