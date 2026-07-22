-- Suporte a arquivamento: quando o questionário é marcado como "inserido no prontuário",
-- o PDF é gerado e guardado neste bucket, e as respostas (jsonb) são removidas da tabela
-- para não manter dado clínico sensível duplicado indefinidamente no banco.
-- Execute esta migration no Supabase depois das anteriores.

insert into storage.buckets (id, name, public)
values ('prontuario-pdfs', 'prontuario-pdfs', false)
on conflict (id) do nothing;

-- Nenhuma policy é criada de propósito: o bucket é privado e só a service_role
-- (usada pelo servidor) consegue ler/gravar nele, nunca o navegador diretamente.

alter table public.questionnaire_submissions add column if not exists pdf_path text;
alter table public.questionnaire_submissions add column if not exists answers_archived_at timestamptz;
