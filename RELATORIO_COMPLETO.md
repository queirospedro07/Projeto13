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

## 3. Modelo de Dados e Esquema Relacional (PT-PT)

A base de dados da plataforma conta com um esquema relacional de **35 tabelas em Português de Portugal (PT-PT)** totalmente normalizadas, com integridade referencial mantida por restrições `FOREIGN KEY ... ON DELETE CASCADE` e índices de alta performance:

1. `utilizadores` — Registo mestre de utilizadores, credenciais, XP, nível e estado de suspensão (`id`, `email`, `nome_utilizador`, `hash_palavra_passe`, `nome`, `papel`, `url_avatar`, `biografia`, `localizacao`, `dias_sequencia`, `data_ultima_atividade`, `meta_diaria_minutos`, `minutos_hoje`, `minutos_totais`, `xp`, `nivel`, `esta_suspenso`, `criado_em`, `atualizado_em`).
2. `tokens_recuperacao_palavra_passe` — Gestão segura de tokens para redefinição de palavra-passe com expiração temporal (`id`, `id_utilizador`, `hash_token`, `expira_em`, `criado_em`).
3. `perfis` — Informação estendida de perfil público, redes sociais, visibilidade e tema (`id`, `id_utilizador`, `titulo_perfil`, `website`, `github`, `twitter`, `linkedin`, `instagram`, `youtube`, `tiktok`, `discord`, `twitch`, `url_banner`, `posicao_banner`, `e_publico`, `mostrar_sequencia`, `mostrar_classificacao`, `mostrar_biografia`, `mostrar_localizacao`, `mostrar_redes_sociais`, `mostrar_estatisticas`, `mostrar_cursos`, `mostrar_insignias`, `preferencia_tema`).
4. `categorias` — Categorização de cursos e espaços (`id`, `nome`, `slug`, `descricao`, `icone`).
5. `cursos` — Registo de cursos publicados, pendentes ou em rascunho (`id`, `titulo`, `slug`, `descricao`, `categoria`, `dificuldade`, `url_miniatura`, `posicao_miniatura`, `url_banner`, `posicao_banner`, `preco`, `e_gratuito`, `e_publicado`, `estado_aprovacao`, `notas_admin`, `submetido_para_revisao_em`, `revisto_em`, `destaque`, `duracao_horas`, `idioma`, `id_criador`, `id_espaco`, `modo_chamada_padrao`, `permitir_partilha_ecra_aluno`, `permitir_camara_aluno`, `resultados_aprendizagem`, `requisitos`, `documentos`, `criado_em`, `atualizado_em`).
6. `modulos_curso` — Módulos temáticos ordenados de um curso (`id`, `id_curso`, `titulo`, `descricao`, `indice_ordem`).
7. `aulas` — Unidade fundamental de conteúdo educacional: vídeo, texto ou questionário (`id`, `id_modulo`, `titulo`, `tipo`, `conteudo`, `url_video`, `duracao_minutos`, `indice_ordem`, `recompensa_xp`).
8. `inscricoes` — Matrículas e inscrições de alunos nos cursos e progresso percentual (`id`, `id_utilizador`, `id_curso`, `inscrito_em`, `concluido_em`, `percentagem_progresso`, `id_ultima_aula`, `esta_oculto`).
9. `progresso_aulas` — Rastreio granular de aulas concluídas e tempo de estudo (`id`, `id_inscricao`, `id_aula`, `concluido`, `concluido_em`, `tempo_gasto_segundos`).
10. `espacos` — Comunidades temáticas com canais de conversação e salas de voz (`id`, `nome`, `slug`, `descricao`, `url_icone`, `url_banner`, `posicao_banner`, `e_privado`, `categoria`, `id_proprietario`, `total_membros`, `criado_em`).
11. `canais` — Canais de texto e voz dentro de cada espaço (`id`, `id_espaco`, `nome`, `tipo`, `topico`, `indice_ordem`, `e_voz`, `esta_bloqueado`, `modo_acesso`, `modo_voz`, `questao_orientadora`, `diretrizes`).
12. `membros_espacos` — Associação e papéis de utilizadores nos espaços (`id`, `id_utilizador`, `id_espaco`, `papel`, `aderiu_em`).
13. `mensagens` — Mensagens de texto enviadas em canais com suporte a anexos (`id`, `id_canal`, `id_utilizador`, `conteudo`, `id_pai`, `anexos`, `esta_afixado`, `criado_em`, `atualizado_em`).
14. `reacoes` — Reações com emojis em mensagens (`id`, `id_mensagem`, `id_utilizador`, `emoji`).
15. `avaliacoes` — Avaliações e comentários com nota atribuída a cursos (`id`, `id_curso`, `id_utilizador`, `classificacao`, `comentario`, `criado_em`).
16. `quizzes` — Questionários interativos associados a aulas (`id`, `id_aula`, `titulo`, `descricao`, `pontuacao_aprovacao`, `recompensa_xp`).
17. `perguntas_quiz` — Perguntas de escolha múltipla com opções e explicação pedagógica (`id`, `id_quiz`, `pergunta`, `opcoes`, `indice_opcao_correta`, `explicacao`, `indice_ordem`).
18. `tentativas_quiz` — Histórico e pontuações das tentativas de questionários (`id`, `id_quiz`, `id_utilizador`, `pontuacao`, `passou`, `tentado_em`).
19. `conquistas` — Catálogo de medalhas/conquistas com quatro níveis de raridade (`id`, `slug`, `titulo`, `descricao`, `icone`, `categoria`, `raridade`, `recompensa_xp`).
20. `conquistas_utilizadores` — Conquistas desbloqueadas pelos utilizadores (`id`, `id_utilizador`, `id_conquista`, `desbloqueado_em`).
21. `transacoes_xp` — Extrato histórico de ganhos de pontos de experiência (`id`, `id_utilizador`, `quantidade`, `acao`, `descricao`, `criado_em`).
22. `certificados` — Certificados digitais emitidos com código de autenticação único (`id`, `id_utilizador`, `id_curso`, `nome_destinatario`, `titulo_curso`, `id_credencial`, `emitido_em`, `pontuacao`).
23. `notas` — Caderno digital pessoal de anotações sincronizado por aula (`id`, `id_utilizador`, `id_aula`, `conteudo`, `criado_em`, `atualizado_em`).
24. `perguntas_qa` — Dúvidas submetidas no fórum comunitário da aula (`id`, `id_curso`, `id_utilizador`, `titulo`, `corpo`, `esta_respondida`, `criado_em`).
25. `respostas_qa` — Respostas de colegas ou formadores com estado de aceitação (`id`, `id_pergunta`, `id_utilizador`, `corpo`, `esta_aceite`, `criado_em`).
26. `notificacoes` — Notificações de conquistas, avisos e cursos (`id`, `id_utilizador`, `tipo`, `titulo`, `conteudo`, `ligacao`, `esta_lida`, `criado_em`).
27. `amizades` — Gestão de pedidos e ligações de amizade entre utilizadores (`id`, `id_solicitante`, `id_destinatario`, `estado`, `criado_em`, `atualizado_em`).
28. `seguidores` — Sistema social de seguidores e seguidos (`id`, `id_seguidor`, `id_a_seguir`, `criado_em`).
29. `mensagens_diretas` — Mensagens instantâneas privadas 1-para-1 (`id`, `id_remetente`, `id_destinatario`, `conteudo`, `esta_lida`, `criado_em`).
30. `cargos_curso` — Cargos e permissões personalizadas por curso (`id`, `id_curso`, `nome`, `cor`, `pode_publicar_anuncios`, `pode_falar_palco`, `pode_partilhar_ecra`, `pode_moderar_chat`, `pode_gerir_voz`, `indice_ordem`, `criado_em`).
31. `cargos_membros_curso` — Atribuição de cargos aos alunos nos cursos (`id`, `id_curso`, `id_utilizador`, `id_cargo`, `atribuido_em`).
32. `candidaturas_criador` — Inquéritos de candidatura a formador com portfólio e proposta (`id`, `id_utilizador`, `nome_completo`, `biografia`, `especialidade`, `anos_experiencia`, `url_portfolio`, `motivacao`, `cursos_propostos`, `url_video_amostra`, `estado`, `parecer_admin`, `revisto_por`, `revisto_em`, `criado_em`, `atualizado_em`).
33. `candidaturas_admin` — Candidaturas para a equipa de administração e moderação (`id`, `id_utilizador`, `nome_completo`, `email`, `motivacao`, `experiencia`, `horas_disponibilidade_semanal`, `areas_interesse`, `cenario_situacao`, `estado`, `parecer_admin`, `revisto_por`, `revisto_em`, `criado_em`, `atualizado_em`).
34. `pedidos_suporte` — Sistema central de tickets e pedidos de assistência (`id`, `id_utilizador`, `assunto`, `categoria`, `prioridade`, `estado`, `criado_em`, `atualizado_em`, `resolvido_em`, `id_admin_atribuido`).
35. `mensagens_suporte` — Histórico de mensagens trocadas nos pedidos de suporte (`id`, `id_pedido`, `id_remetente`, `conteudo`, `e_resposta_admin`, `criado_em`).

Para além disso, a camada de base de dados conta com **vistas (VIEWs) e gatilhos (INSTEAD OF TRIGGERS)** compatíveis para interoperabilidade com ferramentas e módulos legados.

---

## 4. Módulos Funcionais Detalhados

- **Módulo 1: Autenticação & Perfis:** Registo com validações, login JWT com expiração de 24h, contas demo instantâneas, edição de perfil, temas e bloqueio de utilizadores suspensos.
- **Módulo 2: Cursos e Player de Aprendizagem:** Catálogo pesquisável, player customizado com vídeo HD, velocidades (0.75x a 2x), notas automáticas, recursos para download, Q&A colaborativo e quizzes avaliados em tempo real.
- **Restrição de Pesquisa:** A barra de pesquisa global e a página de resultados `/search` apenas ficam disponíveis para utilizadores autenticados; visitantes anónimos são direcionados para o login.
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
