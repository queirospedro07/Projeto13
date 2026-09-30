# Relatório Técnico e Funcional Completo — Plataforma LearnSpace

> **Plataforma Full Stack Integrada de Aprendizagem (LMS), Comunidades em Tempo Real (Discord-Style), Gamificação e Estúdio de Criadores**  
> *Ambiente: Node.js (v22+) & Express · React (v18) & Vite · SQLite / PostgreSQL · Socket.IO & WebRTC*  
> *Data do Relatório: Setembro de 2026*

---

## 1. Resumo Executivo & Visão Geral

O **LearnSpace** é uma plataforma educacional e comunitária de última geração desenvolvida segundo as boas práticas de engenharia de software e padrões da unidade curricular de **Programação Web (PW)**. O sistema integra três pilares fundamentais da web moderna:

1. **Gestão de Aprendizagem (LMS):** Cursos em vídeo com reprodução contínua, anotações de aula com persistência em tempo real, materiais e recursos descarregáveis, fórum Q&A com aceitação de respostas e questionários interativos (*quizzes*) com autoavaliação.
2. **Comunidade Colaborativa em Tempo Real:** Espaços temáticos inspirados no Discord, organizados em canais de texto e salas de estudo por voz, chat bidirecional instantâneo via WebSockets, reações com emojis, menções, mensagens diretas (DMs) privadas e chamadas de áudio/vídeo P2P via WebRTC.
3. **Gamificação, Certificação & Economia de Criadores:** Progressão de níveis com experiência (XP), sequências diárias (*streaks*), mais de 20 medalhas colecionáveis em quatro níveis de raridade, emissão e validação pública de certificados digitais, além de um *Creator Studio* com métricas financeiras e construtor de cursos em 5 etapas.

### 1.1. Personas de Demonstração Pré-configuradas (1-Click Demo)
A plataforma possui *seeds* realistas que permitem alternar instantaneamente de perfil:
- **Pedro Silva (Estudante):** `pedro@learnspace.io` / `password123`  
  Inscrito no curso *Full Stack Web Dev*, streak de 12 dias ativo, Nível 4 (1.450 XP), 5 insígnias desbloqueadas.
- **Sarah Jenkins (Instrutora / Criadora):** `sarah@learnspace.io` / `password123`  
  Autora do curso *Frontend Masters*, acesso ao *Creator Studio*, análise de receitas (\$14.850) e assistente de criação de cursos.
- **Alex Vance (Administrador da Plataforma):** `alex@learnspace.io` / `password123`  
  Liderança do sistema, acesso total ao `/admin`, monitorização de métricas da infraestrutura e moderação de utilizadores/conteúdos.

---

## 2. Arquitetura do Sistema e Stack Tecnológico

O LearnSpace foi concebido sob uma arquitetura de aplicação desacoplada (Decoupled Client-Server SPA Architecture).

### 2.1. Tecnologias do Backend
- **Node.js (v22+) com ES Modules (`type: module`):** Desempenho nativo com suporte a recursos de ponta.
- **Express (v4.21):** Roteamento modular estruturado em rotas de entrada, controladores e modelos.
- **node:sqlite (DatabaseSync):** Motor SQLite síncrono nativo do Node.js 22 com WAL (*Write-Ahead Logging*) e chaves estrangeiras ativas, eliminando dependências externas de compilação em C++.
- **pg (PostgreSQL Pool):** Suporte nativo a PostgreSQL para produção escalável (com fallback automático transparente para SQLite local).
- **Socket.IO (v4.8):** Motor de eventos em tempo real para chat em canais, estado de presença, digitação e sinalização WebRTC.
- **jsonwebtoken (JWT):** Autenticação stateless baseada em token Bearer com expiração configurada para 24 horas.
- **bcryptjs:** Criptografia unidirecional com *salt rounds* de fator 10 para passwords.
- **express-validator (v7.3):** Validação e sanitização estrita de formulários e payloads contra injeção e dados corrompidos.
- **Helmet & CORS:** Cabeçalhos de segurança HTTP rígidos e controle estrito de origens autorizadas.
- **express-rate-limit:** Limitação de taxa de requisições por IP contra abusos e ataques de força bruta.

