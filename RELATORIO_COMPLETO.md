# Relatório técnico — NEXO

Plataforma de aprendizagem e comunidade desenvolvida para Programação Web, CTeSP TPSI, IPVC.

## Objetivo

Disponibilizar cursos com aulas, avaliações e projetos, comunidades de estudo, mensagens e certificados. As contas de professor gerem conteúdos; a administração revê publicações e modera a plataforma. Um administrador tem também acesso às ferramentas de professor.

## Implementação

A aplicação está dividida em backend e frontend, seguindo a organização do projeto PW-P-LAB-TRABALHO-PRATICO. O backend utiliza Node.js, Express e PostgreSQL. O frontend utiliza React 19, Vite 8, React Router, Axios e CSS nativo.

As rotas definem endpoints e middleware. Os controladores tratam pedidos e respostas. Os modelos contêm consultas parametrizadas. Os serviços implementam regras partilhadas de permissões, avaliações, progresso e pagamentos. Socket.IO trata presença e sinalização; as chamadas utilizam WebRTC.

As páginas e componentes são organizados em pastas próprias com JSX, CSS e index.js. A tipografia NexoFont é carregada localmente. As camadas CSS definem a prioridade dos estilos sem !important.

## Persistência

Os dados estão em PostgreSQL, num volume persistente no desenvolvimento local. As migrações SQL são versionadas e verificadas por checksum. A antiga base SQLite foi importada sem alterar o ficheiro original, com comparação integral de contagens e checksums das 32 tabelas suportadas.

Os backups são snapshots PostgreSQL obtidos numa transação consistente. O restauro só permite uma base vazia e verifica tabelas, colunas e contagens. Os testes usam schemas separados e removem os dados de teste no fim.

## Segurança e estabilidade

JWT, palavras-passe com bcrypt, validação de pedidos, limites de autenticação, permissões verificadas no servidor e proteção de conteúdos pagos. Os pagamentos são simulações explícitas e não recolhem dados bancários. As transações e os índices únicos protegem contra inscrições, aprovações e certificados duplicados em pedidos simultâneos.

As contas demo são separadas das contas pessoais; a preparação não repõe dados editados e é recusada em produção. O login rápido não permite selecionar administradores nem contas pessoais. Os tickets de suporte foram removidos; a ajuda contém 33 perguntas, pesquisa, filtros e guia de utilização.

## Verificação

Os comandos check e format:check verificam código, testes e compilação. A suite inclui casos de autenticação, papéis, avaliações, moderação, sockets, persistência, concorrência e recuperação a partir de backup. É necessária revisão manual adicional para confirmar todos os detalhes visuais e todos os comportamentos em dispositivos e redes diferentes.

Consulte README.md, docs/ARQUITETURA.md, docs/REVISAO.md, docs/DEMONSTRACAO.md e DEPLOY.md para as instruções operacionais e os limites atuais.
