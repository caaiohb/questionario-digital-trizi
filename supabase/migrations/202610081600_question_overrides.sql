-- Gerenciador de perguntas: permite ativar/desativar, remover e reordenar perguntas
-- (padrão e personalizadas) sem alterar o código. Execute no SQL Editor do Supabase.

create table if not exists public.question_overrides (
  question_id text primary key,
  active boolean not null default true,
  removed boolean not null default false,
  sort_order integer,
  updated_at timestamptz not null default now()
);

alter table public.question_overrides enable row level security;

drop policy if exists question_overrides_staff_select on public.question_overrides;
create policy question_overrides_staff_select on public.question_overrides for select to authenticated
using (public.is_active_staff());

revoke all on public.question_overrides from anon, authenticated;
grant select on public.question_overrides to authenticated;
grant all privileges on public.question_overrides to service_role;

notify pgrst, 'reload schema';