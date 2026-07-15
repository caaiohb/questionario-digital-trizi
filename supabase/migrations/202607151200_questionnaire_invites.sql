-- Convites personalizados de questionário, com rastreio de status (pendente/respondido/expirado/cancelado).
-- Execute esta migration no Supabase depois da migration inicial.

create table public.questionnaire_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  patient_name text not null check (char_length(patient_name) between 2 and 180),
  patient_contact text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired', 'cancelled')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  submission_id uuid references public.questionnaire_submissions(id),
  expires_at timestamptz not null default (now() + interval '14 days')
);

create index invites_status_idx on public.questionnaire_invites(status, created_at desc);
create index invites_token_idx on public.questionnaire_invites(token);

alter table public.questionnaire_invites enable row level security;

create policy invites_staff_select on public.questionnaire_invites for select to authenticated
using (public.is_active_staff());

revoke all on public.questionnaire_invites from anon, authenticated;
grant select on public.questionnaire_invites to authenticated;
grant all privileges on public.questionnaire_invites to service_role;
