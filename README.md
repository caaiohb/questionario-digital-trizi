# Questionário Digital Trizi

Sistema completo do **Instituto Trizi** para coleta segura de questionários clínicos, consulta interna, cópia para prontuário, auditoria e exportações. O projeto foi preparado para **Next.js App Router + Supabase + Vercel**.

## Recursos entregues

### Área pública

- Questionário responsivo em 15 etapas clínicas.
- Consentimento obrigatório e política de privacidade.
- Configuração central em `src/config/questionnaireConfig.ts`.
- Validação no cliente e novamente no servidor.
- Rascunho temporário em `sessionStorage`, com expiração de 2 horas.
- Revisão completa antes do envio.
- Idempotência para impedir gravação duplicada da mesma tentativa.
- Protocolo no formato `TRIZI-AAAA-000000`.
- Detecção informativa de possíveis duplicidades recentes.
- Regra de atenção prioritária, mensagem de apoio e notificação opcional.
- Nenhuma resposta definitiva armazenada no navegador.

### Área interna

- Login individual por e-mail e senha.
- Recuperação e atualização de senha.
- Perfis de administrador e funcionário.
- Dashboard com indicadores.
- Busca sem diferenciar maiúsculas, minúsculas ou acentos.
- Filtros por período, status, alerta e responsável.
- Paginação e ordenação.
- Visualização por seções, com sigilo reforçado para saúde sexual.
- Cópia de resumo, questionário completo ou seção.
- Status, atribuição de responsável e observações internas.
- PDF A4, impressão e CSV administrativo.
- Gerenciamento de funcionários e configurações.
- Auditoria de visualizações e ações.
- Soft delete e anonimização.

## Stack

- Next.js 16 com App Router e TypeScript.
- React 19.
- Tailwind CSS 4.
- Supabase Auth e PostgreSQL.
- `@supabase/ssr` para sessão no servidor.
- React Hook Form e Zod.
- `pdf-lib` para PDFs.
- Vitest para testes.
- Node.js 22, compatível com Vercel.

## Estrutura principal

```text
src/
├── app/
│   ├── questionario/                 formulário público
│   ├── login/                        login interno
│   ├── painel/                       área protegida
│   ├── api/                          Route Handlers
│   └── politica-de-privacidade/
├── components/
├── config/
│   ├── questionnaireConfig.ts        perguntas e regras
│   ├── defaultSettings.ts
│   └── status.ts
├── lib/
│   ├── supabase/                     clientes SSR e administrativo
│   ├── validation/                   validação do questionário
│   ├── formatters/                   textos para prontuário
│   └── data/                         consultas do painel
└── types/

supabase/
├── migrations/                       schema, funções, RLS e dados iniciais
└── config.toml

scripts/
├── create-first-admin.ts
└── seed-dev.ts
```

## 1. Pré-requisitos

- Node.js 22.
- Conta no Supabase.
- Conta na Vercel.
- Repositório GitHub, GitLab ou Bitbucket para deploy automático, ou Vercel CLI.

## 2. Instalação local

```bash
npm install
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais do projeto Supabase.

```bash
npm run dev
```

Acesse `http://localhost:3000/questionario`.

## 3. Criar o projeto no Supabase

1. Crie um projeto novo e selecione uma região adequada à operação do Instituto Trizi.
2. Abra **SQL Editor**.
3. Execute todo o arquivo:

```text
supabase/migrations/202607140001_initial_schema.sql
```

Alternativamente, com Supabase CLI:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

A migration cria:

- `profiles`.
- `questionnaire_submissions`.
- `internal_notes`.
- `submission_status_history`.
- `audit_logs`.
- `system_settings`.
- `request_rate_limits`.
- enums, índices, triggers, funções, RLS e acesso autenticado direto somente de leitura.

## 4. Configurar autenticação no Supabase

Em **Authentication > Providers > Email**:

- mantenha login por e-mail e senha habilitado;
- desabilite cadastro público;
- mantenha confirmação de e-mail para convites;
- configure SMTP próprio antes da produção.

Em **Authentication > URL Configuration**:

```text
Site URL: https://SEU-DOMINIO.com.br
Redirect URLs:
https://SEU-DOMINIO.com.br/auth/callback
https://SEU-DOMINIO.com.br/atualizar-senha
https://*.vercel.app/auth/callback       apenas se previews autorizados forem usados
```

Não use dados reais em deployments de Preview.

## 5. Variáveis de ambiente

Copie `.env.example` e configure:

| Variável | Exposição | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Chave publicável do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor | Inserção pública segura e ações administrativas |
| `NEXT_PUBLIC_SITE_URL` | Pública | URL final do sistema |
| `RATE_LIMIT_SECRET` | Servidor | HMAC para rate limiting sem guardar IP bruto |
| `AUDIT_HASH_SECRET` | Servidor | HMAC de identificadores técnicos |
| `RESEND_API_KEY` | Servidor, opcional | E-mails de atenção prioritária |
| `ALERT_EMAIL_FROM` | Servidor, opcional | Remetente autorizado no Resend |

Gere segredos fortes:

