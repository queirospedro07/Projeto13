# Revisão técnica

Revisão de 16/10/2026 após o alinhamento com o projeto de referência.

- Backend CommonJS separado em rotas, controladores, modelos e serviços; modelos com module.exports.
- PostgreSQL com pool assíncrono, SQL parametrizado, migrações versionadas e validação de checksums.
- Importação verificada de 32 tabelas e 50 registos do SQLite local; o ficheiro original foi conservado.
- React 19, Vite 8, Axios direto, React Icons e Recharts; páginas NomePage e componentes com JSX, CSS e index.js juntos.
- Formatação e lint nos dois projetos. CSS sem !important.
- Testes em schemas PostgreSQL temporários, sem modificar os dados da aplicação.
- Cobertura de autenticação, permissões, publicação, avaliações, projetos, certificados, chat, sockets, privacidade e recuperação de conta.
- 29 testes aprovados, incluindo pedidos simultâneos, rollback, savepoints, filtros combinados, edição de perfis, moderação e backup/restauro.
- Arranque real pelo start.bat -NoBrowser confirmado: PostgreSQL, API, frontend e proxy; 9 utilizadores, 5 cursos e 8 inscrições conservados após reinício.

O projeto de referência foi consultado no commit 8f4553f. Mantiveram-se os requisitos próprios da NEXO, incluindo comunidades, chamadas e a fonte local. Não foram copiadas configurações que desativassem a verificação de certificados SSL.

A compilação e os testes automáticos não substituem uma revisão visual manual da interface nem constituem uma auditoria de segurança exaustiva.

Comparação detalhada: [Alinhamento com a referência](ALINHAMENTO_REFERENCIA.md).

