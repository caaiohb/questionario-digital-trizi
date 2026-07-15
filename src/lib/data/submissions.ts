import { createClient } from "@/lib/supabase/server";
import { normalizeSearchText } from "@/lib/utils";
import type { SubmissionStatus } from "@/types/database";

export const PAGE_SIZE = 20;

export interface SubmissionFilters {
  query?: string;
  status?: string;
  priority?: string;
  assigned?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  order?: string;
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const now = new Date();
  const saoPauloDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const todayStart = new Date(`${saoPauloDate}T00:00:00-03:00`).toISOString();
  const tomorrowStart = new Date(new Date(`${saoPauloDate}T00:00:00-03:00`).getTime() + 86400000).toISOString();
  const sevenDays = new Date(Date.now() - 7 * 86400000).toISOString();

  const countRows = async (configure: (query: any) => any) => {
    const base = supabase.from("questionnaire_submissions").select("id", { count: "exact", head: true });
    const result = await configure(base);
    return result.count ?? 0;
  };

  const [total, newCount, inReview, inserted, priority, today, lastSevenDays] = await Promise.all([
    countRows((q: any) => q.neq("status", "archived")),
    countRows((q: any) => q.eq("status", "new")),
    countRows((q: any) => q.eq("status", "in_review")),
    countRows((q: any) => q.eq("status", "inserted_into_record")),
    countRows((q: any) => q.eq("priority_alert", true).neq("status", "archived")),
    countRows((q: any) => q.gte("submitted_at", todayStart).lt("submitted_at", tomorrowStart)),
    countRows((q: any) => q.gte("submitted_at", sevenDays)),
  ]);
  return { total, newCount, inReview, inserted, priority, today, lastSevenDays };
}

export async function listSubmissions(filters: SubmissionFilters) {
  const supabase = await createClient();
  const page = Math.max(1, Number(filters.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let query = supabase
    .from("questionnaire_submissions")
    .select("id,protocol,patient_name,patient_age,submitted_at,status,priority_alert,possible_duplicate,assigned_user_id,assigned_profile:profiles!questionnaire_submissions_assigned_user_id_fkey(id,nome)", { count: "exact" });

  if (filters.query?.trim()) {
    const raw = filters.query.trim();
    if (/^TRIZI-/i.test(raw)) query = query.ilike("protocol", `%${raw}%`);
    else query = query.ilike("patient_name_search", `%${normalizeSearchText(raw)}%`);
  }
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status as SubmissionStatus);
  if (filters.priority === "true") query = query.eq("priority_alert", true);
  if (filters.assigned) query = filters.assigned === "unassigned" ? query.is("assigned_user_id", null) : query.eq("assigned_user_id", filters.assigned);
  if (filters.dateFrom) query = query.gte("submitted_at", `${filters.dateFrom}T00:00:00-03:00`);
  if (filters.dateTo) query = query.lt("submitted_at", new Date(new Date(`${filters.dateTo}T00:00:00-03:00`).getTime() + 86400000).toISOString());

  const ascending = filters.order === "name_asc";
  query = filters.order?.startsWith("name") ? query.order("patient_name_search", { ascending }) : query.order("submitted_at", { ascending: filters.order === "date_asc" });
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0, page, pages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)) };
}

export async function getSubmission(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questionnaire_submissions")
    .select("*,assigned_profile:profiles!questionnaire_submissions_assigned_user_id_fkey(id,nome),inserted_profile:profiles!questionnaire_submissions_inserted_into_record_by_fkey(id,nome)")
    .eq("id", id).single();
  if (error) return null;
  return data;
}

export async function getSubmissionNotes(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("internal_notes").select("*,author:profiles!internal_notes_user_id_fkey(id,nome)").eq("submission_id", id).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getStatusHistory(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("submission_status_history").select("id,previous_status,new_status,changed_at,changed_by,profile:profiles!submission_status_history_changed_by_fkey(nome)").eq("submission_id", id).order("changed_at", { ascending: false });
  return data ?? [];
}
