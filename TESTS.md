# Testes realizados

## Resultado desta entrega

Executados com sucesso em 14/07/2026:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Resultados:

- TypeScript: aprovado, sem erros.
- ESLint: aprovado, sem erros.
- Vitest: 8 testes aprovados em 2 arquivos.
- Build de produção Next.js 16.2.10: aprovado.
- Smoke test local em modo de produção: `/questionario`, `/login` e `/robots.txt` responderam HTTP 200.
- Verificação de credenciais fixas conhecidas: nenhuma credencial de produção encontrada no código.

O endpoint de auditoria de vulnerabilidades do registro npm retornou erro HTTP 502 durante a geração desta entrega. Por isso, execute novamente `npm audit --omit=dev` em uma rede com acesso ao registro npm antes da publicação.

## Cobertura automatizada

Os testes cobrem:

- IDs e códigos únicos.
- Versão vinculada a todas as perguntas.
- Presença das 15 seções e mais de 90 campos configurados.
- Sugestão automática para perguntas menstruais na menopausa.
- Preservação de respostas revisadas manualmente.
- Respostas obrigatórias.
- Regras condicionais.
- Geração do JSON estruturado com IDs estáveis.

## Roteiro manual de homologação com Supabase real

1. Preencher o questionário em celular, tablet e desktop.
2. Interromper e continuar na mesma aba para validar o rascunho de sessão.
3. Testar todos os campos condicionais.
4. Marcar a resposta prioritária e confirmar mensagem de apoio e alerta interno.
5. Revisar, editar uma etapa, enviar e conferir protocolo.
6. Reenviar a mesma requisição e confirmar idempotência.
7. Entrar como funcionário e testar pesquisa, filtros, atribuição, status, cópia, nota, PDF e impressão.
8. Entrar como administrador e testar usuários, configurações, CSV, auditoria, anonimização e soft delete.
9. Tentar acessar o painel sem login e funções administrativas como funcionário.
10. Confirmar logs sem respostas médicas em Vercel, Supabase e auditoria.
11. Executar a migration em projeto Supabase de homologação e validar todas as políticas RLS.
12. Testar convite, recuperação de senha, SMTP e redirecionamentos no domínio final.
