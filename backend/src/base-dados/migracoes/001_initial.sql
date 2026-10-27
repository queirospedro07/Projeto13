CREATE TABLE IF NOT EXISTS utilizadores (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      nome_utilizador TEXT UNIQUE NOT NULL,
      hash_palavra_passe TEXT NOT NULL,
      nome TEXT NOT NULL,
      papel TEXT NOT NULL DEFAULT 'STUDENT',
      url_avatar TEXT,
      biografia TEXT,
      localizacao TEXT,
      meta_diaria_minutos INTEGER NOT NULL DEFAULT 45,
      minutos_hoje INTEGER NOT NULL DEFAULT 0,
      minutos_totais INTEGER NOT NULL DEFAULT 0,
      esta_suspenso INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS tokens_recuperacao_palavra_passe (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      hash_token TEXT NOT NULL UNIQUE,
      expira_em TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS perfis (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT UNIQUE NOT NULL,
      titulo_perfil TEXT,
      website TEXT,
      github TEXT,
      twitter TEXT,
      linkedin TEXT,
      url_banner TEXT,
      posicao_banner TEXT DEFAULT '50% 50%',
      e_publico INTEGER NOT NULL DEFAULT 1,
      mostrar_sequencia INTEGER NOT NULL DEFAULT 1,
      mostrar_classificacao INTEGER NOT NULL DEFAULT 1,
      mostrar_biografia INTEGER NOT NULL DEFAULT 1,
      mostrar_localizacao INTEGER NOT NULL DEFAULT 1,
      mostrar_redes_sociais INTEGER NOT NULL DEFAULT 1,
      mostrar_estatisticas INTEGER NOT NULL DEFAULT 1,
      mostrar_cursos INTEGER NOT NULL DEFAULT 1,
      mostrar_insignias INTEGER NOT NULL DEFAULT 1,
      preferencia_tema TEXT NOT NULL DEFAULT 'light',
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS ligacoes_sociais_perfil (
  id_utilizador TEXT PRIMARY KEY REFERENCES utilizadores(id) ON DELETE CASCADE,
  ligacoes TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS consentimentos_utilizador (
 id_utilizador TEXT PRIMARY KEY REFERENCES utilizadores(id) ON DELETE CASCADE,
 termos_aceites_em TEXT NOT NULL,
 versao_termos TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS denuncias (
  id TEXT PRIMARY KEY,
  id_utilizador TEXT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  tipo_alvo TEXT NOT NULL,
  id_alvo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'OPEN',
  parecer TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
      id TEXT PRIMARY KEY,
      nome TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      descricao TEXT,
      icone TEXT
    );

CREATE TABLE IF NOT EXISTS cursos (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      descricao TEXT NOT NULL,
      categoria TEXT NOT NULL,
      dificuldade TEXT NOT NULL DEFAULT 'Intermédio',
      url_miniatura TEXT,
      posicao_miniatura TEXT DEFAULT '50% 50%',
      url_banner TEXT,
      posicao_banner TEXT DEFAULT '50% 50%',
      preco DOUBLE PRECISION NOT NULL DEFAULT 0.0,
      e_gratuito INTEGER NOT NULL DEFAULT 1,
      e_publicado INTEGER NOT NULL DEFAULT 1,
      estado_aprovacao TEXT NOT NULL DEFAULT 'APPROVED',
      notas_admin TEXT,
      submetido_para_revisao_em TEXT,
      revisto_em TEXT,
      destaque INTEGER NOT NULL DEFAULT 0,
      duracao_horas DOUBLE PRECISION NOT NULL DEFAULT 10.0,
      idioma TEXT NOT NULL DEFAULT 'Português',
      id_criador TEXT NOT NULL,
      id_espaco TEXT,
      modo_chamada_padrao TEXT DEFAULT 'open',
      permitir_partilha_ecra_aluno INTEGER DEFAULT 1,
      permitir_camara_aluno INTEGER DEFAULT 1,
      resultados_aprendizagem TEXT,
      requisitos TEXT,
      documentos TEXT,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      FOREIGN KEY(id_criador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS modulos_curso (
      id TEXT PRIMARY KEY,
      id_curso TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      indice_ordem INTEGER NOT NULL DEFAULT 0,
      modo_desbloqueio TEXT NOT NULL DEFAULT 'instant',
      FOREIGN KEY(id_curso) REFERENCES cursos(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS aulas (
      id TEXT PRIMARY KEY,
      id_modulo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'video',
      conteudo TEXT,
      url_video TEXT,
      duracao_minutos INTEGER NOT NULL DEFAULT 15,
      indice_ordem INTEGER NOT NULL DEFAULT 0,
      recompensa_xp INTEGER NOT NULL DEFAULT 25,
      FOREIGN KEY(id_modulo) REFERENCES modulos_curso(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS submissoes_questionario (
  id TEXT PRIMARY KEY,
  id_utilizador TEXT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  id_aula TEXT NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  respostas TEXT NOT NULL,
  resultado TEXT NOT NULL,
  nota INTEGER NOT NULL,
  aprovado INTEGER NOT NULL DEFAULT 0,
  pendente INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL,
  revisto_por TEXT REFERENCES utilizadores(id),
  revisto_em TEXT
);

CREATE TABLE IF NOT EXISTS submissoes_projeto (
 id TEXT PRIMARY KEY,
 id_utilizador TEXT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
 id_aula TEXT NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
 url TEXT NOT NULL,
 estado TEXT NOT NULL DEFAULT 'SUBMITTED',
 parecer TEXT NOT NULL DEFAULT '',
 criado_em TEXT NOT NULL,
 revisto_por TEXT REFERENCES utilizadores(id),
 revisto_em TEXT
);

CREATE TABLE IF NOT EXISTS inscricoes (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      id_curso TEXT NOT NULL,
      inscrito_em TEXT NOT NULL,
      concluido_em TEXT,
      percentagem_progresso DOUBLE PRECISION NOT NULL DEFAULT 0,
      id_ultima_aula TEXT,
      esta_oculto INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
      UNIQUE(id_utilizador, id_curso)
    );

CREATE TABLE IF NOT EXISTS progresso_aulas (
      id TEXT PRIMARY KEY,
      id_inscricao TEXT NOT NULL,
      id_aula TEXT NOT NULL,
      concluido INTEGER NOT NULL DEFAULT 0,
      concluido_em TEXT,
      tempo_gasto_segundos INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(id_inscricao) REFERENCES inscricoes(id) ON DELETE CASCADE,
      FOREIGN KEY(id_aula) REFERENCES aulas(id) ON DELETE CASCADE,
      UNIQUE(id_inscricao, id_aula)
    );

CREATE TABLE IF NOT EXISTS espacos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      descricao TEXT,
      url_icone TEXT,
      url_banner TEXT,
      posicao_banner TEXT DEFAULT '50% 50%',
      e_privado INTEGER NOT NULL DEFAULT 0,
      categoria TEXT NOT NULL,
      id_proprietario TEXT NOT NULL,
      total_membros INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_proprietario) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS canais (
      id TEXT PRIMARY KEY,
      id_espaco TEXT NOT NULL,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'text',
      topico TEXT,
      indice_ordem INTEGER NOT NULL DEFAULT 0,
      e_voz INTEGER NOT NULL DEFAULT 0,
      esta_bloqueado INTEGER NOT NULL DEFAULT 0,
      modo_acesso TEXT DEFAULT 'discussion',
      modo_voz TEXT DEFAULT 'open',
      questao_orientadora TEXT,
      diretrizes TEXT,
      FOREIGN KEY(id_espaco) REFERENCES espacos(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS membros_espacos (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      id_espaco TEXT NOT NULL,
      papel TEXT NOT NULL DEFAULT 'MEMBER',
      aderiu_em TEXT NOT NULL,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_espaco) REFERENCES espacos(id) ON DELETE CASCADE,
      UNIQUE(id_utilizador, id_espaco)
    );

CREATE TABLE IF NOT EXISTS mensagens (
      id TEXT PRIMARY KEY,
      id_canal TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      id_pai TEXT,
      anexos TEXT,
      esta_afixado INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      FOREIGN KEY(id_canal) REFERENCES canais(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS resolucoes_mensagens (
 id_mensagem TEXT PRIMARY KEY REFERENCES mensagens(id) ON DELETE CASCADE,
 id_utilizador TEXT NOT NULL REFERENCES utilizadores(id),
 resolvido_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS avaliacoes (
      id TEXT PRIMARY KEY,
      id_curso TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      classificacao INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS questionarios (
      id TEXT PRIMARY KEY,
      id_aula TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      pontuacao_aprovacao INTEGER NOT NULL DEFAULT 70,
      recompensa_xp INTEGER NOT NULL DEFAULT 50,
      FOREIGN KEY(id_aula) REFERENCES aulas(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS perguntas_quiz (
      id TEXT PRIMARY KEY,
      id_quiz TEXT NOT NULL,
      pergunta TEXT NOT NULL,
      opcoes TEXT NOT NULL,
      indice_opcao_correta INTEGER NOT NULL,
      explicacao TEXT,
      indice_ordem INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(id_quiz) REFERENCES questionarios(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS tentativas_quiz (
      id TEXT PRIMARY KEY,
      id_quiz TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      pontuacao INTEGER NOT NULL,
      passou INTEGER NOT NULL,
      tentado_em TEXT NOT NULL,
      FOREIGN KEY(id_quiz) REFERENCES questionarios(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS certificados (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      id_curso TEXT NOT NULL,
      nome_destinatario TEXT NOT NULL,
      titulo_curso TEXT NOT NULL,
      id_credencial TEXT UNIQUE NOT NULL,
      emitido_em TEXT NOT NULL,
      pontuacao INTEGER NOT NULL DEFAULT 100,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_curso) REFERENCES cursos(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS notas (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      id_aula TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_aula) REFERENCES aulas(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS notificacoes (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      ligacao TEXT,
      esta_lida INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS amizades (
      id TEXT PRIMARY KEY,
      id_solicitante TEXT NOT NULL,
      id_destinatario TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PENDING',
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      FOREIGN KEY(id_solicitante) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_destinatario) REFERENCES utilizadores(id) ON DELETE CASCADE,
      UNIQUE(id_solicitante, id_destinatario)
    );

CREATE TABLE IF NOT EXISTS seguidores (
      id TEXT PRIMARY KEY,
      id_seguidor TEXT NOT NULL,
      id_a_seguir TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_seguidor) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_a_seguir) REFERENCES utilizadores(id) ON DELETE CASCADE,
      UNIQUE(id_seguidor, id_a_seguir)
    );

CREATE TABLE IF NOT EXISTS mensagens_diretas (
      id TEXT PRIMARY KEY,
      id_remetente TEXT NOT NULL,
      id_destinatario TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      esta_lida INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_remetente) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_destinatario) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS colaboradores_curso (
      id TEXT PRIMARY KEY,
      id_curso TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      UNIQUE(id_curso, id_utilizador)
    );

CREATE TABLE IF NOT EXISTS candidaturas_criador (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      nome_completo TEXT NOT NULL,
      biografia TEXT,
      especialidade TEXT NOT NULL,
      anos_experiencia INTEGER NOT NULL DEFAULT 0,
      url_portfolio TEXT,
      motivacao TEXT NOT NULL,
      cursos_propostos TEXT NOT NULL,
      url_video_amostra TEXT,
      estado TEXT NOT NULL DEFAULT 'PENDING',
      parecer_admin TEXT,
      revisto_por TEXT,
      revisto_em TEXT,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS simulacoes_pagamento (
    id TEXT PRIMARY KEY,
    id_utilizador TEXT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    id_curso TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    montante_centimos INTEGER NOT NULL CHECK (montante_centimos > 0),
    moeda TEXT NOT NULL DEFAULT 'EUR',
    metodo TEXT NOT NULL CHECK (metodo IN ('card', 'mbway', 'multibanco')),
    estado TEXT NOT NULL CHECK (estado IN ('approved', 'declined')),
    criado_em TEXT NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_submissoes_aluno_aula ON submissoes_questionario(id_utilizador, id_aula, criado_em);

CREATE INDEX IF NOT EXISTS idx_projetos_aluno_aula ON submissoes_projeto(id_utilizador, id_aula, criado_em);

CREATE INDEX IF NOT EXISTS idx_utilizadores_email ON utilizadores(email);

CREATE INDEX IF NOT EXISTS idx_utilizadores_nome_utilizador ON utilizadores(nome_utilizador);

CREATE INDEX IF NOT EXISTS idx_cursos_categoria ON cursos(categoria);

CREATE INDEX IF NOT EXISTS idx_cursos_criador ON cursos(id_criador);

CREATE INDEX IF NOT EXISTS idx_cursos_aprovacao ON cursos(estado_aprovacao);

CREATE INDEX IF NOT EXISTS idx_modulos_curso ON modulos_curso(id_curso);

CREATE INDEX IF NOT EXISTS idx_aulas_modulo ON aulas(id_modulo);

CREATE INDEX IF NOT EXISTS idx_inscricoes_utilizador ON inscricoes(id_utilizador);

CREATE INDEX IF NOT EXISTS idx_inscricoes_curso ON inscricoes(id_curso);

CREATE INDEX IF NOT EXISTS idx_mensagens_canal ON mensagens(id_canal);

CREATE INDEX IF NOT EXISTS idx_notificacoes_utilizador ON notificacoes(id_utilizador);

CREATE INDEX IF NOT EXISTS idx_candidaturas_criador_utilizador ON candidaturas_criador(id_utilizador);

CREATE INDEX IF NOT EXISTS idx_candidaturas_criador_estado ON candidaturas_criador(estado);

CREATE INDEX IF NOT EXISTS idx_colaboradores_curso_curso ON colaboradores_curso(id_curso);

CREATE INDEX IF NOT EXISTS idx_colaboradores_curso_utilizador ON colaboradores_curso(id_utilizador);

CREATE INDEX IF NOT EXISTS idx_simulacoes_utilizador
    ON simulacoes_pagamento(id_utilizador, criado_em);

ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS versao_sessao INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE VIEW users AS
    SELECT
      id, email, nome_utilizador AS username, hash_palavra_passe AS "passwordHash", nome AS name,
      papel AS role, url_avatar AS "avatarUrl", biografia AS bio, localizacao AS location,
      meta_diaria_minutos AS "dailyGoalMinutes", minutos_hoje AS "minutesToday",
      minutos_totais AS "totalMinutes", 0 AS xp, 1 AS level, esta_suspenso AS "isSuspended",
      criado_em AS "createdAt", atualizado_em AS "updatedAt"
    FROM utilizadores;

CREATE OR REPLACE VIEW password_reset_tokens AS
    SELECT id, id_utilizador AS user_id, hash_token AS token_hash, expira_em AS expires_at, criado_em AS created_at
    FROM tokens_recuperacao_palavra_passe;

CREATE OR REPLACE VIEW profiles AS
    SELECT
      id, id_utilizador AS "userId", titulo_perfil AS headline, website, github, linkedin,
      url_banner AS "bannerUrl", posicao_banner AS "bannerPosition",
      e_publico AS "isPublic", mostrar_sequencia AS "showStreak", mostrar_classificacao AS "showLeaderboard",
      mostrar_biografia AS "showBio", mostrar_localizacao AS "showLocation", mostrar_redes_sociais AS "showSocials",
      mostrar_estatisticas AS "showStats", mostrar_cursos AS "showCourses", mostrar_insignias AS "showBadges",
      preferencia_tema AS "themePreference"
    FROM perfis;

CREATE OR REPLACE VIEW categories AS
    SELECT id, nome AS name, slug, descricao AS description, icone AS icon
    FROM categorias;

CREATE OR REPLACE VIEW courses AS
    SELECT
      id, titulo AS title, slug, descricao AS description, categoria AS category,
      dificuldade AS difficulty, url_miniatura AS "thumbnailUrl", posicao_miniatura AS "thumbnailPosition",
      url_banner AS "bannerUrl", posicao_banner AS "bannerPosition", preco AS price, e_gratuito AS "isFree",
      e_publicado AS "isPublished", estado_aprovacao AS "approvalStatus", notas_admin AS "adminNotes",
      submetido_para_revisao_em AS "submittedForReviewAt", revisto_em AS "reviewedAt",
      destaque AS featured, duracao_horas AS "durationHours", idioma AS language,
      id_criador AS "creatorId", id_espaco AS "spaceId", modo_chamada_padrao AS "defaultCallMode",
      permitir_partilha_ecra_aluno AS "allowStudentScreenShare", permitir_camara_aluno AS "allowStudentCamera",
      resultados_aprendizagem AS "learningOutcomes", requisitos AS requirements, documentos AS documents,
      criado_em AS "createdAt", atualizado_em AS "updatedAt"
    FROM cursos;

CREATE OR REPLACE VIEW course_modules AS
    SELECT id, id_curso AS "courseId", titulo AS title, descricao AS description, indice_ordem AS "orderIndex", COALESCE(modo_desbloqueio, 'instant') AS "dripMode"
    FROM modulos_curso;

CREATE OR REPLACE VIEW lessons AS
    SELECT
      id, id_modulo AS "moduleId", titulo AS title, tipo AS type, conteudo AS content,
      url_video AS "videoUrl", duracao_minutos AS "durationMin", indice_ordem AS "orderIndex",
      recompensa_xp AS "xpReward"
    FROM aulas;

CREATE OR REPLACE VIEW enrollments AS
    SELECT
      id, id_utilizador AS "userId", id_curso AS "courseId", inscrito_em AS "enrolledAt",
      concluido_em AS "completedAt", percentagem_progresso AS "progressPercent",
      id_ultima_aula AS "lastLessonId", esta_oculto AS "isHidden"
    FROM inscricoes;

CREATE OR REPLACE VIEW lesson_progress AS
    SELECT
      id, id_inscricao AS "enrollmentId", id_aula AS "lessonId",
      concluido AS completed, concluido_em AS "completedAt",
      tempo_gasto_segundos AS "timeSpentSeconds"
    FROM progresso_aulas;

CREATE OR REPLACE VIEW spaces AS
    SELECT
      id, nome AS name, slug, descricao AS description, url_icone AS "iconUrl",
      url_banner AS "bannerUrl", posicao_banner AS "bannerPosition", e_privado AS "isPrivate",
      categoria AS category, id_proprietario AS "ownerId", total_membros AS "memberCount",
      criado_em AS "createdAt"
    FROM espacos;

CREATE OR REPLACE VIEW channels AS
    SELECT
      id, id_espaco AS "spaceId", nome AS name, tipo AS type, topico AS topic,
      indice_ordem AS "orderIndex", e_voz AS "isVoice", esta_bloqueado AS "isLocked",
      modo_acesso AS "accessMode", modo_voz AS "voiceMode", questao_orientadora AS "guidingQuestion",
      diretrizes AS guidelines
    FROM canais;

CREATE OR REPLACE VIEW memberships AS
    SELECT id, id_utilizador AS "userId", id_espaco AS "spaceId", papel AS role, aderiu_em AS "joinedAt"
    FROM membros_espacos;

CREATE OR REPLACE VIEW messages AS
    SELECT
      id, id_canal AS "channelId", id_utilizador AS "userId", conteudo AS content,
      id_pai AS "parentId", anexos AS attachments, esta_afixado AS "isPinned",
      criado_em AS "createdAt", atualizado_em AS "updatedAt"
    FROM mensagens;

CREATE OR REPLACE VIEW reviews AS
    SELECT id, id_curso AS "courseId", id_utilizador AS "userId", classificacao AS rating, comentario AS comment, criado_em AS "createdAt"
    FROM avaliacoes;

CREATE OR REPLACE VIEW quizzes AS
    SELECT id, id_aula AS "lessonId", titulo AS title, descricao AS description, pontuacao_aprovacao AS "passingScore", recompensa_xp AS "xpReward"
    FROM questionarios;

CREATE OR REPLACE VIEW quiz_questions AS
    SELECT id, id_quiz AS "quizId", pergunta AS question, opcoes AS options, indice_opcao_correta AS "correctOptionIndex", explicacao AS explanation, indice_ordem AS "orderIndex"
    FROM perguntas_quiz;

CREATE OR REPLACE VIEW quiz_attempts AS
    SELECT id, id_quiz AS "quizId", id_utilizador AS "userId", pontuacao AS score, passou AS passed, tentado_em AS "attemptedAt"
    FROM tentativas_quiz;

CREATE OR REPLACE VIEW certificates AS
    SELECT id, id_utilizador AS "userId", id_curso AS "courseId", nome_destinatario AS "recipientName", titulo_curso AS "courseTitle", id_credencial AS "credentialId", emitido_em AS "issuedAt", pontuacao AS score
    FROM certificados;

CREATE OR REPLACE VIEW notes AS
    SELECT id, id_utilizador AS "userId", id_aula AS "lessonId", conteudo AS content, criado_em AS "createdAt", atualizado_em AS "updatedAt"
    FROM notas;

CREATE OR REPLACE VIEW notifications AS
    SELECT id, id_utilizador AS "userId", tipo AS type, titulo AS title, conteudo AS content, ligacao AS link, esta_lida AS "isRead", criado_em AS "createdAt"
    FROM notificacoes;

CREATE OR REPLACE VIEW friendships AS
    SELECT id, id_solicitante AS "requesterId", id_destinatario AS "addresseeId", estado AS status, criado_em AS "createdAt", atualizado_em AS "updatedAt"
    FROM amizades;

CREATE OR REPLACE VIEW follows AS
    SELECT id, id_seguidor AS "followerId", id_a_seguir AS "followingId", criado_em AS "createdAt"
    FROM seguidores;

CREATE OR REPLACE VIEW direct_messages AS
    SELECT id, id_remetente AS "senderId", id_destinatario AS "receiverId", conteudo AS content, esta_lida AS "isRead", criado_em AS "createdAt"
    FROM mensagens_diretas;

CREATE OR REPLACE VIEW course_collaborators AS
    SELECT 
      cc.id,
      cc.id_curso AS "courseId",
      cc.id_utilizador AS "userId",
      cc.criado_em AS "createdAt",
      u.nome AS name,
      u.email AS email,
      u.nome_utilizador AS username,
      u.url_avatar AS "avatarUrl",
      u.papel AS role
    FROM colaboradores_curso cc
    JOIN utilizadores u ON cc.id_utilizador = u.id;

CREATE OR REPLACE VIEW creator_applications AS
    SELECT id, id_utilizador AS "userId", nome_completo AS "fullName", biografia AS bio, especialidade AS expertise, anos_experiencia AS "experienceYears", url_portfolio AS "portfolioUrl", motivacao AS motivation, cursos_propostos AS "proposedCourses", url_video_amostra AS "sampleVideoUrl", estado AS status, parecer_admin AS "adminFeedback", revisto_por AS "reviewedBy", revisto_em AS "reviewedAt", criado_em AS "createdAt", atualizado_em AS "updatedAt"
    FROM candidaturas_criador;
