# Relatório Técnico — Projeto NEXO

**Unidade Curricular:** Programação Web  
**Curso:** CTeSP em Tecnologias e Programação de Sistemas de Informação (TPSI) — IPVC  
**Ano Letivo:** 2025/2026  

**Elementos do Grupo:**
- Pedro Queirós

---

## 1. Introdução e Objetivos

O projeto **NEXO** foi desenvolvido para a unidade curricular de Programação Web com o objetivo de criar uma plataforma de ensino online (e-learning) que também funcione como espaço de convívio e estudo entre alunos e formadores.

Em vez de ser apenas um site de vídeos gravados, procurámos juntar num único projeto:
1. **Gestão de Cursos:** visualização de aulas em vídeo e texto, apontamentos por aula, fórum de dúvidas (Q&A) e questionários de avaliação (quizzes).
2. **Comunidade em Tempo Real:** espaços organizados por canais de texto e salas de voz/vídeo, mensagens privadas (DMs), lista de amigos e partilha de ecrã através de WebRTC.
3. **Progresso e Certificados:** acompanhamento de aulas e quizzes concluídos, registo de dias seguidos de estudo (*streak*), desbloqueio de medalhas e geração de certificados digitais.

### 1.1. Contas de Teste Criadas no Seed
Para facilitar a demonstração e os testes durante a apresentação do trabalho, o backend cria automaticamente as seguintes contas principais (todas com a palavra-passe `password123`):

- **Pedro Silva (Aluno):** `aluno@nexo.pt` — conta inscrita no curso de React e TypeScript, com progresso registado e medalhas.
- **Mariana Costa (Formadora):** `mariana@nexo.pt` — conta com acesso ao Estúdio do Criador (`/creator`) e autora dos cursos iniciais.
- **Rui Oliveira (Administrador):** `admin@nexo.pt` — conta com acesso ao painel de administração (`/admin`), supervisão de cursos, gestão de utilizadores e resposta a tickets.
- **Tiago Ramos (Aluno com candidatura):** `tiago@nexo.pt` — conta de aluno com uma candidatura a formador no estado pendente, pronta a ser avaliada pelo administrador.

---

## 2. Arquitetura e Tecnologias

A aplicação está dividida em duas pastas independentes (`backend` e `frontend`), que comunicam entre si através de uma API REST (JSON) e de WebSockets (Socket.IO).

### 2.1. Backend (`backend/`)
- **Node.js (v22+) e Express:** estruturação das rotas REST, controladores e middlewares.
- **SQLite (`node:sqlite`):** utilizado em desenvolvimento local para que o projeto corra sem precisar de instalar um servidor de base de dados externo. O ficheiro é guardado em `backend/data/nexo.db`.
- **PostgreSQL (`pg`):** configurado em `connection.js` como opção para ambientes de produção (com fallback automático para SQLite caso `DATABASE_URL` não esteja definida).
- **Socket.IO:** usado para o chat dos canais, mensagens privadas, indicadores de utilizadores online e troca de sinais (SDP/ICE) das chamadas WebRTC.
- **Autenticação e Segurança:**
  - `jsonwebtoken` (JWT) para sessões com validade de 24 horas;
  - `bcryptjs` para guardar as palavras-passe encriptadas;
  - `express-validator` para validar os campos enviados nos formulários;
  - `helmet`, `cors` e `express-rate-limit` para proteção básica dos pedidos HTTP.

### 2.2. Frontend (`frontend/`)
- **React 18 + Vite:** construção da interface por componentes e páginas.
- **React Router DOM (v6):** gestão das rotas públicas e privadas (`ProtectedRoute`), separando as áreas de aluno, formador e administrador.
- **Tailwind CSS:** estilização responsiva e suporte para tema claro e escuro.
- **Axios (`services/api.js`):** configuração central dos pedidos à API, enviando automaticamente o token JWT no cabeçalho `Authorization` e redirecionando para `/login` caso a sessão expire (erro 401).
- **WebRTC (`RTCPeerConnection`):** utilizado para as chamadas de voz, vídeo e partilha de ecrã diretamente no navegador.

---

## 3. Estrutura da Base de Dados

As tabelas principais da base de dados foram definidas com nomes em português no ficheiro `backend/src/database/init.js` (com *views* e *triggers* auxiliares para manter compatibilidade com as queries da API):

