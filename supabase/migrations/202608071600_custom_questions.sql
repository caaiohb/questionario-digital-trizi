-- Perguntas personalizadas: permite que administradores adicionem perguntas simples
-- (sim/não ou texto) a qualquer seção existente do questionário, direcionadas por
-- sexo biológico (todos / feminino / masculino), sem precisar alterar o código.
-- Execute esta migration no Supabase depois das anteriores.

create table public.custom_questions (
  id uuid primary key default gen_random_uuid(),
  section_id text not null,
  gender text not null default 'todos' check (gender in ('todos', 'feminino', 'masculino')),
  text text not null check (char_length(text) between 3 and 500),
  type text not null default 'yes_no' check (type in ('yes_no', 'text', 'textarea')),
  required boolean not null default true,
  sensitive boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index custom_questions_section_idx on public.custom_questions(section_id, active);

alter table public.custom_questions enable row level security;

create policy custom_questions_staff_select on public.custom_questions for select to authenticated
using (public.is_active_staff());

revoke all on public.custom_questions from anon, authenticated;
grant select on public.custom_questions to authenticated;
grant all privileges on public.custom_questions to service_role;
