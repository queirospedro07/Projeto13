import { ADDITIONAL_SCHEMA } from './additionalSchema.js';
import { PROFILE_SOCIAL_SCHEMA } from '../models/ProfileSocials.js';
import bcrypt from 'bcryptjs';
import { seedDemoShowcaseData } from './demoSeed.js';

export function initializeSchemaAndSeed(db) {
  const legacy = db.prepare("SELECT type FROM sqlite_master WHERE name = 'quizzes'").get();
  if (legacy?.type === 'table')
    throw new Error(
      'Base de dados de uma versão antiga: faça uma cópia de segurança e uma migração explícita antes de arrancar.',
    );

  // 1. CRIAÇÃO DAS TABELAS EM PORTUGUÊS DE PORTUGAL (PT-PT)
  db.exec(`
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

    ${PROFILE_SOCIAL_SCHEMA}
    ${ADDITIONAL_SCHEMA}

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
      preco REAL NOT NULL DEFAULT 0.0,
      e_gratuito INTEGER NOT NULL DEFAULT 1,
      e_publicado INTEGER NOT NULL DEFAULT 1,
      estado_aprovacao TEXT NOT NULL DEFAULT 'APPROVED',
      notas_admin TEXT,
      submetido_para_revisao_em TEXT,
      revisto_em TEXT,
      destaque INTEGER NOT NULL DEFAULT 0,
      duracao_horas REAL NOT NULL DEFAULT 10.0,
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

    CREATE TABLE IF NOT EXISTS inscricoes (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      id_curso TEXT NOT NULL,
      inscrito_em TEXT NOT NULL,
      concluido_em TEXT,
      percentagem_progresso REAL NOT NULL DEFAULT 0,
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

    -- ÍNDICES DE ALTA PERFORMANCE
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
  `);

  // 2. VISTAS E GATILHOS (VIEWS & INSTEAD OF TRIGGERS) PARA TOTAL COMPATIBILIDADE BIDIRECIONAL
  db.exec(`
    DROP TRIGGER IF EXISTS trg_users_insert;
    DROP TRIGGER IF EXISTS trg_users_update;
    DROP VIEW IF EXISTS users;
    CREATE VIEW users AS
    SELECT
      id, email, nome_utilizador AS username, hash_palavra_passe AS passwordHash, nome AS name,
      papel AS role, url_avatar AS avatarUrl, biografia AS bio, localizacao AS location,
      meta_diaria_minutos AS dailyGoalMinutes, minutos_hoje AS minutesToday,
      minutos_totais AS totalMinutes, 0 AS xp, 1 AS level, esta_suspenso AS isSuspended,
      criado_em AS createdAt, atualizado_em AS updatedAt
    FROM utilizadores;

    CREATE TRIGGER trg_users_insert INSTEAD OF INSERT ON users
    FOR EACH ROW BEGIN
      INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, url_avatar, biografia, localizacao, meta_diaria_minutos, minutos_hoje, minutos_totais, esta_suspenso, criado_em, atualizado_em)
      VALUES (NEW.id, NEW.email, NEW.username, NEW.passwordHash, NEW.name, COALESCE(NEW.role, 'STUDENT'), NEW.avatarUrl, NEW.bio, NEW.location, COALESCE(NEW.dailyGoalMinutes, 45), COALESCE(NEW.minutesToday, 0), COALESCE(NEW.totalMinutes, 0), COALESCE(NEW.isSuspended, 0), NEW.createdAt, NEW.updatedAt);
    END;

    CREATE TRIGGER trg_users_update INSTEAD OF UPDATE ON users
    FOR EACH ROW BEGIN
      UPDATE utilizadores SET
        email = COALESCE(NEW.email, email),
        nome_utilizador = COALESCE(NEW.username, nome_utilizador),
        hash_palavra_passe = COALESCE(NEW.passwordHash, hash_palavra_passe),
        nome = COALESCE(NEW.name, nome),
        papel = COALESCE(NEW.role, papel),
        url_avatar = NEW.avatarUrl,
        biografia = NEW.bio,
        localizacao = NEW.location,
        meta_diaria_minutos = COALESCE(NEW.dailyGoalMinutes, meta_diaria_minutos),
        minutos_hoje = COALESCE(NEW.minutesToday, minutos_hoje),
        minutos_totais = COALESCE(NEW.totalMinutes, minutos_totais),
        esta_suspenso = COALESCE(NEW.isSuspended, esta_suspenso),
        criado_em = COALESCE(NEW.createdAt, criado_em),
        atualizado_em = COALESCE(NEW.updatedAt, atualizado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_users_delete INSTEAD OF DELETE ON users
    FOR EACH ROW BEGIN
      DELETE FROM utilizadores WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS password_reset_tokens AS
    SELECT id, id_utilizador AS user_id, hash_token AS token_hash, expira_em AS expires_at, criado_em AS created_at
    FROM tokens_recuperacao_palavra_passe;

    CREATE TRIGGER IF NOT EXISTS trg_prt_insert INSTEAD OF INSERT ON password_reset_tokens
    FOR EACH ROW BEGIN
      INSERT INTO tokens_recuperacao_palavra_passe (id, id_utilizador, hash_token, expira_em, criado_em)
      VALUES (NEW.id, NEW.user_id, NEW.token_hash, NEW.expires_at, NEW.created_at);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_prt_delete INSTEAD OF DELETE ON password_reset_tokens
    FOR EACH ROW BEGIN
      DELETE FROM tokens_recuperacao_palavra_passe WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS profiles AS
    SELECT
      id, id_utilizador AS userId, titulo_perfil AS headline, website, github, linkedin,
      url_banner AS bannerUrl, posicao_banner AS bannerPosition,
      e_publico AS isPublic, mostrar_sequencia AS showStreak, mostrar_classificacao AS showLeaderboard,
      mostrar_biografia AS showBio, mostrar_localizacao AS showLocation, mostrar_redes_sociais AS showSocials,
      mostrar_estatisticas AS showStats, mostrar_cursos AS showCourses, mostrar_insignias AS showBadges,
      preferencia_tema AS themePreference
    FROM perfis;

    CREATE TRIGGER IF NOT EXISTS trg_profiles_insert INSTEAD OF INSERT ON profiles
    FOR EACH ROW BEGIN
      INSERT INTO perfis (id, id_utilizador, titulo_perfil, website, github, linkedin, url_banner, posicao_banner, e_publico, mostrar_sequencia, mostrar_classificacao, mostrar_biografia, mostrar_localizacao, mostrar_redes_sociais, mostrar_estatisticas, mostrar_cursos, mostrar_insignias, preferencia_tema)
      VALUES (NEW.id, NEW.userId, NEW.headline, NEW.website, NEW.github, NEW.linkedin, NEW.bannerUrl, COALESCE(NEW.bannerPosition, '50% 50%'), COALESCE(NEW.isPublic, 1), COALESCE(NEW.showStreak, 1), COALESCE(NEW.showLeaderboard, 1), COALESCE(NEW.showBio, 1), COALESCE(NEW.showLocation, 1), COALESCE(NEW.showSocials, 1), COALESCE(NEW.showStats, 1), COALESCE(NEW.showCourses, 1), COALESCE(NEW.showBadges, 1), COALESCE(NEW.themePreference, 'light'));
    END;

    DROP TRIGGER IF EXISTS trg_profiles_update;
    CREATE TRIGGER IF NOT EXISTS trg_profiles_update INSTEAD OF UPDATE ON profiles
    FOR EACH ROW BEGIN
      UPDATE perfis SET
        titulo_perfil = NEW.headline,
        website = NEW.website,
        github = NEW.github,
        linkedin = NEW.linkedin,
        url_banner = NEW.bannerUrl,
        posicao_banner = COALESCE(NEW.bannerPosition, posicao_banner),
        e_publico = COALESCE(NEW.isPublic, e_publico),
        mostrar_sequencia = COALESCE(NEW.showStreak, mostrar_sequencia),
        mostrar_classificacao = COALESCE(NEW.showLeaderboard, mostrar_classificacao),
        mostrar_biografia = COALESCE(NEW.showBio, mostrar_biografia),
        mostrar_localizacao = COALESCE(NEW.showLocation, mostrar_localizacao),
        mostrar_redes_sociais = COALESCE(NEW.showSocials, mostrar_redes_sociais),
        mostrar_estatisticas = COALESCE(NEW.showStats, mostrar_estatisticas),
        mostrar_cursos = COALESCE(NEW.showCourses, mostrar_cursos),
        mostrar_insignias = COALESCE(NEW.showBadges, mostrar_insignias),
        preferencia_tema = COALESCE(NEW.themePreference, preferencia_tema)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_profiles_delete INSTEAD OF DELETE ON profiles
    FOR EACH ROW BEGIN
      DELETE FROM perfis WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS categories AS
    SELECT id, nome AS name, slug, descricao AS description, icone AS icon
    FROM categorias;

    CREATE TRIGGER IF NOT EXISTS trg_categories_insert INSTEAD OF INSERT ON categories
    FOR EACH ROW BEGIN
      INSERT INTO categorias (id, nome, slug, descricao, icone)
      VALUES (NEW.id, NEW.name, NEW.slug, NEW.description, NEW.icon);
    END;

    CREATE VIEW IF NOT EXISTS courses AS
    SELECT
      id, titulo AS title, slug, descricao AS description, categoria AS category,
      dificuldade AS difficulty, url_miniatura AS thumbnailUrl, posicao_miniatura AS thumbnailPosition,
      url_banner AS bannerUrl, posicao_banner AS bannerPosition, preco AS price, e_gratuito AS isFree,
      e_publicado AS isPublished, estado_aprovacao AS approvalStatus, notas_admin AS adminNotes,
      submetido_para_revisao_em AS submittedForReviewAt, revisto_em AS reviewedAt,
      destaque AS featured, duracao_horas AS durationHours, idioma AS language,
      id_criador AS creatorId, id_espaco AS spaceId, modo_chamada_padrao AS defaultCallMode,
      permitir_partilha_ecra_aluno AS allowStudentScreenShare, permitir_camara_aluno AS allowStudentCamera,
      resultados_aprendizagem AS learningOutcomes, requisitos AS requirements, documentos AS documents,
      criado_em AS createdAt, atualizado_em AS updatedAt
    FROM cursos;

    CREATE TRIGGER IF NOT EXISTS trg_courses_insert INSTEAD OF INSERT ON courses
    FOR EACH ROW BEGIN
      INSERT INTO cursos (id, titulo, slug, descricao, categoria, dificuldade, url_miniatura, posicao_miniatura, url_banner, posicao_banner, preco, e_gratuito, e_publicado, estado_aprovacao, notas_admin, submetido_para_revisao_em, revisto_em, destaque, duracao_horas, idioma, id_criador, id_espaco, modo_chamada_padrao, permitir_partilha_ecra_aluno, permitir_camara_aluno, resultados_aprendizagem, requisitos, documentos, criado_em, atualizado_em)
      VALUES (NEW.id, NEW.title, NEW.slug, NEW.description, NEW.category, COALESCE(NEW.difficulty, 'Intermédio'), NEW.thumbnailUrl, COALESCE(NEW.thumbnailPosition, '50% 50%'), NEW.bannerUrl, COALESCE(NEW.bannerPosition, '50% 50%'), COALESCE(NEW.price, 0.0), COALESCE(NEW.isFree, 1), COALESCE(NEW.isPublished, 1), COALESCE(NEW.approvalStatus, 'APPROVED'), NEW.adminNotes, NEW.submittedForReviewAt, NEW.reviewedAt, COALESCE(NEW.featured, 0), COALESCE(NEW.durationHours, 10.0), COALESCE(NEW.language, 'Português'), NEW.creatorId, NEW.spaceId, COALESCE(NEW.defaultCallMode, 'open'), COALESCE(NEW.allowStudentScreenShare, 1), COALESCE(NEW.allowStudentCamera, 1), NEW.learningOutcomes, NEW.requirements, NEW.documents, NEW.createdAt, NEW.updatedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_courses_update INSTEAD OF UPDATE ON courses
    FOR EACH ROW BEGIN
      UPDATE cursos SET
        titulo = COALESCE(NEW.title, titulo),
        slug = COALESCE(NEW.slug, slug),
        descricao = COALESCE(NEW.description, descricao),
        categoria = COALESCE(NEW.category, categoria),
        dificuldade = COALESCE(NEW.difficulty, dificuldade),
        url_miniatura = COALESCE(NEW.thumbnailUrl, url_miniatura),
        posicao_miniatura = COALESCE(NEW.thumbnailPosition, posicao_miniatura),
        url_banner = COALESCE(NEW.bannerUrl, url_banner),
        posicao_banner = COALESCE(NEW.bannerPosition, posicao_banner),
        preco = COALESCE(NEW.price, preco),
        e_gratuito = COALESCE(NEW.isFree, e_gratuito),
        e_publicado = COALESCE(NEW.isPublished, e_publicado),
        estado_aprovacao = COALESCE(NEW.approvalStatus, estado_aprovacao),
        notas_admin = COALESCE(NEW.adminNotes, notas_admin),
        submetido_para_revisao_em = COALESCE(NEW.submittedForReviewAt, submetido_para_revisao_em),
        revisto_em = COALESCE(NEW.reviewedAt, revisto_em),
        destaque = COALESCE(NEW.featured, destaque),
        duracao_horas = COALESCE(NEW.durationHours, duracao_horas),
        idioma = COALESCE(NEW.language, idioma),
        id_criador = COALESCE(NEW.creatorId, id_criador),
        id_espaco = COALESCE(NEW.spaceId, id_espaco),
        modo_chamada_padrao = COALESCE(NEW.defaultCallMode, modo_chamada_padrao),
        permitir_partilha_ecra_aluno = COALESCE(NEW.allowStudentScreenShare, permitir_partilha_ecra_aluno),
        permitir_camara_aluno = COALESCE(NEW.allowStudentCamera, permitir_camara_aluno),
        resultados_aprendizagem = COALESCE(NEW.learningOutcomes, resultados_aprendizagem),
        requisitos = COALESCE(NEW.requirements, requisitos),
        documentos = COALESCE(NEW.documents, documentos),
        criado_em = COALESCE(NEW.createdAt, criado_em),
        atualizado_em = COALESCE(NEW.updatedAt, atualizado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_courses_delete INSTEAD OF DELETE ON courses
    FOR EACH ROW BEGIN
      DELETE FROM cursos WHERE id = OLD.id;
    END;

    DROP TRIGGER IF EXISTS trg_course_modules_insert;
    DROP TRIGGER IF EXISTS trg_course_modules_update;
    DROP VIEW IF EXISTS course_modules;
    CREATE VIEW course_modules AS
    SELECT id, id_curso AS courseId, titulo AS title, descricao AS description, indice_ordem AS orderIndex, COALESCE(modo_desbloqueio, 'instant') AS dripMode
    FROM modulos_curso;

    CREATE TRIGGER IF NOT EXISTS trg_course_modules_insert INSTEAD OF INSERT ON course_modules
    FOR EACH ROW BEGIN
      INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem, modo_desbloqueio)
      VALUES (NEW.id, NEW.courseId, NEW.title, NEW.description, COALESCE(NEW.orderIndex, 0), COALESCE(NEW.dripMode, 'instant'));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_course_modules_update INSTEAD OF UPDATE ON course_modules
    FOR EACH ROW BEGIN
      UPDATE modulos_curso SET
        id_curso = COALESCE(NEW.courseId, id_curso),
        titulo = COALESCE(NEW.title, titulo),
        descricao = COALESCE(NEW.description, descricao),
        indice_ordem = COALESCE(NEW.orderIndex, indice_ordem),
        modo_desbloqueio = COALESCE(NEW.dripMode, modo_desbloqueio)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_course_modules_delete INSTEAD OF DELETE ON course_modules
    FOR EACH ROW BEGIN
      DELETE FROM modulos_curso WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS lessons AS
    SELECT
      id, id_modulo AS moduleId, titulo AS title, tipo AS type, conteudo AS content,
      url_video AS videoUrl, duracao_minutos AS durationMin, indice_ordem AS orderIndex,
      recompensa_xp AS xpReward
    FROM aulas;

    CREATE TRIGGER IF NOT EXISTS trg_lessons_insert INSTEAD OF INSERT ON lessons
    FOR EACH ROW BEGIN
      INSERT INTO aulas (id, id_modulo, titulo, tipo, conteudo, url_video, duracao_minutos, indice_ordem, recompensa_xp)
      VALUES (NEW.id, NEW.moduleId, NEW.title, COALESCE(NEW.type, 'video'), NEW.content, NEW.videoUrl, COALESCE(NEW.durationMin, 15), COALESCE(NEW.orderIndex, 0), COALESCE(NEW.xpReward, 25));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_lessons_update INSTEAD OF UPDATE ON lessons
    FOR EACH ROW BEGIN
      UPDATE aulas SET
        id_modulo = COALESCE(NEW.moduleId, id_modulo),
        titulo = COALESCE(NEW.title, titulo),
        tipo = COALESCE(NEW.type, tipo),
        conteudo = COALESCE(NEW.content, conteudo),
        url_video = COALESCE(NEW.videoUrl, url_video),
        duracao_minutos = COALESCE(NEW.durationMin, duracao_minutos),
        indice_ordem = COALESCE(NEW.orderIndex, indice_ordem),
        recompensa_xp = COALESCE(NEW.xpReward, recompensa_xp)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_lessons_delete INSTEAD OF DELETE ON lessons
    FOR EACH ROW BEGIN
      DELETE FROM aulas WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS enrollments AS
    SELECT
      id, id_utilizador AS userId, id_curso AS courseId, inscrito_em AS enrolledAt,
      concluido_em AS completedAt, percentagem_progresso AS progressPercent,
      id_ultima_aula AS lastLessonId, esta_oculto AS isHidden
    FROM inscricoes;

    CREATE TRIGGER IF NOT EXISTS trg_enrollments_insert INSTEAD OF INSERT ON enrollments
    FOR EACH ROW BEGIN
      INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, concluido_em, percentagem_progresso, id_ultima_aula, esta_oculto)
      VALUES (NEW.id, NEW.userId, NEW.courseId, NEW.enrolledAt, NEW.completedAt, COALESCE(NEW.progressPercent, 0), NEW.lastLessonId, COALESCE(NEW.isHidden, 0));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_enrollments_update INSTEAD OF UPDATE ON enrollments
    FOR EACH ROW BEGIN
      UPDATE inscricoes SET
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        id_curso = COALESCE(NEW.courseId, id_curso),
        inscrito_em = COALESCE(NEW.enrolledAt, inscrito_em),
        concluido_em = COALESCE(NEW.completedAt, concluido_em),
        percentagem_progresso = COALESCE(NEW.progressPercent, percentagem_progresso),
        id_ultima_aula = COALESCE(NEW.lastLessonId, id_ultima_aula),
        esta_oculto = COALESCE(NEW.isHidden, esta_oculto)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_enrollments_delete INSTEAD OF DELETE ON enrollments
    FOR EACH ROW BEGIN
      DELETE FROM inscricoes WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS lesson_progress AS
    SELECT
      id, id_inscricao AS enrollmentId, id_aula AS lessonId,
      concluido AS completed, concluido_em AS completedAt,
      tempo_gasto_segundos AS timeSpentSeconds
    FROM progresso_aulas;

    CREATE TRIGGER IF NOT EXISTS trg_lesson_progress_insert INSTEAD OF INSERT ON lesson_progress
    FOR EACH ROW BEGIN
      INSERT INTO progresso_aulas (id, id_inscricao, id_aula, concluido, concluido_em, tempo_gasto_segundos)
      VALUES (NEW.id, NEW.enrollmentId, NEW.lessonId, COALESCE(NEW.completed, 0), NEW.completedAt, COALESCE(NEW.timeSpentSeconds, 0));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_lesson_progress_update INSTEAD OF UPDATE ON lesson_progress
    FOR EACH ROW BEGIN
      UPDATE progresso_aulas SET
        id_inscricao = COALESCE(NEW.enrollmentId, id_inscricao),
        id_aula = COALESCE(NEW.lessonId, id_aula),
        concluido = COALESCE(NEW.completed, concluido),
        concluido_em = COALESCE(NEW.completedAt, concluido_em),
        tempo_gasto_segundos = COALESCE(NEW.timeSpentSeconds, tempo_gasto_segundos)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_lesson_progress_delete INSTEAD OF DELETE ON lesson_progress
    FOR EACH ROW BEGIN
      DELETE FROM progresso_aulas WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS spaces AS
    SELECT
      id, nome AS name, slug, descricao AS description, url_icone AS iconUrl,
      url_banner AS bannerUrl, posicao_banner AS bannerPosition, e_privado AS isPrivate,
      categoria AS category, id_proprietario AS ownerId, total_membros AS memberCount,
      criado_em AS createdAt
    FROM espacos;

    CREATE TRIGGER IF NOT EXISTS trg_spaces_insert INSTEAD OF INSERT ON spaces
    FOR EACH ROW BEGIN
      INSERT INTO espacos (id, nome, slug, descricao, url_icone, url_banner, posicao_banner, e_privado, categoria, id_proprietario, total_membros, criado_em)
      VALUES (NEW.id, NEW.name, NEW.slug, NEW.description, NEW.iconUrl, NEW.bannerUrl, COALESCE(NEW.bannerPosition, '50% 50%'), COALESCE(NEW.isPrivate, 0), NEW.category, NEW.ownerId, COALESCE(NEW.memberCount, 1), NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_spaces_update INSTEAD OF UPDATE ON spaces
    FOR EACH ROW BEGIN
      UPDATE espacos SET
        nome = COALESCE(NEW.name, nome),
        slug = COALESCE(NEW.slug, slug),
        descricao = COALESCE(NEW.description, descricao),
        url_icone = COALESCE(NEW.iconUrl, url_icone),
        url_banner = COALESCE(NEW.bannerUrl, url_banner),
        posicao_banner = COALESCE(NEW.bannerPosition, posicao_banner),
        e_privado = COALESCE(NEW.isPrivate, e_privado),
        categoria = COALESCE(NEW.category, categoria),
        id_proprietario = COALESCE(NEW.ownerId, id_proprietario),
        total_membros = COALESCE(NEW.memberCount, total_membros),
        criado_em = COALESCE(NEW.createdAt, criado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_spaces_delete INSTEAD OF DELETE ON spaces
    FOR EACH ROW BEGIN
      DELETE FROM espacos WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS channels AS
    SELECT
      id, id_espaco AS spaceId, nome AS name, tipo AS type, topico AS topic,
      indice_ordem AS orderIndex, e_voz AS isVoice, esta_bloqueado AS isLocked,
      modo_acesso AS accessMode, modo_voz AS voiceMode, questao_orientadora AS guidingQuestion,
      diretrizes AS guidelines
    FROM canais;

    CREATE TRIGGER IF NOT EXISTS trg_channels_insert INSTEAD OF INSERT ON channels
    FOR EACH ROW BEGIN
      INSERT INTO canais (id, id_espaco, nome, tipo, topico, indice_ordem, e_voz, esta_bloqueado, modo_acesso, modo_voz, questao_orientadora, diretrizes)
      VALUES (NEW.id, NEW.spaceId, NEW.name, COALESCE(NEW.type, 'text'), NEW.topic, COALESCE(NEW.orderIndex, 0), COALESCE(NEW.isVoice, 0), COALESCE(NEW.isLocked, 0), COALESCE(NEW.accessMode, 'discussion'), COALESCE(NEW.voiceMode, 'open'), NEW.guidingQuestion, NEW.guidelines);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_channels_update INSTEAD OF UPDATE ON channels
    FOR EACH ROW BEGIN
      UPDATE canais SET
        id_espaco = COALESCE(NEW.spaceId, id_espaco),
        nome = COALESCE(NEW.name, nome),
        tipo = COALESCE(NEW.type, tipo),
        topico = COALESCE(NEW.topic, topico),
        indice_ordem = COALESCE(NEW.orderIndex, indice_ordem),
        e_voz = COALESCE(NEW.isVoice, e_voz),
        esta_bloqueado = COALESCE(NEW.isLocked, esta_bloqueado),
        modo_acesso = COALESCE(NEW.accessMode, modo_acesso),
        modo_voz = COALESCE(NEW.voiceMode, modo_voz),
        questao_orientadora = COALESCE(NEW.guidingQuestion, questao_orientadora),
        diretrizes = COALESCE(NEW.guidelines, diretrizes)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_channels_delete INSTEAD OF DELETE ON channels
    FOR EACH ROW BEGIN
      DELETE FROM canais WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS memberships AS
    SELECT id, id_utilizador AS userId, id_espaco AS spaceId, papel AS role, aderiu_em AS joinedAt
    FROM membros_espacos;

    CREATE TRIGGER IF NOT EXISTS trg_memberships_insert INSTEAD OF INSERT ON memberships
    FOR EACH ROW BEGIN
      INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em)
      VALUES (NEW.id, NEW.userId, NEW.spaceId, COALESCE(NEW.role, 'MEMBER'), NEW.joinedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_memberships_delete INSTEAD OF DELETE ON memberships
    FOR EACH ROW BEGIN
      DELETE FROM membros_espacos WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS messages AS
    SELECT
      id, id_canal AS channelId, id_utilizador AS userId, conteudo AS content,
      id_pai AS parentId, anexos AS attachments, esta_afixado AS isPinned,
      criado_em AS createdAt, atualizado_em AS updatedAt
    FROM mensagens;

    CREATE TRIGGER IF NOT EXISTS trg_messages_insert INSTEAD OF INSERT ON messages
    FOR EACH ROW BEGIN
      INSERT INTO mensagens (id, id_canal, id_utilizador, conteudo, id_pai, anexos, esta_afixado, criado_em, atualizado_em)
      VALUES (NEW.id, NEW.channelId, NEW.userId, NEW.content, NEW.parentId, NEW.attachments, COALESCE(NEW.isPinned, 0), NEW.createdAt, NEW.updatedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_messages_update INSTEAD OF UPDATE ON messages
    FOR EACH ROW BEGIN
      UPDATE mensagens SET
        id_canal = COALESCE(NEW.channelId, id_canal),
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        conteudo = COALESCE(NEW.content, conteudo),
        id_pai = COALESCE(NEW.parentId, id_pai),
        anexos = COALESCE(NEW.attachments, anexos),
        esta_afixado = COALESCE(NEW.isPinned, esta_afixado),
        criado_em = COALESCE(NEW.createdAt, criado_em),
        atualizado_em = COALESCE(NEW.updatedAt, atualizado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_messages_delete INSTEAD OF DELETE ON messages
    FOR EACH ROW BEGIN
      DELETE FROM mensagens WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS reviews AS
    SELECT id, id_curso AS courseId, id_utilizador AS userId, classificacao AS rating, comentario AS comment, criado_em AS createdAt
    FROM avaliacoes;

    CREATE TRIGGER IF NOT EXISTS trg_reviews_insert INSTEAD OF INSERT ON reviews
    FOR EACH ROW BEGIN
      INSERT INTO avaliacoes (id, id_curso, id_utilizador, classificacao, comentario, criado_em)
      VALUES (NEW.id, NEW.courseId, NEW.userId, NEW.rating, NEW.comment, NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_reviews_delete INSTEAD OF DELETE ON reviews
    FOR EACH ROW BEGIN
      DELETE FROM avaliacoes WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS quizzes AS
    SELECT id, id_aula AS lessonId, titulo AS title, descricao AS description, pontuacao_aprovacao AS passingScore, recompensa_xp AS xpReward
    FROM questionarios;

    CREATE TRIGGER IF NOT EXISTS trg_quizzes_insert INSTEAD OF INSERT ON quizzes
    FOR EACH ROW BEGIN
      INSERT INTO questionarios (id, id_aula, titulo, descricao, pontuacao_aprovacao, recompensa_xp)
      VALUES (NEW.id, NEW.lessonId, NEW.title, NEW.description, COALESCE(NEW.passingScore, 70), COALESCE(NEW.xpReward, 50));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_quizzes_update INSTEAD OF UPDATE ON quizzes
    FOR EACH ROW BEGIN
      UPDATE questionarios SET
        id_aula = COALESCE(NEW.lessonId, id_aula),
        titulo = COALESCE(NEW.title, titulo),
        descricao = NEW.description,
        pontuacao_aprovacao = COALESCE(NEW.passingScore, pontuacao_aprovacao),
        recompensa_xp = COALESCE(NEW.xpReward, recompensa_xp)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_quizzes_delete INSTEAD OF DELETE ON quizzes
    FOR EACH ROW BEGIN
      DELETE FROM questionarios WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS quiz_questions AS
    SELECT id, id_quiz AS quizId, pergunta AS question, opcoes AS options, indice_opcao_correta AS correctOptionIndex, explicacao AS explanation, indice_ordem AS orderIndex
    FROM perguntas_quiz;

    CREATE TRIGGER IF NOT EXISTS trg_quiz_questions_insert INSTEAD OF INSERT ON quiz_questions
    FOR EACH ROW BEGIN
      INSERT INTO perguntas_quiz (id, id_quiz, pergunta, opcoes, indice_opcao_correta, explicacao, indice_ordem)
      VALUES (NEW.id, NEW.quizId, NEW.question, NEW.options, NEW.correctOptionIndex, NEW.explanation, COALESCE(NEW.orderIndex, 0));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_quiz_questions_delete INSTEAD OF DELETE ON quiz_questions
    FOR EACH ROW BEGIN
      DELETE FROM perguntas_quiz WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS quiz_attempts AS
    SELECT id, id_quiz AS quizId, id_utilizador AS userId, pontuacao AS score, passou AS passed, tentado_em AS attemptedAt
    FROM tentativas_quiz;

    CREATE TRIGGER IF NOT EXISTS trg_quiz_attempts_insert INSTEAD OF INSERT ON quiz_attempts
    FOR EACH ROW BEGIN
      INSERT INTO tentativas_quiz (id, id_quiz, id_utilizador, pontuacao, passou, tentado_em)
      VALUES (NEW.id, NEW.quizId, NEW.userId, NEW.score, NEW.passed, NEW.attemptedAt);
    END;

    CREATE VIEW IF NOT EXISTS certificates AS
    SELECT id, id_utilizador AS userId, id_curso AS courseId, nome_destinatario AS recipientName, titulo_curso AS courseTitle, id_credencial AS credentialId, emitido_em AS issuedAt, pontuacao AS score
    FROM certificados;

    CREATE TRIGGER IF NOT EXISTS trg_certificates_insert INSTEAD OF INSERT ON certificates
    FOR EACH ROW BEGIN
      INSERT INTO certificados (id, id_utilizador, id_curso, nome_destinatario, titulo_curso, id_credencial, emitido_em, pontuacao)
      VALUES (NEW.id, NEW.userId, NEW.courseId, NEW.recipientName, NEW.courseTitle, NEW.credentialId, NEW.issuedAt, COALESCE(NEW.score, 100));
    END;

    CREATE VIEW IF NOT EXISTS notes AS
    SELECT id, id_utilizador AS userId, id_aula AS lessonId, conteudo AS content, criado_em AS createdAt, atualizado_em AS updatedAt
    FROM notas;

    CREATE TRIGGER IF NOT EXISTS trg_notes_insert INSTEAD OF INSERT ON notes
    FOR EACH ROW BEGIN
      INSERT INTO notas (id, id_utilizador, id_aula, conteudo, criado_em, atualizado_em)
      VALUES (NEW.id, NEW.userId, NEW.lessonId, NEW.content, NEW.createdAt, NEW.updatedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_notes_update INSTEAD OF UPDATE ON notes
    FOR EACH ROW BEGIN
      UPDATE notas SET
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        id_aula = COALESCE(NEW.lessonId, id_aula),
        conteudo = COALESCE(NEW.content, conteudo),
        criado_em = COALESCE(NEW.createdAt, criado_em),
        atualizado_em = COALESCE(NEW.updatedAt, atualizado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_notes_delete INSTEAD OF DELETE ON notes
    FOR EACH ROW BEGIN
      DELETE FROM notas WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS notifications AS
    SELECT id, id_utilizador AS userId, tipo AS type, titulo AS title, conteudo AS content, ligacao AS link, esta_lida AS isRead, criado_em AS createdAt
    FROM notificacoes;

    CREATE TRIGGER IF NOT EXISTS trg_notifications_insert INSTEAD OF INSERT ON notifications
    FOR EACH ROW BEGIN
      INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
      VALUES (NEW.id, NEW.userId, NEW.type, NEW.title, NEW.content, NEW.link, COALESCE(NEW.isRead, 0), NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_notifications_update INSTEAD OF UPDATE ON notifications
    FOR EACH ROW BEGIN
      UPDATE notificacoes SET
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        tipo = COALESCE(NEW.type, tipo),
        titulo = COALESCE(NEW.title, titulo),
        conteudo = COALESCE(NEW.content, conteudo),
        ligacao = COALESCE(NEW.link, ligacao),
        esta_lida = COALESCE(NEW.isRead, esta_lida),
        criado_em = COALESCE(NEW.createdAt, criado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_notifications_delete INSTEAD OF DELETE ON notifications
    FOR EACH ROW BEGIN
      DELETE FROM notificacoes WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS friendships AS
    SELECT id, id_solicitante AS requesterId, id_destinatario AS addresseeId, estado AS status, criado_em AS createdAt, atualizado_em AS updatedAt
    FROM amizades;

    CREATE TRIGGER IF NOT EXISTS trg_friendships_insert INSTEAD OF INSERT ON friendships
    FOR EACH ROW BEGIN
      INSERT INTO amizades (id, id_solicitante, id_destinatario, estado, criado_em, atualizado_em)
      VALUES (NEW.id, NEW.requesterId, NEW.addresseeId, COALESCE(NEW.status, 'PENDING'), NEW.createdAt, NEW.updatedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_friendships_update INSTEAD OF UPDATE ON friendships
    FOR EACH ROW BEGIN
      UPDATE amizades SET
        id_solicitante = COALESCE(NEW.requesterId, id_solicitante),
        id_destinatario = COALESCE(NEW.addresseeId, id_destinatario),
        estado = COALESCE(NEW.status, estado),
        criado_em = COALESCE(NEW.createdAt, criado_em),
        atualizado_em = COALESCE(NEW.updatedAt, atualizado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_friendships_delete INSTEAD OF DELETE ON friendships
    FOR EACH ROW BEGIN
      DELETE FROM amizades WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS follows AS
    SELECT id, id_seguidor AS followerId, id_a_seguir AS followingId, criado_em AS createdAt
    FROM seguidores;

    CREATE TRIGGER IF NOT EXISTS trg_follows_insert INSTEAD OF INSERT ON follows
    FOR EACH ROW BEGIN
      INSERT INTO seguidores (id, id_seguidor, id_a_seguir, criado_em)
      VALUES (NEW.id, NEW.followerId, NEW.followingId, NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_follows_delete INSTEAD OF DELETE ON follows
    FOR EACH ROW BEGIN
      DELETE FROM seguidores WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS direct_messages AS
    SELECT id, id_remetente AS senderId, id_destinatario AS receiverId, conteudo AS content, esta_lida AS isRead, criado_em AS createdAt
    FROM mensagens_diretas;

    CREATE TRIGGER IF NOT EXISTS trg_direct_messages_insert INSTEAD OF INSERT ON direct_messages
    FOR EACH ROW BEGIN
      INSERT INTO mensagens_diretas (id, id_remetente, id_destinatario, conteudo, esta_lida, criado_em)
      VALUES (NEW.id, NEW.senderId, NEW.receiverId, NEW.content, COALESCE(NEW.isRead, 0), NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_direct_messages_update INSTEAD OF UPDATE ON direct_messages
    FOR EACH ROW BEGIN
      UPDATE mensagens_diretas SET
        id_remetente = COALESCE(NEW.senderId, id_remetente),
        id_destinatario = COALESCE(NEW.receiverId, id_destinatario),
        conteudo = COALESCE(NEW.content, conteudo),
        esta_lida = COALESCE(NEW.isRead, esta_lida),
        criado_em = COALESCE(NEW.createdAt, criado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_direct_messages_delete INSTEAD OF DELETE ON direct_messages
    FOR EACH ROW BEGIN
      DELETE FROM mensagens_diretas WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS course_collaborators AS
    SELECT 
      cc.id,
      cc.id_curso AS courseId,
      cc.id_utilizador AS userId,
      cc.criado_em AS createdAt,
      u.nome AS name,
      u.email AS email,
      u.nome_utilizador AS username,
      u.url_avatar AS avatarUrl,
      u.papel AS role
    FROM colaboradores_curso cc
    JOIN utilizadores u ON cc.id_utilizador = u.id;

    CREATE TRIGGER IF NOT EXISTS trg_course_collaborators_insert INSTEAD OF INSERT ON course_collaborators
    FOR EACH ROW BEGIN
      INSERT INTO colaboradores_curso (id, id_curso, id_utilizador, criado_em)
      VALUES (NEW.id, NEW.courseId, NEW.userId, NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_course_collaborators_delete INSTEAD OF DELETE ON course_collaborators
    FOR EACH ROW BEGIN
      DELETE FROM colaboradores_curso WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS creator_applications AS
    SELECT id, id_utilizador AS userId, nome_completo AS fullName, biografia AS bio, especialidade AS expertise, anos_experiencia AS experienceYears, url_portfolio AS portfolioUrl, motivacao AS motivation, cursos_propostos AS proposedCourses, url_video_amostra AS sampleVideoUrl, estado AS status, parecer_admin AS adminFeedback, revisto_por AS reviewedBy, revisto_em AS reviewedAt, criado_em AS createdAt, atualizado_em AS updatedAt
    FROM candidaturas_criador;

    CREATE TRIGGER IF NOT EXISTS trg_creator_applications_insert INSTEAD OF INSERT ON creator_applications
    FOR EACH ROW BEGIN
      INSERT INTO candidaturas_criador (id, id_utilizador, nome_completo, biografia, especialidade, anos_experiencia, url_portfolio, motivacao, cursos_propostos, url_video_amostra, estado, parecer_admin, revisto_por, revisto_em, criado_em, atualizado_em)
      VALUES (NEW.id, NEW.userId, NEW.fullName, NEW.bio, NEW.expertise, COALESCE(NEW.experienceYears, 0), NEW.portfolioUrl, NEW.motivation, NEW.proposedCourses, NEW.sampleVideoUrl, COALESCE(NEW.status, 'PENDING'), NEW.adminFeedback, NEW.reviewedBy, NEW.reviewedAt, NEW.createdAt, NEW.updatedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_creator_applications_update INSTEAD OF UPDATE ON creator_applications
    FOR EACH ROW BEGIN
      UPDATE candidaturas_criador SET
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        nome_completo = COALESCE(NEW.fullName, nome_completo),
        biografia = COALESCE(NEW.bio, biografia),
        especialidade = COALESCE(NEW.expertise, especialidade),
        anos_experiencia = COALESCE(NEW.experienceYears, anos_experiencia),
        url_portfolio = COALESCE(NEW.portfolioUrl, url_portfolio),
        motivacao = COALESCE(NEW.motivation, motivacao),
        cursos_propostos = COALESCE(NEW.proposedCourses, cursos_propostos),
        url_video_amostra = COALESCE(NEW.sampleVideoUrl, url_video_amostra),
        estado = COALESCE(NEW.status, estado),
        parecer_admin = COALESCE(NEW.adminFeedback, parecer_admin),
        revisto_por = COALESCE(NEW.reviewedBy, revisto_por),
        revisto_em = COALESCE(NEW.reviewedAt, revisto_em),
        criado_em = COALESCE(NEW.createdAt, criado_em),
        atualizado_em = COALESCE(NEW.updatedAt, atualizado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_creator_applications_delete INSTEAD OF DELETE ON creator_applications
    FOR EACH ROW BEGIN
      DELETE FROM candidaturas_criador WHERE id = OLD.id;
    END;
  `);

  const userColumns = db.prepare('PRAGMA table_info(utilizadores)').all();
  if (!userColumns.some((c) => c.name === 'versao_sessao'))
    db.exec('ALTER TABLE utilizadores ADD COLUMN versao_sessao INTEGER NOT NULL DEFAULT 0');
  const userCount = db.prepare('SELECT COUNT(*) as count FROM utilizadores').get().count;
  if (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_DATA === 'true') {
    if (userCount === 0) seedData(db);
    seedDemoShowcaseData(db);
  }
}