1. `utilizadores` — dados da conta, papel (`STUDENT`, `CREATOR`, `SUBADMIN`, `ADMIN`) e estado de suspensão.
2. `tokens_recuperacao_palavra_passe` — tokens temporários para recuperação de palavra-passe.
3. `perfis` — biografia, redes sociais, banner e opções de privacidade do perfil.
4. `categorias` — categorias dos cursos e espaços.
5. `cursos` — dados do curso, preço, dificuldade, estado de aprovação (`DRAFT`, `PENDING`, `APPROVED`, `REJECTED`) e formador responsável.
6. `modulos_curso` e `aulas` — organização dos módulos e respetivas aulas (vídeo, texto ou quiz).
7. `inscricoes` e `progresso_aulas` — registo dos cursos em que cada aluno está inscrito e quais as aulas já concluídas.
8. `espacos`, `canais` e `membros_espacos` — comunidades, canais de texto/voz e membros de cada espaço.
9. `mensagens` e `reacoes` — mensagens enviadas nos canais e reações com emojis.
10. `avaliacoes` — críticas e classificações (1 a 5 estrelas) deixadas pelos alunos nos cursos.
11. `questionarios`, `perguntas_quiz` e `tentativas_quiz` — estrutura dos quizzes, perguntas e histórico de notas dos alunos.
12. `conquistas` e `conquistas_utilizadores` — medalhas disponíveis e medalhas ganhas por cada utilizador.
13. `certificados` — certificados emitidos ao concluir 100% de um curso, com código único para verificação pública.
14. `notas`, `perguntas_qa` e `respostas_qa` — apontamentos individuais dos alunos e secção de perguntas e respostas das aulas.
15. `notificacoes` — avisos mostrados no ícone do sino na barra superior.
16. `amizades`, `seguidores` e `mensagens_diretas` — pedidos de amizade, seguidores e chat privado entre dois utilizadores.
17. `cargos_curso` e `cargos_membros_curso` — cargos personalizados dentro do servidor de cada curso.
18. `candidaturas_criador` e `candidaturas_admin` — formulários submetidos por utilizadores que se candidatam a formador ou subadministrador.
19. `pedidos_suporte` e `mensagens_suporte` — sistema de tickets de ajuda entre utilizadores e administração.

---

## 4. Resumo das Rotas da API REST

- **`/api/auth`** — registo (`POST /register`), login (`POST /login`), dados da sessão (`GET /me`), atualização de perfil (`PUT /profile`) e recuperação de palavra-passe.
- **`/api/courses`** — listagem e filtros de cursos (`GET /`), detalhes (`GET /:id`), inscrição (`POST /:id/enroll`), marcar aula como concluída (`POST /:id/lessons/:lessonId/complete`), criação e edição de cursos.
- **`/api/quizzes`** — carregar quiz da aula (`GET /lesson/:lessonId`) e submeter respostas (`POST /:id/submit`).
- **`/api/notes` e `/api/qa`** — guardar apontamentos da aula e publicar/responder a dúvidas.
- **`/api/spaces`, `/api/channels` e `/api/messages`** — listar espaços da comunidade, aderir a espaços, ler/enviar mensagens nos canais e adicionar reações.
- **`/api/social`** — gestão de amigos, seguidores e mensagens diretas.
- **`/api/gamification`** — consulta de medalhas (`GET /badges`).
- **`/api/certificates`** — emissão e página pública de verificação (`GET /verify/:id`).
- **`/api/creator`** — estatísticas do formador e submissão de candidatura a criador.
- **`/api/admin`** — estatísticas gerais, moderação de cursos, revisão de candidaturas e suspensão de contas.
- **`/api/support`** — criação e resposta a tickets de suporte.

---

## 5. Comunicação em Tempo Real (Socket.IO e WebRTC)

O ficheiro `backend/src/sockets/chatSocket.js` trata dos eventos em tempo real:
- **Presença:** regista os utilizadores ligados e envia a lista de utilizadores online para atualizar os indicadores verdes no chat e na barra lateral.
- **Canais de Texto e Mensagens Diretas:** entrada/saída de salas (`join-channel`, `leave-channel`), envio de mensagens e indicador de "a escrever...".
- **Salas de Voz e Vídeo (WebRTC):** gere a entrada nas salas de chamada e faz a ponte das mensagens de sinalização (`offer`, `answer`, `ice-candidate`) entre os participantes para estabelecer a ligação de áudio, vídeo e partilha de ecrã.

---

## 6. Instruções de Execução e Publicação

1. **Localmente:** correr `npm install` e `npm run dev` nas pastas `backend` e `frontend` (ou usar o script `start.bat` em Windows).
2. **Em Produção:** o projeto inclui os ficheiros `render.yaml` (para publicar o backend no Render) e `frontend/vercel.json` (para publicar o frontend na Vercel), conforme explicado no ficheiro [DEPLOY.md](DEPLOY.md).
