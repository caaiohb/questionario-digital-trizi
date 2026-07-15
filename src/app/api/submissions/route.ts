import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildStoredAnswers, submissionPayloadSchema, validateQuestionnaireAnswers } from "@/lib/validation/questionnaire";
import { assertSameOrigin, getRequestIp, hmac, normalizeSearchText } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function notifyPriority(protocol: string, patientName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM;
  if (!apiKey || !from) return;
  const admin = createAdminClient();
  const { data } = await admin.from("system_settings").select("setting_value").eq("setting_key", "notification_emails").maybeSingle();
  const recipients = Array.isArray(data?.setting_value) ? data.setting_value.filter((item): item is string => typeof item === "string" && item.includes("@")) : [];
  if (!recipients.length) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `Atenção prioritária — ${protocol}`,
      text: `Uma resposta do Questionário Digital Trizi foi marcada para atenção prioritária.\n\nProtocolo: ${protocol}\nPaciente: ${patientName}\n\nAcesse o painel protegido para consultar a resposta. Nenhuma informação clínica foi incluída neste e-mail.`,
    }),
  });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = createAdminClient();
    const ipHash = hmac(getRequestIp(request.headers), process.env.RATE_LIMIT_SECRET);
    const { data: allowed, error: rateError } = await admin.rpc("consume_rate_limit", { p_scope: "public_submission", p_key_hash: ipHash, p_limit: 8, p_window_seconds: 3600 });
    if (rateError || !allowed) return NextResponse.json({ error: "Muitas tentativas. Aguarde antes de tentar novamente." }, { status: 429 });

    const parsed = submissionPayloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos. Revise o questionário." }, { status: 400 });
    const validation = validateQuestionnaireAnswers(parsed.data.answers);
    if (!validation.success) return NextResponse.json({ error: "Existem respostas obrigatórias pendentes.", fields: validation.errors }, { status: 422 });

    const answers = validation.answers;
    const patientName = String(answers.identification_full_name).trim().replace(/\s+/g, " ");
    const patientAge = Number(answers.identification_age);
    const currentWeight = Number(answers.identification_current_weight);
    const desiredWeight = Number(answers.identification_desired_weight);
    const height = Number(answers.identification_height);
    const priorityAlert = answers.emotional_death_thoughts === "sim";
    const searchName = normalizeSearchText(patientName);

    const { data: duplicate } = await admin
      .from("questionnaire_submissions")
      .select("id")
      .eq("patient_name_search", searchName)
      .eq("patient_age", patientAge)
      .gte("submitted_at", subDays(new Date(), 7).toISOString())
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: inserted, error } = await admin.from("questionnaire_submissions").insert({
      client_submission_id: parsed.data.clientSubmissionId,
      patient_name: patientName,
      patient_age: patientAge,
      current_weight: currentWeight,
      desired_weight: desiredWeight,
      height,
      answers: buildStoredAnswers(answers),
      questionnaire_version: parsed.data.questionnaireVersion,
      status: "new",
      priority_alert: priorityAlert,
      priority_alert_at: priorityAlert ? new Date().toISOString() : null,
      possible_duplicate: Boolean(duplicate?.id),
      possible_duplicate_of: duplicate?.id ?? null,
      consent_accepted: true,
      consent_version: parsed.data.consentVersion,
      consent_accepted_at: parsed.data.consentAcceptedAt,
      submitted_at: new Date().toISOString(),
    }).select("id,protocol").single();

    if (error) {
      if (error.code === "23505") {
        const { data: existing } = await admin.from("questionnaire_submissions").select("protocol").eq("client_submission_id", parsed.data.clientSubmissionId).maybeSingle();
        if (existing) return NextResponse.json({ protocol: existing.protocol, message: "Este questionário já havia sido recebido com segurança." });
      }
      throw error;
    }

    await admin.from("audit_logs").insert({ action: "submission_received", entity_type: "questionnaire_submission", entity_id: inserted.id, metadata: { protocol: inserted.protocol, priority_alert: priorityAlert, possible_duplicate: Boolean(duplicate?.id) } });
    if (parsed.data.inviteToken) {
      try {
        await admin.from("questionnaire_invites").update({ status: "completed", completed_at: new Date().toISOString(), submission_id: inserted.id }).eq("token", parsed.data.inviteToken).eq("status", "pending");
      } catch {
        // Vinculação de convite é apenas informativa para a recepção; nunca deve bloquear o envio do questionário.
      }
    }
    if (priorityAlert) notifyPriority(inserted.protocol, patientName).catch(() => undefined);
    return NextResponse.json({ protocol: inserted.protocol, message: "Suas respostas foram encaminhadas com segurança à equipe do Instituto Trizi." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível concluir o envio. Tente novamente sem fechar esta página." }, { status: 500 });
  }
}