### 2.2. Tecnologias do Frontend
- **React (v18.3) & Vite (v5.4):** Ferramental moderno com *Hot Module Replacement (HMR)* ultrarrápido e compilação otimizada.
- **Tailwind CSS (v3.4):** Design system utilitário com modo escuro nativo (*class-based* com deteção de preferência do sistema).
- **React Router DOM (v6.28):** Roteamento no cliente com rotas aninhadas (`AppLayout`), proteções de acesso (`ProtectedRoute`) e redirecionamentos condicionais.
- **Axios (v1.20):** Cliente HTTP centralizado com interceptores automáticos de injeção de token JWT e tratamento de erros 401.
- **Lucide Icons:** Biblioteca uniforme e leve de iconografia.
- **Recharts (v2.13):** Gráficos interativos para métricas de progresso de estudo e receitas de criadores.
- **Canvas-Confetti:** Celebrações visuais em subidas de nível e desbloqueio de certificados.
- **WebRTC Nativo:** Conexões *Peer-to-Peer* (RTCPeerConnection) com servidores STUN públicos da Google e Metered para chamadas de áudio e vídeo com partilha de ecrã.

---

## 3. Modelo de Dados e Esquema Relacional

O LearnSpace conta com um esquema relacional de **26 tabelas** totalmente normalizadas, com integridade referencial mantida por restrições `FOREIGN KEY ... ON DELETE CASCADE` e índices de alta performance:

1. `users` — Registo mestre de utilizadores, credenciais, XP, nível e suspensão.
2. `profiles` — Informação estendida de perfil público, redes sociais e tema.
3. `categories` — Categorização de cursos e espaços.
4. `courses` — Registo de cursos publicados ou em rascunho.
5. `course_modules` — Módulos temáticos ordenados de um curso.
6. `lessons` — Unidade fundamental de conteúdo educacional (vídeo, texto, quiz).
7. `enrollments` — Matrículas de alunos nos cursos e progresso percentual.
8. `lesson_progress` — Rastreio granular de lições concluídas e tempo de estudo.
9. `spaces` — Comunidades inspiradas em servidores do Discord.
10. `channels` — Canais de texto e voz dentro de cada espaço.
11. `memberships` — Associação e papéis de utilizadores nos espaços.
12. `messages` — Mensagens de texto enviadas em canais com suporte a anexos.
13. `reactions` — Reações com emojis em mensagens.
14. `reviews` — Avaliações e comentários com nota de cursos.
15. `quizzes` — Questionários associados a lições com pontuação mínima.
16. `quiz_questions` — Perguntas de múltipla escolha com opções em JSON e explicações.
17. `quiz_attempts` — Histórico e pontuações das tentativas de quizzes.
18. `achievements` — Catálogo de conquistas/medalhas em 4 raridades.
19. `user_achievements` — Medalhas desbloqueadas pelos utilizadores.
20. `xp_transactions` — Extrato histórico de ganhos de pontos de experiência.
21. `certificates` — Certificados digitais com código único de validação.
22. `notes` — Caderno digital de anotações sincronizado por aula.
23. `qa_questions` — Perguntas e dúvidas submetidas no fórum da aula.
24. `qa_answers` — Respostas de colegas ou instrutores com aceitação oficial.
25. `direct_messages` — Mensagens instantâneas privadas entre utilizadores.
26. `friendships` & `course_roles` — Amizades entre estudantes e cargos específicos em cursos.

---

## 4. Módulos Funcionais Detalhados

