# Segurança e LGPD

Este projeto trata respostas de saúde como dados pessoais sensíveis.

## Controles implementados

- Autenticação Supabase validada no servidor.
- Cookies de sessão `HTTP Only`, `SameSite=Lax` e `Secure` em produção.
- Cadastro público desativado.
- Perfis `administrator` e `employee`.
- Row Level Security em todas as tabelas do schema público.
- Acesso direto dos usuários autenticados limitado à leitura; todas as mutações passam por Route Handlers da Vercel com validação de perfil no servidor.
- Chave `service_role` utilizada somente em Route Handlers e scripts administrativos.
- Validação Zod no servidor e validação do formulário no cliente.
- Rate limiting persistido no PostgreSQL com identificadores HMAC; IP bruto não é armazenado.
- Verificação de origem nas operações mutáveis.
- Cabeçalhos de segurança e bloqueio de indexação do painel.
- Auditoria de visualização, cópia, exportação, status, atribuição, usuários e exclusões.
- Soft delete e anonimização administrativa.
- Respostas íntimas fora de tabelas de listagem, e-mails e notificações.

## Antes da produção

- Realize revisão jurídica da política de privacidade, bases legais, retenção e direitos das titulares.
- Configure SMTP próprio no Supabase.
- Ative MFA para administradores, caso disponível no plano e política adotados.
- Restrinja o acesso ao projeto Vercel e Supabase pelo princípio do menor privilégio.
- Ative proteção de branch, revisão de código, alertas e backups.
- Faça teste de RLS com usuário administrador, funcionário, anônimo e usuário desativado.
- Não copie dados reais para ambientes de Preview ou desenvolvimento.
