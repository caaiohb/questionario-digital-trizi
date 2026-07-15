import { NextResponse } from "next/server";
import { allQuestions, answerLabel } from "@/config/questionnaireConfig";
import { getApiProfile } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { csvEscape } from "@/lib/utils";
import type { StoredAnswers } from "@/types/questionnaire";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const profile = await getApiProfile(); if (!profile || profile.perfil !== "administrator") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  const url = new URL(request.url); const supabase = await createClient(); const rows: any[] = []; let offset = 0;
  while (true) {
    let query = supabase.from("questionnaire_submissions").select("id,protocol,patient_name,patient_age,current_weight,desired_weight,height,submitted_at,status,priority_alert,questionnaire_version,answers").order("submitted_at", { ascending: false }).range(offset, offset + 999);
    const status = url.searchParams.get("status"); const priority = url.searchParams.get("priority"); const assigned = url.searchParams.get("assigned"); const from = url.searchParams.get("dateFrom"); const to = url.searchParams.get("dateTo");
    if (status && status !== "all") query = query.eq("status", status); if (priority === "true") query = query.eq("priority_alert", true); if (assigned) query = assigned === "unassigned" ? query.is("assigned_user_id", null) : query.eq("assigned_user_id", assigned); if (from) query = query.gte("submitted_at", `${from}T00:00:00-03:00`); if (to) query = query.lt("submitted_at", new Date(new Date(`${to}T00:00:00-03:00`).getTime() + 86400000).toISOString());
    const { data, error } = await query; if (error) return NextResponse.json({ error: "Não foi possível exportar." }, { status: 500 }); rows.push(...(data ?? [])); if (!data || data.length < 1000 || rows.length >= 10000) break; offset += 1000;
  }
  const headers = ["Protocolo", "Paciente", "Idade", "Peso atual (kg)", "Peso desejado (kg)", "Altura (m)", "Data de envio", "Status", "Alerta prioritário", "Versão do questionário", ...allQuestions.slice(5).map((question) => question.text)];
  const lines = [headers.map(csvEscape).join(";")];
  for (const row of rows) { const answers = row.answers as StoredAnswers; const values = [row.protocol, row.patient_name, row.patient_age, row.current_weight, row.desired_weight, row.height, row.submitted_at, row.status, row.priority_alert ? "Sim" : "Não", row.questionnaire_version, ...allQuestions.slice(5).map((question) => answers?.[question.id] ? answerLabel(question, answers[question.id].answer) : "")]; lines.push(values.map(csvEscape).join(";")); }
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({ user_id: profile.id, action: "export_csv", entity_type: "questionnaire_submission", metadata: { records: rows.length, filters: Object.fromEntries(url.searchParams.entries()) } });
  const filename = `questionarios-trizi-${new Date().toISOString().slice(0,10)}.csv`; return new NextResponse(`\uFEFF${lines.join("\r\n")}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "private, no-store" } });
}