- **Módulo 1: Autenticação & Perfis:** Registo com validações, login JWT com expiração de 24h, contas demo instantâneas, edição de perfil, temas e bloqueio de utilizadores suspensos.
- **Módulo 2: Cursos e Player de Aprendizagem:** Catálogo pesquisável, player customizado com vídeo HD, velocidades (0.75x a 2x), notas automáticas, recursos para download, Q&A colaborativo e quizzes avaliados em tempo real.
- **Módulo 3: Comunidade em Tempo Real:** Espaços com canais de texto e salas de voz, lista de membros online com hierarquia visual de cargos (Owner, Admin, Mod, Member).
- **Módulo 4: Chat e Mensagens Diretas:** Mensagens Socket.IO instantâneas, indicadores de quem está a escrever ("typing..."), reações com emojis e conversas privadas 1-a-1.
- **Módulo 5: Chamadas WebRTC de Áudio e Vídeo:** Chamadas peer-to-peer integradas, toque sonoro de chamada recebida, controlos de câmara/áudio e partilha de ecrã.
- **Módulo 6: Gamificação e Retenção:** Sistema de XP (+25 lição, +50 quiz, +500 curso), subida de nível com confetes, histórico de streaks, 20+ medalhas e ranking global.
- **Módulo 7: Certificados Digitais:** Emissão automática ao completar 100% do curso, código de validação público `/certificates/verify/:id` e suporte para impressão/PDF.
- **Módulo 8: Creator Studio & Course Builder:** Painel do instrutor com gráficos de receitas e alunos, e assistente em 5 passos para criar novos cursos e módulos.
- **Módulo 9: Painel de Administração:** Dashboard de métricas da infraestrutura e ferramenta de suspensão/reativação de utilizadores.
- **Módulo 10: Interface e Acessibilidade:** Modo escuro/claro, Command Palette `Ctrl+K`, efeitos de áudio opcionais e navegação mobile responsiva.

---

## 5. Especificação da API REST

A API disponibiliza mais de 35 endpoints categorizados:
- `/api/auth` — `POST /register`, `POST /login`, `GET /me`, `POST /demo-login`, `PUT /profile`
- `/api/courses` — `GET /`, `GET /:id`, `GET /my-learning`, `POST /:id/enroll`, `POST /:id/lessons/:lessonId/complete`, `POST /`, `PUT /:id`
- `/api/quizzes` — `GET /lesson/:lessonId`, `POST /:id/submit`
- `/api/notes` — `GET /lesson/:lessonId`, `POST /lesson/:lessonId`
- `/api/qa` — `GET /course/:courseId`, `POST /question`, `POST /answer`, `POST /answer/:id/accept`
- `/api/spaces` — `GET /`, `GET /:id`, `POST /:id/join`
- `/api/channels` — `GET /:channelId/messages`, `POST /:channelId/messages`
- `/api/messages` — `POST /:id/reaction`
- `/api/social` — `GET /direct-messages/:userId`, `POST /direct-messages`, `GET /friends`
- `/api/gamification` — `GET /badges`, `GET /leaderboard`
- `/api/certificates` — `GET /verify/:id`
- `/api/admin` — `GET /metrics`, `POST /users/:id/suspend`

---

## 6. Eventos WebSockets e WebRTC

- Presença: `user-connected`, `presence-update`, `disconnect`
- Chat: `join-channel`, `leave-channel`, `typing`, `stop-typing`, `send-message`, `new-message`, `reaction-updated`
- Mensagens Privadas: `direct-message`, `new-direct-message`
- Sinalização de Chamada: `call-user`, `incoming-call`, `accept-call`, `call-accepted`, `call-rejected`, `ice-candidate`, `end-call`

---

## 7. Como Executar e Fazer Deploy

### Execução Local:
Execute `start.bat` no diretório raiz ou rode `npm run dev` na pasta `server` e `client`.

### Deploy em Produção:
- **Backend (Render):** Compatível com Node >= 18 ou Blueprint `render.yaml`.
- **Frontend (Vercel):** Single Page Application configurada em `vercel.json` com variáveis `VITE_API_URL` e `VITE_SOCKET_URL`.
