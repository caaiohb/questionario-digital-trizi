# Início rápido — Vercel + Supabase

Este arquivo resume a publicação do **Questionário Digital Trizi**. Para detalhes de segurança, backup e testes, consulte `README.md`, `SECURITY.md` e `TESTS.md`.

## 1. Criar o banco no Supabase

1. Crie um projeto novo no Supabase.
2. Abra **SQL Editor**.
3. Cole e execute todo o conteúdo de:

```text
supabase/migrations/202607140001_initial_schema.sql
```

4. Em **Authentication > Providers > Email**, mantenha e-mail/senha habilitado e desative cadastro público.
5. Em **Authentication > URL Configuration**, informe o domínio definitivo e os redirecionamentos descritos no `README.md`.

## 2. Preparar as variáveis

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
RATE_LIMIT_SECRET=
AUDIT_HASH_SECRET=
```

A chave `SUPABASE_SERVICE_ROLE_KEY` é segredo de servidor. Nunca coloque `NEXT_PUBLIC_` no nome dela.

## 3. Criar o primeiro administrador

Com as variáveis configuradas localmente:

```bash
npm install
npm run admin:create -- --email=SEU_EMAIL --name="SEU NOME" --password='SENHA_FORTE'
```

A senha precisa ter ao menos 12 caracteres, maiúscula, minúscula, número e símbolo.

## 4. Publicar na Vercel

1. Envie esta pasta para um repositório privado no GitHub.
2. Na Vercel, escolha **Add New > Project** e importe o repositório.
3. Confirme o framework **Next.js**.
4. Adicione as variáveis do item 2 em **Settings > Environment Variables**.
5. Use Node.js 22.
6. Faça o deploy.
7. Depois de definir o domínio final, atualize `NEXT_PUBLIC_SITE_URL` e publique novamente.
8. Atualize também as URLs permitidas no Supabase Auth.

## 5. Acessos principais

```text
/questionario               formulário público
/login                      acesso dos funcionários
/painel                     dashboard interno
/painel/usuarios            funcionários, somente administrador
/painel/configuracoes       identidade e textos, somente administrador
```

## 6. Antes de liberar para pacientes

- Adicione a logo oficial no painel de configurações.
- Revise a política de privacidade e o termo de consentimento.
- Revise os contatos de emergência.
- Teste envio, login, cópia para prontuário, PDF, CSV e recuperação de senha.
- Configure SMTP próprio no Supabase.
- Execute `npm audit --omit=dev`.
- Não utilize dados reais em Preview ou desenvolvimento.
