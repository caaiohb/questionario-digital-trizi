-- Área da médica: novo perfil "doctor" que só acessa /medica (questionários pendentes,
-- copiar prompt e marcar como atendido). Execute no SQL Editor do Supabase.

alter type public.staff_role add value if not exists 'doctor';

alter table public.questionnaire_submissions
  add column if not exists doctor_attended_at timestamptz,
  add column if not exists doctor_attended_by uuid references public.profiles(id);

create index if not exists submissions_doctor_pending_idx
  on public.questionnaire_submissions(submitted_at)
  where doctor_attended_at is null and deleted_at is null;

-- Questionários que já foram inseridos no prontuário ou arquivados antes desta função
-- existir não ficam como pendentes para a médica.
update public.questionnaire_submissions
set doctor_attended_at = now()
where doctor_attended_at is null
  and (status::text in ('inserted_into_record', 'archived') or answers_archived_at is not null);

-- O perfil "doctor" não tem leitura direta das tabelas (somente via servidor, com regras próprias).
create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists(select 1 from public.profiles where user_id = auth.uid() and ativo = true and perfil in ('administrator', 'employee')) $$;

-- Cada usuário continua podendo ler o próprio perfil (necessário para o login da médica).
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated
using (user_id = auth.uid());

notify pgrst, 'reload schema';