function seedData(db) {
  const passwordHash = bcrypt.hashSync('password123', 10);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, url_avatar, biografia, localizacao, meta_diaria_minutos, minutos_hoje, minutos_totais, esta_suspenso, criado_em, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProfile = db.prepare(`
    INSERT INTO perfis (id, id_utilizador, titulo_perfil, website, github, twitter, linkedin, e_publico, mostrar_classificacao, preferencia_tema)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'light')
  `);

  const insertCategory = db.prepare(`
    INSERT INTO categorias (id, nome, slug, descricao, icone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertCourse = db.prepare(`
    INSERT INTO cursos (id, titulo, slug, descricao, categoria, dificuldade, url_miniatura, url_banner, preco, e_gratuito, e_publicado, estado_aprovacao, notas_admin, destaque, duracao_horas, idioma, id_criador, id_espaco, criado_em, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertModule = db.prepare(`
    INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertLesson = db.prepare(`
    INSERT INTO aulas (id, id_modulo, titulo, tipo, conteudo, url_video, duracao_minutos, indice_ordem, recompensa_xp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSpace = db.prepare(`
    INSERT INTO espacos (id, nome, slug, descricao, url_icone, url_banner, e_privado, categoria, id_proprietario, total_membros, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChannel = db.prepare(`
    INSERT INTO canais (id, id_espaco, nome, tipo, topico, indice_ordem, e_voz, esta_bloqueado, questao_orientadora, diretrizes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMembership = db.prepare(`
    INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertEnrollment = db.prepare(`
    INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso, id_ultima_aula)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuiz = db.prepare(`
    INSERT INTO questionarios (id, id_aula, titulo, descricao, pontuacao_aprovacao, recompensa_xp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertQuizQuestion = db.prepare(`
    INSERT INTO perguntas_quiz (id, id_quiz, pergunta, opcoes, indice_opcao_correta, explicacao, indice_ordem)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertApplication = db.prepare(`
    INSERT INTO candidaturas_criador (id, id_utilizador, nome_completo, biografia, especialidade, anos_experiencia, url_portfolio, motivacao, cursos_propostos, url_video_amostra, estado, parecer_admin, criado_em, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    // 1. UTILIZADORES
    insertUser.run(
      'user-student',
      'aluno@nexo.pt',
      'aluno',
      passwordHash,
      'Pedro Silva',
      'STUDENT',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'Estudante de programação web interessado em React, TypeScript e desenvolvimento full-stack.',
      'Viana do Castelo, Portugal',
      45,
      35,
      1450,
      0,
      now,
      now,
    );
    insertProfile.run(
      'prof-student',
      'user-student',
      'Estudante de Programação Web',
      'https://nexo.pt',
      'https://github.com/pedrosilva',
      '',
      '',
    );

    insertUser.run(
      'user-sarah',
      'mariana@nexo.pt',
      'mariana_costa',
      passwordHash,
      'Mariana Costa',
      'CREATOR',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      'Programadora e formadora na área de desenvolvimento frontend com React, TypeScript e UI/UX.',
      'Porto, Portugal',
      90,
      85,
      8900,
      0,
      now,
      now,
    );
    insertProfile.run(
      'prof-sarah',
      'user-sarah',
      'Formadora de Desenvolvimento Web',
      '',
      'https://github.com/marianacosta',
      '',
      '',
    );

    insertUser.run(
      'user-alex',
      'admin@nexo.pt',
      'rui_admin',
      passwordHash,
      'Rui Oliveira',
      'ADMIN',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'Responsável pela administração e moderação da plataforma NEXO.',
      'Braga, Portugal',
      120,
      120,
      25400,
      0,
      now,
      now,
    );
    insertProfile.run(
      'prof-alex',
      'user-alex',
      'Administrador da Plataforma',
      '',
      'https://github.com/ruioliveira',
      '',
      '',
    );

    insertUser.run(
      'user-tiago',
      'tiago@nexo.pt',
      'tiago_sec',
      passwordHash,
      'Tiago Ramos',
      'STUDENT',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      'Técnico de redes e entusiasta de cibersegurança e administração de sistemas.',
      'Coimbra, Portugal',
      60,
      20,
      820,
      0,
      now,
      now,
    );
    insertProfile.run(
      'prof-tiago',
      'user-tiago',
      'Técnico de Redes e Segurança',
      '',
      'https://github.com/tiagoramos',
      '',
      '',
    );

    // 2. CANDIDATURA A CRIADOR
    insertApplication.run(
      'app-tiago-1',
      'user-tiago',
      'Tiago Ramos',
      'Técnico de redes e cibersegurança com 6 anos de experiência na área de administração de sistemas Linux e auditoria web.',
      'Cibersegurança e Redes',
      6,
      'https://github.com/tiagoramos-sec',
      'Gostava de publicar cursos práticos sobre redes e segurança informática para ajudar outros estudantes da plataforma.',
      '1. Introdução à Cibersegurança e Redes\n2. Segurança em Aplicações Web',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'PENDING',
      null,
      now,
      now,
    );

    // 3. CATEGORIAS
    insertCategory.run(
      'cat-prog',
      'Programação e Engenharia de Software',
      'programming',
      'Desenvolvimento web, APIs REST, JavaScript, TypeScript e bases de dados.',
      'Code',
    );
    insertCategory.run(
      'cat-design',
      'Design e Interfaces (UI/UX)',
      'design',
      'Prototipagem no Figma, criação de interfaces e usabilidade.',
      'Palette',
    );
    insertCategory.run(
      'cat-ai',
      'Inteligência Artificial e Dados',
      'ai',
      'Introdução a Machine Learning, Python e análise de dados.',
      'Cpu',
    );
    insertCategory.run(
      'cat-sec',
      'Cibersegurança e Redes',
      'cybersecurity',
      'Segurança de redes, Linux e boas práticas em aplicações web.',
      'ShieldCheck',
    );
    insertCategory.run(
      'cat-cloud',
      'Cloud, DevOps e Servidores',
      'cloud',
      'Docker, servidores Linux e publicação de aplicações.',
      'Server',
    );

    // 4. ESPAÇOS DA COMUNIDADE E CANAIS
    insertSpace.run(
      'space-react',
      'Comunidade React e Programação Web',
      'comunidade-react-portugal',
      'Espaço para tirar dúvidas sobre as aulas, partilhar código e estudar em grupo nos canais de voz.',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      0,
      'programming',
      'user-sarah',
      142,
      now,
    );

    insertChannel.run(
      'ch-general',
      'space-react',
      'geral',
      'text',
      'Conversa geral sobre programação e os cursos da plataforma',
      0,
      0,
      0,
      'O que estás a estudar esta semana?',
      'Mantém o respeito pelos colegas.',
    );
    insertChannel.run(
      'ch-qa',
      'space-react',
      'duvidas-exercicios',
      'text',
      'Canal para colocar dúvidas sobre as aulas e exercícios',
      1,
      0,
      0,
      'Qual é o erro ou dúvida que tens?',
      'Partilha o código ou print do erro para ser mais fácil ajudar.',
    );
    insertChannel.run(
      'ch-showcase',
      'space-react',
      'projetos-alunos',
      'text',
      'Mostra os teus trabalhos e projetos aos outros colegas',
      2,
      0,
      0,
      'Que tecnologias usaste neste projeto?',
      'Podes deixar o link do GitHub.',
    );
    insertChannel.run(
      'ch-voice-1',
      'space-react',
      'Sala de Estudo 01 (Voz / Vídeo)',
      'voice',
      'Sala de voz para estudar em grupo e partilhar ecrã',
      3,
      1,
      0,
      'Que matéria estão a rever?',
      'Desliga o microfone quando não estiveres a falar.',
    );

    insertSpace.run(
      'space-ui-ux',
      'Comunidade Design e UI/UX',
      'comunidade-design-systems',
      'Espaço para partilha de protótipos no Figma, dicas de CSS e revisão de interfaces.',
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      0,
      'design',
      'user-sarah',
      98,
      now,
    );

    insertChannel.run(
      'ch-uiux-general',
      'space-ui-ux',
      'geral-design',
      'text',
      'Conversas sobre UI/UX, Figma e CSS',
      0,
      0,
      0,
      'Que ferramentas de design costumas usar?',
      'Respeita o trabalho dos colegas.',
    );
    insertChannel.run(
      'ch-uiux-feedback',
      'space-ui-ux',
      'feedback-interfaces',
      'text',
      'Pede opiniões e sugestões sobre os teus layouts',
      1,
      0,
      0,
      'Para que tipo de aplicação é este ecrã?',
      'Deixa feedback construtivo.',
    );
    insertChannel.run(
      'ch-uiux-showcase',
      'space-ui-ux',
      'prototipos',
      'text',
      'Partilha de protótipos e componentes',
      2,
      0,
      0,
      'Que funcionalidade desenhaste?',
      'Podes incluir o link do Figma.',
    );
    insertChannel.run(
      'ch-uiux-voice',
      'space-ui-ux',
      'Sala de Design (Voz / Vídeo)',
      'voice',
      'Sessões de estudo em grupo com partilha de ecrã',
      3,
      1,
      0,
      'Em que projeto estão a trabalhar?',
      '',
    );

    insertSpace.run(
      'space-cloud-devops',
      'Comunidade DevOps e Servidores',
      'comunidade-cloud-devops',
      'Grupo dedicado a Linux, Docker, bases de dados e publicação de projetos web.',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      0,
      'cloud',
      'user-sarah',
      76,
      now,
    );

    insertChannel.run(
      'ch-cloud-general',
      'space-cloud-devops',
      'geral-cloud',
      'text',
      'Dúvidas e conversa sobre Docker, Linux e servidores',
      0,
      0,
      0,
      'Onde costumas alojar os teus projetos?',
      'Nunca partilhes ficheiros .env ou chaves privadas.',
    );
    insertChannel.run(
      'ch-cloud-qa',
      'space-cloud-devops',
      'ajuda-docker',
      'text',
      'Ajuda com configuração de contentores e bases de dados',
      1,
      0,
      0,
      'Qual é a mensagem de erro no terminal?',
      'Usa blocos de código para os logs.',
    );
    insertChannel.run(
      'ch-cloud-labs',
      'space-cloud-devops',
      'tutoriais-e-dicas',
      'text',
      'Partilha de comandos úteis e configurações',
      2,
      0,
      0,
      '',
      '',
    );
    insertChannel.run(
      'ch-cloud-voice',
      'space-cloud-devops',
      'Sala DevOps (Voz / Vídeo)',
      'voice',
      'Sala de voz para resolver problemas em conjunto',
      3,
      1,
      0,
      '',
      '',
    );

    insertSpace.run(
      'space-ai-applied',
      'Comunidade Python e Dados',
      'comunidade-ia-aplicada',
      'Espaço para estudantes interessados em Python, análise de dados e inteligência artificial.',
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
      0,
      'ai',
      'user-sarah',
      115,
      now,
    );

    insertChannel.run(
      'ch-ai-general',
      'space-ai-applied',
      'geral-python',
      'text',
      'Conversas sobre Python, bibliotecas e projetos de dados',
      0,
      0,
      0,
      '',
      '',
    );
    insertChannel.run(
      'ch-ai-prompts',
      'space-ai-applied',
      'duvidas-python',
      'text',
      'Ajuda com exercícios e scripts em Python',
      1,
      0,
      0,
      '',
      '',
    );
    insertChannel.run(
      'ch-ai-projects',
      'space-ai-applied',
      'projetos-dados',
      'text',
      'Partilha de notebooks e pequenos projetos',
      2,
      0,
      0,
      '',
      '',
    );
    insertChannel.run(
      'ch-ai-voice',
      'space-ai-applied',
      'Sala de Estudo Python (Voz)',
      'voice',
      'Estudo em grupo e resolução de exercícios',
      3,
      1,
      0,
      '',
      '',
    );

    // Relações de Membros
    ['space-react', 'space-ui-ux', 'space-cloud-devops', 'space-ai-applied'].forEach(
      (spId, idx) => {
        insertMembership.run(`mem-sarah-${idx}`, 'user-sarah', spId, 'OWNER', now);
        insertMembership.run(`mem-student-${idx}`, 'user-student', spId, 'MEMBER', now);
        insertMembership.run(`mem-alex-${idx}`, 'user-alex', spId, 'ADMIN', now);
        insertMembership.run(`mem-tiago-${idx}`, 'user-tiago', spId, 'MEMBER', now);
      },
    );

    // 5. CURSOS INICIAIS
    insertCourse.run(
      'course-react-ts',
      'Desenvolvimento Web com React e TypeScript',
      'react-19-typescript-alta-performance',
      'Curso prático sobre criação de aplicações web com React e TypeScript: componentes, estado, hooks, chamadas a APIs e organização de projetos.',
      'programming',
      'Intermédio',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      0.0,
      1,
      1,
      'APPROVED',
      'Curso aprovado pela administração.',
      1,
      14.5,
      'Português',
      'user-sarah',
      'space-react',
      now,
      now,
    );

    insertModule.run(
      'mod-1',
      'course-react-ts',
      'Módulo 1: Introdução ao React com TypeScript',
      'Configuração do projeto com Vite e criação dos primeiros componentes tipados.',
      0,
    );
    insertLesson.run(
      'les-1',
      'mod-1',
      '1.1 Configuração do Projeto com Vite e TypeScript',
      'video',
      'Nesta aula criamos o projeto base com Vite e revemos a estrutura de pastas.',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      12,
      0,
      30,
    );
    insertLesson.run(
      'les-2',
      'mod-1',
      '1.2 Tipagem de Props e Hooks (useState e useEffect)',
      'video',
      'Como definir tipos para as propriedades dos componentes e estados mais comuns.',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      18,
      1,
      35,
    );
    insertLesson.run(
      'les-3',
      'mod-1',
      '1.3 Questionário de Revisão',
      'quiz',
      'Pequeno teste para rever a matéria deste módulo.',
      '',
      10,
      2,
      50,
    );

    insertQuiz.run(
      'quiz-1',
      'les-3',
      'Questionário: Fundamentos de React com TypeScript',
      'Responde às duas questões sobre tipagem de componentes.',
      70,
      50,
    );
    insertQuizQuestion.run(
      'qq-1',
      'quiz-1',
      'Qual é a forma recomendada de tipar as props de um componente funcional em React?',
      JSON.stringify([
        'Criar uma interface ou type para as props',
        'Usar sempre o tipo "any"',
        'Não definir tipos',
        'Usar apenas variáveis globais',
      ]),
      0,
      'Definir uma interface ou type ajuda a detetar erros nas propriedades passadas ao componente.',
      0,
    );
    insertQuizQuestion.run(
      'qq-2',
      'quiz-1',
      'Para que serve o modo strict do TypeScript num projeto React?',
      JSON.stringify([
        'Detetar erros de tipos e valores nulos antes de correr o código',
        'Aumentar a velocidade da internet',
        'Aplicar estilos CSS automaticamente',
        'Ignorar erros de compilação',
      ]),
      0,
      'O modo estrito avisa durante o desenvolvimento quando tentamos aceder a propriedades que podem ser undefined.',
      1,
    );

    insertCourse.run(
      'course-ui-ux',
      'Introdução ao Figma e Design de Interfaces',
      'design-systems-interfaces-cinematicas-figma',
      'Aprende a desenhar interfaces web e mobile no Figma, organizar componentes reutilizáveis, paletas de cores e protótipos navegáveis.',
      'design',
      'Intermédio',
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      29.0,
      0,
      1,
      'APPROVED',
      'Aprovado pelo Administrador.',
      1,
      14.0,
      'Português',
      'user-sarah',
      'space-ui-ux',
      now,
      now,
    );

    insertModule.run(
      'mod-design-1',
      'course-ui-ux',
      'Módulo 1: Componentes e Estilos no Figma',
      'Organização de cores, tipografia, grelhas e auto-layout.',
      0,
    );
    insertLesson.run(
      'les-design-1',
      'mod-design-1',
      '1.1 Criação de Estilos e Componentes Base',
      'video',
      'Como configurar estilos de texto e cor no Figma para reutilizar nas páginas do projeto.',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      15,
      0,
      30,
    );

    insertCourse.run(
      'course-cloud-devops',
      'Introdução ao Docker e Publicação de Aplicações',
      'devops-moderno-docker-arquitetura-cloud',
      'Como criar contentores com Docker, usar o docker-compose para ligar backend e base de dados, e publicar projetos web.',
      'cloud',
      'Intermédio',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      39.0,
      0,
      1,
      'APPROVED',
      'Aprovado pelo Administrador.',
      0,
      20.0,
      'Português',
      'user-sarah',
      'space-cloud-devops',
      now,
      now,
    );

    insertCourse.run(
      'course-ai-pending',
      'Introdução a Python e Análise de Dados',
      'inteligencia-artificial-aplicada-engenharia-prompts',
      'Curso em fase de revisão sobre fundamentos de Python, manipulação de ficheiros e introdução à análise de dados.',
      'ai',
      'Iniciante',
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
      45.0,
      0,
      0,
      'PENDING',
      'Submetido pelo formador para aprovação do Administrador.',
      0,
      16.0,
      'Português',
      'user-sarah',
      'space-ai-applied',
      now,
      now,
    );

    insertModule.run(
      'mod-ai-1',
      'course-ai-pending',
      'Módulo 1: Primeiros Passos com Python',
      'Instalação do Python e estruturas de dados básicas.',
      0,
    );
    insertLesson.run(
      'les-ai-1',
      'mod-ai-1',
      '1.1 Ambiente de Trabalho e Primeiros Scripts',
      'video',
      'Como instalar o Python e correr os primeiros programas no terminal.',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      16,
      0,
      30,
    );

    // 6. INSCRIÇÃO INICIAL
    insertEnrollment.run('enr-1', 'user-student', 'course-react-ts', now, 68.0, 'les-2');

    // 7. NOTIFICAÇÕES
    insertNotification.run(
      'notif-1',
      'user-student',
      'welcome',
      'Bem-vindo ao NEXO!',
      'Explora o catálogo de cursos e experimenta os canais da comunidade.',
      '/explore',
      0,
      now,
    );
    insertNotification.run(
      'notif-admin',
      'user-alex',
      'admin',
      'Nova Candidatura a Formador',
      'O utilizador Tiago Ramos submeteu uma candidatura para ser Formador.',
      '/admin',
      0,
      now,
    );

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