```bash
openssl rand -base64 48
```

A `SUPABASE_SERVICE_ROLE_KEY` nunca pode receber prefixo `NEXT_PUBLIC_`.

## 6. Criar o primeiro administrador

Depois de executar a migration, use uma senha forte fornecida no terminal:

```bash
npm run admin:create -- \
  --email=administracao@seudominio.com.br \
  --name="Nome do administrador" \
  --password='SENHA_FORTE_FORNECIDA_NO_MOMENTO'
```

O script não possui senha padrão, não imprime a senha e reverte o usuário caso a criação do perfil falhe.

Os próximos funcionários são convidados em:

```text
/painel/usuarios
```

## 7. Publicar na Vercel

### Opção recomendada: repositório Git

1. Envie o projeto para um repositório privado.
2. Na Vercel, clique em **Add New > Project**.
3. Importe o repositório.
4. O preset **Next.js** será detectado automaticamente.
5. Em **Settings > Environment Variables**, adicione todas as variáveis.
6. Marque segredos apenas para Production e ambientes autorizados.
7. Confirme Node.js 22 nas configurações do projeto. O `package.json` também fixa `22.x`.
8. Faça o deploy.
9. Atualize `NEXT_PUBLIC_SITE_URL` com o domínio definitivo e gere novo deploy.
10. Atualize Site URL e Redirect URLs no Supabase.

### Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel env add RATE_LIMIT_SECRET
vercel env add AUDIT_HASH_SECRET
vercel --prod
```

Mudanças em variáveis da Vercel só passam a valer em novos deployments.

## 8. Configurar alertas por e-mail

1. Valide um domínio no Resend.
2. Configure `RESEND_API_KEY` e `ALERT_EMAIL_FROM` na Vercel.
3. Entre como administrador.
4. Acesse **Configurações**.
5. Informe os e-mails autorizados, um por linha.

O e-mail contém somente protocolo, nome da paciente e indicação genérica de prioridade. Respostas clínicas não são enviadas por e-mail.

## 9. Dados fictícios de desenvolvimento

Nunca execute o seed no banco de produção.

Em `.env.local`:

```env
ALLOW_DEV_SEED=true
DEV_ADMIN_PASSWORD=senha-forte-exclusiva-de-desenvolvimento
DEV_EMPLOYEE_PASSWORD=outra-senha-forte-exclusiva
```

Execute:

```bash
npm run seed:dev
```

São criados usuários e pacientes claramente identificados como fictícios, incluindo um exemplo de alerta prioritário.

## 10. Alterar ou adicionar perguntas

Edite somente:

```text
src/config/questionnaireConfig.ts
```

Cada pergunta possui ID, código, seção, tipo, opções, obrigatoriedade, condição, ordem, versão, sensibilidade e regra de resumo.

Regras importantes:

1. Nunca reutilize um ID antigo para outra pergunta.
2. Ao alterar significado clínico, crie novo ID e incremente `QUESTIONNAIRE_VERSION`.
3. Respostas anteriores mantêm texto, código e versão armazenados.
4. Execute testes antes do deploy.

## 11. Backup e recuperação

### Recomendado

- Ative backups automáticos e Point-in-Time Recovery no Supabase conforme o plano contratado.
- Restrinja o acesso aos backups.
- Teste restauração em projeto isolado.
- Documente RPO e RTO internos.

### Backup manual criptografado

Use a connection string direta do Supabase em ambiente seguro:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --file=trizi-$(date +%F).dump
```

Restauração em banco vazio:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_DATABASE_URL" trizi-AAAA-MM-DD.dump
```

Nunca armazene dumps com dados reais em repositórios, computadores pessoais sem criptografia ou serviços públicos.

## 12. Testes

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Consulte `TESTS.md` para os resultados desta entrega e o roteiro de homologação manual com um projeto Supabase real. Antes da publicação, execute também `npm audit --omit=dev`.

## 13. Checklist antes da publicação

- [ ] Migration executada sem erros.
- [ ] RLS habilitada em todas as tabelas públicas.
- [ ] Cadastro público do Supabase desativado.
- [ ] Primeiro administrador criado sem credencial padrão.
- [ ] SMTP próprio configurado.
- [ ] Variáveis da Vercel separadas por ambiente.
- [ ] `service_role` ausente do bundle do navegador.
- [ ] Domínio HTTPS definitivo configurado.
- [ ] Redirect URLs revisadas.
- [ ] Política de privacidade e consentimento revisados juridicamente.
- [ ] Contatos de segurança revisados pelo Instituto Trizi.
- [ ] Retenção, exclusão e anonimização formalizadas internamente.
- [ ] Testes de administrador, funcionário, anônimo e usuário desativado concluídos.
- [ ] PDF, CSV, impressão e cópia para prontuário homologados.
- [ ] Backups e restauração testados.
- [ ] Nenhum dado real em desenvolvimento ou Preview.

## Observação regulatória

O código fornece controles técnicos, mas a conformidade com LGPD e normas aplicáveis também depende de processos, contratos, treinamento, governança, bases legais, retenção, resposta a incidentes e revisão jurídica do Instituto Trizi.
