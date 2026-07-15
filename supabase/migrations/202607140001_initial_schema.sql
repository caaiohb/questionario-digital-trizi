-- Questionário Digital Trizi
-- Execute esta migration no Supabase antes do primeiro deploy.

create extension if not exists pgcrypto;
create extension if not exists unaccent;
create extension if not exists pg_trgm;

create type public.staff_role as enum ('administrator', 'employee');
create type public.submission_status as enum ('draft', 'submitted', 'new', 'in_review', 'inserted_into_record', 'archived');

create sequence if not exists public.trizi_protocol_sequence start 1;

create or replace function public.generate_trizi_protocol()
returns text
language sql
security definer
set search_path = public
as $$
  select 'TRIZI-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.trizi_protocol_sequence')::text, 6, '0');
$$;

create or replace function public.normalize_search_text(value text)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select lower(regexp_replace(unaccent(coalesce(value, '')), '\s+', ' ', 'g'));
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 160),
  email text not null unique,
  perfil public.staff_role not null default 'employee',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table public.questionnaire_submissions (
  id uuid primary key default gen_random_uuid(),
  client_submission_id uuid not null unique,
  protocol text not null unique default public.generate_trizi_protocol(),
  patient_name text not null check (char_length(patient_name) between 2 and 180),
  patient_name_search text not null default '',
  patient_age smallint not null check (patient_age between 12 and 120),
  current_weight numeric(6,2) not null check (current_weight between 25 and 400),
  desired_weight numeric(6,2) not null check (desired_weight between 25 and 400),
  height numeric(4,3) not null check (height between 1 and 2.5),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  questionnaire_version text not null,
  status public.submission_status not null default 'new',
  priority_alert boolean not null default false,
  priority_alert_at timestamptz,
  possible_duplicate boolean not null default false,
  possible_duplicate_of uuid references public.questionnaire_submissions(id),
  consent_accepted boolean not null check (consent_accepted = true),
  consent_version text not null,
  consent_accepted_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  assigned_user_id uuid references public.profiles(id),
  inserted_into_record_at timestamptz,
  inserted_into_record_by uuid references public.profiles(id),
  archived_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id),
  anonymized_at timestamptz
);

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.questionnaire_submissions(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  note text not null check (char_length(note) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submission_status_history (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.questionnaire_submissions(id) on delete cascade,
  previous_status public.submission_status,
  new_status public.submission_status not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id),
  action text not null check (char_length(action) between 2 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 100),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.request_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0,
  primary key (scope, key_hash)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger submissions_updated_at before update on public.questionnaire_submissions for each row execute function public.set_updated_at();
create trigger notes_updated_at before update on public.internal_notes for each row execute function public.set_updated_at();

create or replace function public.prepare_submission()
returns trigger language plpgsql set search_path = public, extensions as $$
begin
  new.patient_name := trim(regexp_replace(new.patient_name, '\s+', ' ', 'g'));
  new.patient_name_search := public.normalize_search_text(new.patient_name);
  if new.priority_alert and new.priority_alert_at is null then new.priority_alert_at := now(); end if;
  return new;
end;
$$;
create trigger submissions_prepare before insert or update of patient_name, priority_alert on public.questionnaire_submissions for each row execute function public.prepare_submission();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$ select id from public.profiles where user_id = auth.uid() and ativo = true limit 1 $$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists(select 1 from public.profiles where user_id = auth.uid() and ativo = true) $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists(select 1 from public.profiles where user_id = auth.uid() and ativo = true and perfil = 'administrator') $$;

create or replace function public.record_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.submission_status_history(submission_id, previous_status, new_status, changed_by)
    values (new.id, null, new.status, public.current_profile_id());
  elsif old.status is distinct from new.status and public.current_profile_id() is not null then
    insert into public.submission_status_history(submission_id, previous_status, new_status, changed_by)
    values (new.id, old.status, new.status, public.current_profile_id());
  end if;
  return new;
end;
$$;
create trigger submissions_status_history after insert or update of status on public.questionnaire_submissions for each row execute function public.record_status_change();

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare current_row public.request_rate_limits%rowtype;
begin
  select * into current_row from public.request_rate_limits where scope = p_scope and key_hash = p_key_hash for update;
  if not found then
    insert into public.request_rate_limits(scope, key_hash, attempts) values (p_scope, p_key_hash, 1);
    return true;
  end if;
  if current_row.window_started_at < now() - make_interval(secs => p_window_seconds) then
    update public.request_rate_limits set window_started_at = now(), attempts = 1 where scope = p_scope and key_hash = p_key_hash;
    return true;
  end if;
  if current_row.attempts >= p_limit then return false; end if;
  update public.request_rate_limits set attempts = attempts + 1 where scope = p_scope and key_hash = p_key_hash;
  return true;
end;
$$;

create or replace function public.anonymize_submission(p_submission_id uuid, p_actor_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(select 1 from public.profiles where id = p_actor_profile_id and perfil = 'administrator' and ativo = true) then
    raise exception 'Acesso negado';
  end if;
  update public.questionnaire_submissions
  set patient_name = 'Paciente anonimizada', patient_name_search = 'paciente anonimizada', answers = '{}'::jsonb,
      status = 'archived', archived_at = coalesce(archived_at, now()), anonymized_at = now(), assigned_user_id = null
  where id = p_submission_id;
  delete from public.internal_notes where submission_id = p_submission_id;
end;
$$;

create index submissions_submitted_at_idx on public.questionnaire_submissions(submitted_at desc) where deleted_at is null;
create index submissions_status_idx on public.questionnaire_submissions(status) where deleted_at is null;
create index submissions_patient_search_idx on public.questionnaire_submissions using gin (patient_name_search gin_trgm_ops);
create index submissions_protocol_idx on public.questionnaire_submissions(protocol);
create index submissions_priority_idx on public.questionnaire_submissions(priority_alert, submitted_at desc) where deleted_at is null;
create index internal_notes_submission_idx on public.internal_notes(submission_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index status_history_submission_idx on public.submission_status_history(submission_id, changed_at desc);


alter table public.profiles enable row level security;
alter table public.questionnaire_submissions enable row level security;
alter table public.internal_notes enable row level security;
alter table public.submission_status_history enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.request_rate_limits enable row level security;

-- Usuários autenticados possuem acesso direto somente de leitura. Toda mutação
-- passa pelas Route Handlers da Vercel, que validam perfil e usam a service role
-- exclusivamente no servidor.
create policy profiles_staff_select on public.profiles for select to authenticated
using (public.is_active_staff());
create policy submissions_staff_select on public.questionnaire_submissions for select to authenticated
using (public.is_active_staff() and deleted_at is null);
create policy notes_staff_select on public.internal_notes for select to authenticated
using (public.is_active_staff());
create policy status_history_staff_select on public.submission_status_history for select to authenticated
using (public.is_active_staff());
create policy audit_admin_select on public.audit_logs for select to authenticated
using (public.is_admin());
create policy settings_staff_select on public.system_settings for select to authenticated
using (public.is_active_staff());

revoke all on public.profiles from anon, authenticated;
revoke all on public.questionnaire_submissions from anon, authenticated;
revoke all on public.internal_notes from anon, authenticated;
revoke all on public.submission_status_history from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;
revoke all on public.system_settings from anon, authenticated;
revoke all on public.request_rate_limits from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.questionnaire_submissions to authenticated;
grant select on public.internal_notes to authenticated;
grant select on public.submission_status_history to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.system_settings to authenticated;

grant all privileges on public.profiles to service_role;
grant all privileges on public.questionnaire_submissions to service_role;
grant all privileges on public.internal_notes to service_role;
grant all privileges on public.submission_status_history to service_role;
grant all privileges on public.audit_logs to service_role;
grant all privileges on public.system_settings to service_role;
grant all privileges on public.request_rate_limits to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke execute on function public.generate_trizi_protocol() from public, anon, authenticated;
revoke execute on function public.normalize_search_text(text) from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.prepare_submission() from public, anon, authenticated;
revoke execute on function public.record_status_change() from public, anon, authenticated;
revoke execute on function public.current_profile_id() from public, anon;
revoke execute on function public.is_active_staff() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.current_profile_id() to authenticated, service_role;
grant execute on function public.is_active_staff() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.generate_trizi_protocol() to service_role;
grant execute on function public.normalize_search_text(text) to service_role;
grant execute on function public.set_updated_at() to service_role;
grant execute on function public.prepare_submission() to service_role;
grant execute on function public.record_status_change() to service_role;

revoke execute on function public.consume_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;
revoke execute on function public.anonymize_submission(uuid,uuid) from public, anon, authenticated;
grant execute on function public.anonymize_submission(uuid,uuid) to service_role;

insert into public.system_settings(setting_key, setting_value) values
  ('institution_name', '"Instituto Trizi"'::jsonb),
  ('questionnaire_name', '"Questionário Digital Trizi"'::jsonb),
  ('logo_url', 'null'::jsonb),
  ('primary_color', '"#24463d"'::jsonb),
  ('secondary_color', '"#d7b989"'::jsonb),
  ('intro_text', '"Este questionário reúne informações importantes para apoiar sua avaliação e o acompanhamento realizado pelo Instituto Trizi. Reserve alguns minutos e responda com tranquilidade."'::jsonb),
  ('final_message', '"Suas respostas foram encaminhadas com segurança à equipe do Instituto Trizi."'::jsonb),
  ('privacy_policy', '"O Instituto Trizi trata dados pessoais e dados de saúde exclusivamente para avaliação, atendimento, acompanhamento, registro em prontuário e cumprimento de obrigações legais. O acesso é restrito a profissionais autorizados, com medidas técnicas e administrativas de segurança."'::jsonb),
  ('consent_text', '"Declaro que as informações fornecidas neste questionário são verdadeiras e autorizo o Instituto Trizi a armazená-las e utilizá-las exclusivamente para avaliação, atendimento, acompanhamento e registro em meu prontuário, conforme a legislação de proteção de dados vigente."'::jsonb),
  ('consent_version', '"2026.07.1"'::jsonb),
  ('emergency_message', '"Se você estiver em risco agora ou pensando em se machucar, procure imediatamente um serviço de emergência e permaneça com uma pessoa de confiança. Este questionário não substitui atendimento de urgência."'::jsonb),
  ('emergency_contacts', '[{"label":"CVV","value":"188"},{"label":"Emergência","value":"Procure o pronto atendimento mais próximo"}]'::jsonb),
  ('estimated_minutes', '15'::jsonb),
  ('notification_emails', '[]'::jsonb),
  ('session_timeout_minutes', '30'::jsonb)
on conflict (setting_key) do nothing;
