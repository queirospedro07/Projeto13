import bcrypt from 'bcryptjs';
import { seedDemoShowcaseData } from './demoSeed.js';

export function initializeSchemaAndSeed(db) {
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
      dias_sequencia INTEGER NOT NULL DEFAULT 0,
      data_ultima_atividade TEXT,
      meta_diaria_minutos INTEGER NOT NULL DEFAULT 45,
      minutos_hoje INTEGER NOT NULL DEFAULT 0,
      minutos_totais INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      nivel INTEGER NOT NULL DEFAULT 1,
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
      instagram TEXT,
      youtube TEXT,
      tiktok TEXT,
      discord TEXT,
      twitch TEXT,
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

    CREATE TABLE IF NOT EXISTS reacoes (
      id TEXT PRIMARY KEY,
      id_mensagem TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      emoji TEXT NOT NULL,
      FOREIGN KEY(id_mensagem) REFERENCES mensagens(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      UNIQUE(id_mensagem, id_utilizador, emoji)
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

    CREATE TABLE IF NOT EXISTS quizzes (
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
      FOREIGN KEY(id_quiz) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tentativas_quiz (
      id TEXT PRIMARY KEY,
      id_quiz TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      pontuacao INTEGER NOT NULL,
      passou INTEGER NOT NULL,
      tentado_em TEXT NOT NULL,
      FOREIGN KEY(id_quiz) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conquistas (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      icone TEXT NOT NULL,
      categoria TEXT NOT NULL,
      raridade TEXT NOT NULL,
      recompensa_xp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conquistas_utilizadores (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      id_conquista TEXT NOT NULL,
      desbloqueado_em TEXT NOT NULL,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_conquista) REFERENCES conquistas(id) ON DELETE CASCADE,
      UNIQUE(id_utilizador, id_conquista)
    );

    CREATE TABLE IF NOT EXISTS transacoes_xp (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      acao TEXT NOT NULL,
      descricao TEXT NOT NULL,
      criado_em TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS perguntas_qa (
      id TEXT PRIMARY KEY,
      id_curso TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      titulo TEXT NOT NULL,
      corpo TEXT NOT NULL,
      esta_respondida INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS respostas_qa (
      id TEXT PRIMARY KEY,
      id_pergunta TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      corpo TEXT NOT NULL,
      esta_aceite INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_pergunta) REFERENCES perguntas_qa(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
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

    CREATE TABLE IF NOT EXISTS cargos_curso (
      id TEXT PRIMARY KEY,
      id_curso TEXT NOT NULL,
      nome TEXT NOT NULL,
      cor TEXT NOT NULL DEFAULT 'indigo',
      pode_publicar_anuncios INTEGER NOT NULL DEFAULT 0,
      pode_falar_palco INTEGER NOT NULL DEFAULT 0,
      pode_partilhar_ecra INTEGER NOT NULL DEFAULT 0,
      pode_moderar_chat INTEGER NOT NULL DEFAULT 0,
      pode_gerir_voz INTEGER NOT NULL DEFAULT 0,
      indice_ordem INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_curso) REFERENCES cursos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cargos_membros_curso (
      id TEXT PRIMARY KEY,
      id_curso TEXT NOT NULL,
      id_utilizador TEXT NOT NULL,
      id_cargo TEXT NOT NULL,
      atribuido_em TEXT NOT NULL,
      FOREIGN KEY(id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_cargo) REFERENCES cargos_curso(id) ON DELETE CASCADE,
      UNIQUE(id_curso, id_utilizador, id_cargo)
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

    CREATE TABLE IF NOT EXISTS candidaturas_admin (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      nome_completo TEXT NOT NULL,
      email TEXT NOT NULL,
      motivacao TEXT NOT NULL,
      experiencia TEXT NOT NULL,
      horas_disponibilidade_semanal INTEGER NOT NULL DEFAULT 10,
      areas_interesse TEXT NOT NULL,
      cenario_situacao TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PENDING',
      parecer_admin TEXT,
      revisto_por TEXT,
      revisto_em TEXT,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pedidos_suporte (
      id TEXT PRIMARY KEY,
      id_utilizador TEXT NOT NULL,
      assunto TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'Dúvidas Gerais',
      prioridade TEXT NOT NULL DEFAULT 'MÉDIA',
      estado TEXT NOT NULL DEFAULT 'ABERTO',
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL,
      resolvido_em TEXT,
      id_admin_atribuido TEXT,
      FOREIGN KEY(id_utilizador) REFERENCES utilizadores(id) ON DELETE CASCADE,
      FOREIGN KEY(id_admin_atribuido) REFERENCES utilizadores(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS mensagens_suporte (
      id TEXT PRIMARY KEY,
      id_pedido TEXT NOT NULL,
      id_remetente TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      e_resposta_admin INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(id_pedido) REFERENCES pedidos_suporte(id) ON DELETE CASCADE,
      FOREIGN KEY(id_remetente) REFERENCES utilizadores(id) ON DELETE CASCADE
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
    CREATE INDEX IF NOT EXISTS idx_candidaturas_admin_utilizador ON candidaturas_admin(id_utilizador);
    CREATE INDEX IF NOT EXISTS idx_candidaturas_admin_estado ON candidaturas_admin(estado);
    CREATE INDEX IF NOT EXISTS idx_pedidos_suporte_utilizador ON pedidos_suporte(id_utilizador);
    CREATE INDEX IF NOT EXISTS idx_pedidos_suporte_estado ON pedidos_suporte(estado);
    CREATE INDEX IF NOT EXISTS idx_mensagens_suporte_pedido ON mensagens_suporte(id_pedido);
  `);

  // 2. VISTAS E GATILHOS (VIEWS & INSTEAD OF TRIGGERS) PARA TOTAL COMPATIBILIDADE BIDIRECIONAL
  db.exec(`
    CREATE VIEW IF NOT EXISTS users AS
    SELECT
      id, email, nome_utilizador AS username, hash_palavra_passe AS passwordHash, nome AS name,
      papel AS role, url_avatar AS avatarUrl, biografia AS bio, localizacao AS location,
      dias_sequencia AS streakDays, data_ultima_atividade AS lastActiveDate,
      meta_diaria_minutos AS dailyGoalMinutes, minutos_hoje AS minutesToday,
      minutos_totais AS totalMinutes, xp, nivel AS level, esta_suspenso AS isSuspended,
      criado_em AS createdAt, atualizado_em AS updatedAt
    FROM utilizadores;

    CREATE TRIGGER IF NOT EXISTS trg_users_insert INSTEAD OF INSERT ON users
    FOR EACH ROW BEGIN
      INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, url_avatar, biografia, localizacao, dias_sequencia, data_ultima_atividade, meta_diaria_minutos, minutos_hoje, minutos_totais, xp, nivel, esta_suspenso, criado_em, atualizado_em)
      VALUES (NEW.id, NEW.email, NEW.username, NEW.passwordHash, NEW.name, COALESCE(NEW.role, 'STUDENT'), NEW.avatarUrl, NEW.bio, NEW.location, COALESCE(NEW.streakDays, 0), NEW.lastActiveDate, COALESCE(NEW.dailyGoalMinutes, 45), COALESCE(NEW.minutesToday, 0), COALESCE(NEW.totalMinutes, 0), COALESCE(NEW.xp, 0), COALESCE(NEW.level, 1), COALESCE(NEW.isSuspended, 0), NEW.createdAt, NEW.updatedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_users_update INSTEAD OF UPDATE ON users
    FOR EACH ROW BEGIN
      UPDATE utilizadores SET
        email = COALESCE(NEW.email, email),
        nome_utilizador = COALESCE(NEW.username, nome_utilizador),
        hash_palavra_passe = COALESCE(NEW.passwordHash, hash_palavra_passe),
        nome = COALESCE(NEW.name, nome),
        papel = COALESCE(NEW.role, papel),
        url_avatar = COALESCE(NEW.avatarUrl, url_avatar),
        biografia = COALESCE(NEW.bio, biografia),
        localizacao = COALESCE(NEW.location, localizacao),
        dias_sequencia = COALESCE(NEW.streakDays, dias_sequencia),
        data_ultima_atividade = COALESCE(NEW.lastActiveDate, data_ultima_atividade),
        meta_diaria_minutos = COALESCE(NEW.dailyGoalMinutes, meta_diaria_minutos),
        minutos_hoje = COALESCE(NEW.minutesToday, minutos_hoje),
        minutos_totais = COALESCE(NEW.totalMinutes, minutos_totais),
        xp = COALESCE(NEW.xp, xp),
        nivel = COALESCE(NEW.level, nivel),
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
      id, id_utilizador AS userId, titulo_perfil AS headline, website, github, twitter, linkedin, instagram,
      youtube, tiktok, discord, twitch, url_banner AS bannerUrl, posicao_banner AS bannerPosition,
      e_publico AS isPublic, mostrar_sequencia AS showStreak, mostrar_classificacao AS showLeaderboard,
      mostrar_biografia AS showBio, mostrar_localizacao AS showLocation, mostrar_redes_sociais AS showSocials,
      mostrar_estatisticas AS showStats, mostrar_cursos AS showCourses, mostrar_insignias AS showBadges,
      preferencia_tema AS themePreference
    FROM perfis;

    CREATE TRIGGER IF NOT EXISTS trg_profiles_insert INSTEAD OF INSERT ON profiles
    FOR EACH ROW BEGIN
      INSERT INTO perfis (id, id_utilizador, titulo_perfil, website, github, twitter, linkedin, instagram, youtube, tiktok, discord, twitch, url_banner, posicao_banner, e_publico, mostrar_sequencia, mostrar_classificacao, mostrar_biografia, mostrar_localizacao, mostrar_redes_sociais, mostrar_estatisticas, mostrar_cursos, mostrar_insignias, preferencia_tema)
      VALUES (NEW.id, NEW.userId, NEW.headline, NEW.website, NEW.github, NEW.twitter, NEW.linkedin, NEW.instagram, NEW.youtube, NEW.tiktok, NEW.discord, NEW.twitch, NEW.bannerUrl, COALESCE(NEW.bannerPosition, '50% 50%'), COALESCE(NEW.isPublic, 1), COALESCE(NEW.showStreak, 1), COALESCE(NEW.showLeaderboard, 1), COALESCE(NEW.showBio, 1), COALESCE(NEW.showLocation, 1), COALESCE(NEW.showSocials, 1), COALESCE(NEW.showStats, 1), COALESCE(NEW.showCourses, 1), COALESCE(NEW.showBadges, 1), COALESCE(NEW.themePreference, 'light'));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_profiles_update INSTEAD OF UPDATE ON profiles
    FOR EACH ROW BEGIN
      UPDATE perfis SET
        titulo_perfil = COALESCE(NEW.headline, titulo_perfil),
        website = COALESCE(NEW.website, website),
        github = COALESCE(NEW.github, github),
        twitter = COALESCE(NEW.twitter, twitter),
        linkedin = COALESCE(NEW.linkedin, linkedin),
        instagram = COALESCE(NEW.instagram, instagram),
        youtube = COALESCE(NEW.youtube, youtube),
        tiktok = COALESCE(NEW.tiktok, tiktok),
        discord = COALESCE(NEW.discord, discord),
        twitch = COALESCE(NEW.twitch, twitch),
        url_banner = COALESCE(NEW.bannerUrl, url_banner),
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

    CREATE VIEW IF NOT EXISTS course_modules AS
    SELECT id, id_curso AS courseId, titulo AS title, descricao AS description, indice_ordem AS orderIndex
    FROM modulos_curso;

    CREATE TRIGGER IF NOT EXISTS trg_course_modules_insert INSTEAD OF INSERT ON course_modules
    FOR EACH ROW BEGIN
      INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem)
      VALUES (NEW.id, NEW.courseId, NEW.title, NEW.description, COALESCE(NEW.orderIndex, 0));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_course_modules_update INSTEAD OF UPDATE ON course_modules
    FOR EACH ROW BEGIN
      UPDATE modulos_curso SET
        id_curso = COALESCE(NEW.courseId, id_curso),
        titulo = COALESCE(NEW.title, titulo),
        descricao = COALESCE(NEW.description, descricao),
        indice_ordem = COALESCE(NEW.orderIndex, indice_ordem)
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

    CREATE VIEW IF NOT EXISTS reactions AS
    SELECT id, id_mensagem AS messageId, id_utilizador AS userId, emoji
    FROM reacoes;

    CREATE TRIGGER IF NOT EXISTS trg_reactions_insert INSTEAD OF INSERT ON reactions
    FOR EACH ROW BEGIN
      INSERT INTO reacoes (id, id_mensagem, id_utilizador, emoji)
      VALUES (NEW.id, NEW.messageId, NEW.userId, NEW.emoji);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_reactions_delete INSTEAD OF DELETE ON reactions
    FOR EACH ROW BEGIN
      DELETE FROM reacoes WHERE id = OLD.id;
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

    CREATE VIEW IF NOT EXISTS achievements AS
    SELECT id, slug, titulo AS title, descricao AS description, icone AS icon, categoria AS category, raridade AS rarity, recompensa_xp AS xpReward
    FROM conquistas;

    CREATE TRIGGER IF NOT EXISTS trg_achievements_insert INSTEAD OF INSERT ON achievements
    FOR EACH ROW BEGIN
      INSERT INTO conquistas (id, slug, titulo, descricao, icone, categoria, raridade, recompensa_xp)
      VALUES (NEW.id, NEW.slug, NEW.title, NEW.description, NEW.icon, NEW.category, NEW.rarity, NEW.xpReward);
    END;

    CREATE VIEW IF NOT EXISTS user_achievements AS
    SELECT id, id_utilizador AS userId, id_conquista AS achievementId, desbloqueado_em AS unlockedAt
    FROM conquistas_utilizadores;

    CREATE TRIGGER IF NOT EXISTS trg_user_achievements_insert INSTEAD OF INSERT ON user_achievements
    FOR EACH ROW BEGIN
      INSERT INTO conquistas_utilizadores (id, id_utilizador, id_conquista, desbloqueado_em)
      VALUES (NEW.id, NEW.userId, NEW.achievementId, NEW.unlockedAt);
    END;

    CREATE VIEW IF NOT EXISTS xp_transactions AS
    SELECT id, id_utilizador AS userId, quantidade AS amount, acao AS action, descricao AS description, criado_em AS createdAt
    FROM transacoes_xp;

    CREATE TRIGGER IF NOT EXISTS trg_xp_transactions_insert INSTEAD OF INSERT ON xp_transactions
    FOR EACH ROW BEGIN
      INSERT INTO transacoes_xp (id, id_utilizador, quantidade, acao, descricao, criado_em)
      VALUES (NEW.id, NEW.userId, NEW.amount, NEW.action, NEW.description, NEW.createdAt);
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

    CREATE VIEW IF NOT EXISTS qa_questions AS
    SELECT id, id_curso AS courseId, id_utilizador AS userId, titulo AS title, corpo AS body, esta_respondida AS isAnswered, criado_em AS createdAt
    FROM perguntas_qa;

    CREATE TRIGGER IF NOT EXISTS trg_qa_questions_insert INSTEAD OF INSERT ON qa_questions
    FOR EACH ROW BEGIN
      INSERT INTO perguntas_qa (id, id_curso, id_utilizador, titulo, corpo, esta_respondida, criado_em)
      VALUES (NEW.id, NEW.courseId, NEW.userId, NEW.title, NEW.body, COALESCE(NEW.isAnswered, 0), NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_qa_questions_update INSTEAD OF UPDATE ON qa_questions
    FOR EACH ROW BEGIN
      UPDATE perguntas_qa SET
        id_curso = COALESCE(NEW.courseId, id_curso),
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        titulo = COALESCE(NEW.title, titulo),
        corpo = COALESCE(NEW.body, corpo),
        esta_respondida = COALESCE(NEW.isAnswered, esta_respondida),
        criado_em = COALESCE(NEW.createdAt, criado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_qa_questions_delete INSTEAD OF DELETE ON qa_questions
    FOR EACH ROW BEGIN
      DELETE FROM perguntas_qa WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS qa_answers AS
    SELECT id, id_pergunta AS questionId, id_utilizador AS userId, corpo AS body, esta_aceite AS isAccepted, criado_em AS createdAt
    FROM respostas_qa;

    CREATE TRIGGER IF NOT EXISTS trg_qa_answers_insert INSTEAD OF INSERT ON qa_answers
    FOR EACH ROW BEGIN
      INSERT INTO respostas_qa (id, id_pergunta, id_utilizador, corpo, esta_aceite, criado_em)
      VALUES (NEW.id, NEW.questionId, NEW.userId, NEW.body, COALESCE(NEW.isAccepted, 0), NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_qa_answers_update INSTEAD OF UPDATE ON qa_answers
    FOR EACH ROW BEGIN
      UPDATE respostas_qa SET
        id_pergunta = COALESCE(NEW.questionId, id_pergunta),
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        corpo = COALESCE(NEW.body, corpo),
        esta_aceite = COALESCE(NEW.isAccepted, esta_aceite),
        criado_em = COALESCE(NEW.createdAt, criado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_qa_answers_delete INSTEAD OF DELETE ON qa_answers
    FOR EACH ROW BEGIN
      DELETE FROM respostas_qa WHERE id = OLD.id;
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

    CREATE VIEW IF NOT EXISTS course_roles AS
    SELECT id, id_curso AS courseId, nome AS name, cor AS color, pode_publicar_anuncios AS canPostAnnouncements, pode_falar_palco AS canSpeakInStage, pode_partilhar_ecra AS canShareScreen, pode_moderar_chat AS canModerateChat, pode_gerir_voz AS canManageVoice, indice_ordem AS orderIndex, criado_em AS createdAt
    FROM cargos_curso;

    CREATE TRIGGER IF NOT EXISTS trg_course_roles_insert INSTEAD OF INSERT ON course_roles
    FOR EACH ROW BEGIN
      INSERT INTO cargos_curso (id, id_curso, nome, cor, pode_publicar_anuncios, pode_falar_palco, pode_partilhar_ecra, pode_moderar_chat, pode_gerir_voz, indice_ordem, criado_em)
      VALUES (NEW.id, NEW.courseId, NEW.name, COALESCE(NEW.color, 'indigo'), COALESCE(NEW.canPostAnnouncements, 0), COALESCE(NEW.canSpeakInStage, 0), COALESCE(NEW.canShareScreen, 0), COALESCE(NEW.canModerateChat, 0), COALESCE(NEW.canManageVoice, 0), COALESCE(NEW.orderIndex, 0), NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_course_roles_delete INSTEAD OF DELETE ON course_roles
    FOR EACH ROW BEGIN
      DELETE FROM cargos_curso WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS course_member_roles AS
    SELECT id, id_curso AS courseId, id_utilizador AS userId, id_cargo AS roleId, atribuido_em AS assignedAt
    FROM cargos_membros_curso;

    CREATE TRIGGER IF NOT EXISTS trg_course_member_roles_insert INSTEAD OF INSERT ON course_member_roles
    FOR EACH ROW BEGIN
      INSERT INTO cargos_membros_curso (id, id_curso, id_utilizador, id_cargo, atribuido_em)
      VALUES (NEW.id, NEW.courseId, NEW.userId, NEW.roleId, NEW.assignedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_course_member_roles_delete INSTEAD OF DELETE ON course_member_roles
    FOR EACH ROW BEGIN
      DELETE FROM cargos_membros_curso WHERE id = OLD.id;
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

    CREATE VIEW IF NOT EXISTS admin_applications AS
    SELECT id, id_utilizador AS userId, nome_completo AS fullName, email, motivacao AS motivation, experiencia AS experience, horas_disponibilidade_semanal AS weeklyAvailabilityHours, areas_interesse AS areasOfInterest, cenario_situacao AS situationScenario, estado AS status, parecer_admin AS adminFeedback, revisto_por AS reviewedBy, revisto_em AS reviewedAt, criado_em AS createdAt, atualizado_em AS updatedAt
    FROM candidaturas_admin;

    CREATE TRIGGER IF NOT EXISTS trg_admin_applications_insert INSTEAD OF INSERT ON admin_applications
    FOR EACH ROW BEGIN
      INSERT INTO candidaturas_admin (id, id_utilizador, nome_completo, email, motivacao, experiencia, horas_disponibilidade_semanal, areas_interesse, cenario_situacao, estado, parecer_admin, revisto_por, revisto_em, criado_em, atualizado_em)
      VALUES (NEW.id, NEW.userId, NEW.fullName, NEW.email, NEW.motivation, NEW.experience, COALESCE(NEW.weeklyAvailabilityHours, 10), NEW.areasOfInterest, NEW.situationScenario, COALESCE(NEW.status, 'PENDING'), NEW.adminFeedback, NEW.reviewedBy, NEW.reviewedAt, NEW.createdAt, NEW.updatedAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_admin_applications_update INSTEAD OF UPDATE ON admin_applications
    FOR EACH ROW BEGIN
      UPDATE candidaturas_admin SET
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        nome_completo = COALESCE(NEW.fullName, nome_completo),
        email = COALESCE(NEW.email, email),
        motivacao = COALESCE(NEW.motivation, motivacao),
        experiencia = COALESCE(NEW.experience, experiencia),
        horas_disponibilidade_semanal = COALESCE(NEW.weeklyAvailabilityHours, horas_disponibilidade_semanal),
        areas_interesse = COALESCE(NEW.areasOfInterest, areas_interesse),
        cenario_situacao = COALESCE(NEW.situationScenario, cenario_situacao),
        estado = COALESCE(NEW.status, estado),
        parecer_admin = COALESCE(NEW.adminFeedback, parecer_admin),
        revisto_por = COALESCE(NEW.reviewedBy, revisto_por),
        revisto_em = COALESCE(NEW.reviewedAt, revisto_em),
        criado_em = COALESCE(NEW.createdAt, criado_em),
        atualizado_em = COALESCE(NEW.updatedAt, atualizado_em)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_admin_applications_delete INSTEAD OF DELETE ON admin_applications
    FOR EACH ROW BEGIN
      DELETE FROM candidaturas_admin WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS support_tickets AS
    SELECT id, id_utilizador AS userId, assunto AS subject, categoria AS category, prioridade AS priority, estado AS status, criado_em AS createdAt, atualizado_em AS updatedAt, resolvido_em AS resolvedAt, id_admin_atribuido AS assignedAdminId
    FROM pedidos_suporte;

    CREATE TRIGGER IF NOT EXISTS trg_support_tickets_insert INSTEAD OF INSERT ON support_tickets
    FOR EACH ROW BEGIN
      INSERT INTO pedidos_suporte (id, id_utilizador, assunto, categoria, prioridade, estado, criado_em, atualizado_em, resolvido_em, id_admin_atribuido)
      VALUES (NEW.id, NEW.userId, NEW.subject, COALESCE(NEW.category, 'Dúvidas Gerais'), COALESCE(NEW.priority, 'MÉDIA'), COALESCE(NEW.status, 'ABERTO'), NEW.createdAt, NEW.updatedAt, NEW.resolvedAt, NEW.assignedAdminId);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_support_tickets_update INSTEAD OF UPDATE ON support_tickets
    FOR EACH ROW BEGIN
      UPDATE pedidos_suporte SET
        id_utilizador = COALESCE(NEW.userId, id_utilizador),
        assunto = COALESCE(NEW.subject, assunto),
        categoria = COALESCE(NEW.category, categoria),
        prioridade = COALESCE(NEW.priority, prioridade),
        estado = COALESCE(NEW.status, estado),
        criado_em = COALESCE(NEW.createdAt, criado_em),
        atualizado_em = COALESCE(NEW.updatedAt, atualizado_em),
        resolvido_em = COALESCE(NEW.resolvedAt, resolvido_em),
        id_admin_atribuido = COALESCE(NEW.assignedAdminId, id_admin_atribuido)
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_support_tickets_delete INSTEAD OF DELETE ON support_tickets
    FOR EACH ROW BEGIN
      DELETE FROM pedidos_suporte WHERE id = OLD.id;
    END;

    CREATE VIEW IF NOT EXISTS ticket_messages AS
    SELECT id, id_pedido AS ticketId, id_remetente AS senderId, conteudo AS content, e_resposta_admin AS isAdminReply, criado_em AS createdAt
    FROM mensagens_suporte;

    CREATE TRIGGER IF NOT EXISTS trg_ticket_messages_insert INSTEAD OF INSERT ON ticket_messages
    FOR EACH ROW BEGIN
      INSERT INTO mensagens_suporte (id, id_pedido, id_remetente, conteudo, e_resposta_admin, criado_em)
      VALUES (NEW.id, NEW.ticketId, NEW.senderId, NEW.content, COALESCE(NEW.isAdminReply, 0), NEW.createdAt);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_ticket_messages_delete INSTEAD OF DELETE ON ticket_messages
    FOR EACH ROW BEGIN
      DELETE FROM mensagens_suporte WHERE id = OLD.id;
    END;
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM utilizadores').get().count;
  if (userCount === 0) {
    seedData(db);
  }
  if (process.env.NODE_ENV !== 'production') {
    seedDemoShowcaseData(db);
  }
}

function seedData(db) {
  const passwordHash = bcrypt.hashSync('password123', 10);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, url_avatar, biografia, localizacao, dias_sequencia, meta_diaria_minutos, minutos_hoje, minutos_totais, xp, nivel, esta_suspenso, criado_em, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  const insertProfile = db.prepare(`
    INSERT INTO perfis (id, id_utilizador, titulo_perfil, website, github, twitter, linkedin, e_publico, mostrar_sequencia, mostrar_classificacao, preferencia_tema)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 'light')
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

  const insertAchievement = db.prepare(`
    INSERT INTO conquistas (id, slug, titulo, descricao, icone, categoria, raridade, recompensa_xp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (id, id_aula, titulo, descricao, pontuacao_aprovacao, recompensa_xp)
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
      'Estudante focado em desenvolvimento web moderno, TypeScript e interfaces cinemáticas.',
      'Lisboa, Portugal',
      12,
      45,
      35,
      1450,
      1450,
      4,
      now,
      now
    );
    insertProfile.run('prof-student', 'user-student', 'Estudante Full Stack @ NEXO', 'https://nexo.pt', 'https://github.com/pedrosilva', '', '');

    insertUser.run(
      'user-sarah',
      'sarah@nexo.pt',
      'sarah_dev',
      passwordHash,
      'Sarah Jenkins',
      'CREATOR',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      'Arquiteta de Software e Formadora Especialista em React 19, TypeScript e Design Systems.',
      'Porto, Portugal',
      45,
      90,
      85,
      8900,
      8900,
      15,
      now,
      now
    );
    insertProfile.run('prof-sarah', 'user-sarah', 'Arquiteta de Software & Criadora NEXO', 'https://sarahjenkins.dev', 'https://github.com/sarahjenkins', '', '');

    insertUser.run(
      'user-alex',
      'alex@nexo.pt',
      'alex_admin',
      passwordHash,
      'Alex Vance',
      'ADMIN',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'Administrador de infraestruturas e moderador-chefe da plataforma NEXO.',
      'Braga, Portugal',
      120,
      120,
      120,
      25400,
      25400,
      32,
      now,
      now
    );
    insertProfile.run('prof-alex', 'user-alex', 'Administrador Global NEXO', '', 'https://github.com/alexvance', '', '');

    insertUser.run(
      'user-tiago',
      'tiago@nexo.pt',
      'tiago_sec',
      passwordHash,
      'Tiago Ramos',
      'STUDENT',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      'Engenheiro de Redes e Especialista em Segurança Ofensiva.',
      'Coimbra, Portugal',
      5,
      60,
      20,
      820,
      820,
      3,
      now,
      now
    );
    insertProfile.run('prof-tiago', 'user-tiago', 'Engenheiro de Redes & Aspirante a Formador', '', 'https://github.com/tiagoramos', '', '');

    // 2. CANDIDATURA A CRIADOR
    insertApplication.run(
      'app-tiago-1',
      'user-tiago',
      'Tiago Ramos',
      'Consultor de Cibersegurança Sénior com certificação OSCP e 6 anos de experiência em auditorias de segurança aplicacional.',
      'Cibersegurança & Redes',
      6,
      'https://github.com/tiagoramos-sec',
      'Desejo partilhar conhecimento prático e preparar os alunos do NEXO para os desafios reais de segurança ofensiva em ambiente de produção.',
      '1. Fundamentos de Cibersegurança & Ethical Hacking\n2. Defesa Ativa e Auditoria de Aplicações Web',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'PENDING',
      null,
      now,
      now
    );

    // 3. CATEGORIAS (PT-PT)
    insertCategory.run('cat-prog', 'Programação & Engenharia de Software', 'programming', 'Desenvolvimento Web, APIs escaláveis, TypeScript e arquitetura de código.', 'Code');
    insertCategory.run('cat-design', 'Design & Experiência de Utilizador (UX/UI)', 'design', 'Design Systems no Figma, prototipagem avançada e micro-interações.', 'Palette');
    insertCategory.run('cat-ai', 'Inteligência Artificial & Ciência de Dados', 'ai', 'Modelos de Linguagem, Machine Learning e automação prática com Python.', 'Cpu');
    insertCategory.run('cat-sec', 'Cibersegurança & Redes Defensivas', 'cybersecurity', 'Segurança ofensiva, análise de vulnerabilidades e proteção de redes.', 'ShieldCheck');
    insertCategory.run('cat-cloud', 'Cloud, DevOps & Infraestruturas', 'cloud', 'Docker, Kubernetes, fluxos de integração contínua (CI/CD) e servidores Linux.', 'Server');

    // 4. ESPAÇOS COMUNITÁRIOS E CANAIS DEDICADOS
    insertSpace.run(
      'space-react',
      'Comunidade React & Engenharia Web',
      'comunidade-react-portugal',
      'Espaço oficial de mentoria, partilha de código, esclarecimento de dúvidas e salas de estudo coletivo com áudio e partilha de ecrã.',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      0,
      'programming',
      'user-sarah',
      142,
      now
    );

    insertChannel.run('ch-general', 'space-react', 'geral', 'text', 'Discussões gerais sobre programação e a comunidade NEXO', 0, 0, 0, 'Qual é o seu objetivo de estudo para esta semana?', 'Mantenha uma comunicação cordial e apoie os colegas.');
    insertChannel.run('ch-qa', 'space-react', 'duvidas-exercicios', 'text', 'Canal para colocar dúvidas de aulas e desafios técnicos', 1, 0, 0, 'Qual foi a mensagem de erro específica ou comportamento verificado?', 'Partilhe excertos de código formatados com blocos markdown.');
    insertChannel.run('ch-showcase', 'space-react', 'projetos-showcase', 'text', 'Apresente os seus projetos concluídos e receba feedback', 2, 0, 0, 'Que desafio técnico superou na construção deste projeto?', 'Adicione links de repositório e pré-visualização.');
    insertChannel.run('ch-voice-1', 'space-react', 'Sala de Estudo 01 (Voz / Vídeo)', 'voice', 'Sala ao vivo com partilha de ecrã e microfone aberto', 3, 1, 0, 'Que aula ou projeto está a rever em grupo?', 'Silencie o microfone quando não estiver a intervir.');

    insertSpace.run(
      'space-ui-ux',
      'Comunidade Design Systems & UI/UX',
      'comunidade-design-systems',
      'Comunidade para designers de interfaces, partilha de ficheiros Figma, critiques de design e sessões de co-design ao vivo.',
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      0,
      'design',
      'user-sarah',
      98,
      now
    );

    insertChannel.run('ch-uiux-general', 'space-ui-ux', 'geral-design', 'text', 'Discussões sobre UI/UX, tendências e sistemas visuais', 0, 0, 0, 'Que novidade do Figma descobriu recentemente?', 'Respeite a diversidade de abordagens visuais.');
    insertChannel.run('ch-uiux-feedback', 'space-ui-ux', 'design-critique', 'text', 'Peça feedback e análises de heurística das suas interfaces', 1, 0, 0, 'Qual o objetivo do utilizador neste fluxo de ecrãs?', 'Forneça contexto do público-alvo da interface.');
    insertChannel.run('ch-uiux-showcase', 'space-ui-ux', 'prototipos-showcase', 'text', 'Partilhe protótipos interativos e design tokens criados', 2, 0, 0, 'Que animações ou micro-interações implementou?', 'Disponibilize o link de visualização do protótipo.');
    insertChannel.run('ch-uiux-voice', 'space-ui-ux', 'Atelier de Design (Voz / Vídeo)', 'voice', 'Sessões de crítica ao vivo e partilha de ecrã no Figma', 3, 1, 0, 'Que componente do sistema de design está a arquitetar?', 'Partilhe o ecrã em alta resolução.');

    insertSpace.run(
      'space-cloud-devops',
      'Comunidade DevOps & Cloud Architecture',
      'comunidade-cloud-devops',
      'Espaço focado em infraestruturas, contentorização, orquestração Kubernetes, pipelines CI/CD e auditorias de produção.',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      0,
      'cloud',
      'user-sarah',
      76,
      now
    );

    insertChannel.run('ch-cloud-general', 'space-cloud-devops', 'geral-cloud', 'text', 'Discussões de arquiteturas cloud, Docker e Linux', 0, 0, 0, 'Qual provedor de cloud costuma utilizar nos seus projetos?', 'Evite partilhar chaves de API ou segredos.');
    insertChannel.run('ch-cloud-qa', 'space-cloud-devops', 'debug-containers', 'text', 'Resolução de problemas de Dockerfile, redes e pods', 1, 0, 0, 'Cole aqui os logs do contentor ou docker-compose.', 'Utilize blocos de código com formatação yaml/bash.');
    insertChannel.run('ch-cloud-labs', 'space-cloud-devops', 'laboratorios-praticos', 'text', 'Partilhe as suas configurações de CI/CD e testes de carga', 2, 0, 0, 'Quantos passos tem o seu pipeline automatizado?', 'Descreva a stack técnica utilizada.');
    insertChannel.run('ch-cloud-voice', 'space-cloud-devops', 'War Room DevOps (Voz / Vídeo)', 'voice', 'Debug colaborativo ao vivo e orquestração de servidores', 3, 1, 0, 'Que ambiente de cluster está a analisar?', 'Mantenha o áudio nítido.');

    insertSpace.run(
      'space-ai-applied',
      'Comunidade IA Aplicada & Engenharia de Prompts',
      'comunidade-ia-aplicada',
      'Laboratório de experimentação com LLMs, agentes autónomos, frameworks de RAG e integração de IA em produtos digitais.',
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
      0,
      'ai',
      'user-sarah',
      115,
      now
    );

    insertChannel.run('ch-ai-general', 'space-ai-applied', 'geral-ia', 'text', 'Conversas sobre os avanços de modelos de inteligência artificial', 0, 0, 0, 'Que modelo generativo testou esta semana?', 'Debates fundamentados e partilha de artigos científicos.');
    insertChannel.run('ch-ai-prompts', 'space-ai-applied', 'engenharia-prompts', 'text', 'Técnicas de few-shot, chain-of-thought e estruturação de system prompts', 1, 0, 0, 'Qual prompt gerou os melhores resultados consistentes?', 'Partilhe o prompt completo e a saída gerada.');
    insertChannel.run('ch-ai-projects', 'space-ai-applied', 'agentes-projetos', 'text', 'Apresentação de agentes e arquiteturas RAG desenvolvidas pelos alunos', 2, 0, 0, 'Que base de vetores utilizou para o RAG?', 'Inclua instruções sobre como reproduzir localmente.');
    insertChannel.run('ch-ai-voice', 'space-ai-applied', 'Lab IA & Pair Prompting (Voz / Vídeo)', 'voice', 'Sessões de teste e desenvolvimento de agentes ao vivo', 3, 1, 0, 'Que workflow com IA está a implementar?', 'Silencie quando em escuta ativa.');

    // Relações de Membros
    ['space-react', 'space-ui-ux', 'space-cloud-devops', 'space-ai-applied'].forEach((spId, idx) => {
      insertMembership.run(`mem-sarah-${idx}`, 'user-sarah', spId, 'OWNER', now);
      insertMembership.run(`mem-student-${idx}`, 'user-student', spId, 'MEMBER', now);
      insertMembership.run(`mem-alex-${idx}`, 'user-alex', spId, 'ADMIN', now);
      insertMembership.run(`mem-tiago-${idx}`, 'user-tiago', spId, 'MEMBER', now);
    });

    // 5. CURSOS APROVADOS (PT-PT)
    insertCourse.run(
      'course-react-ts',
      'React 19 & TypeScript de Alta Performance',
      'react-19-typescript-alta-performance',
      'Domine os novos padrões do React 19, Server Components, Gestão de Estado Eficiente, Hooks Modernos e TypeScript Avançado com projetos práticos prontos para produção.',
      'programming',
      'Intermédio',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      0.0,
      1,
      1,
      'APPROVED',
      'Curso validado pela equipa pedagógica do NEXO. Conteúdo de excelência.',
      1,
      14.5,
      'Português',
      'user-sarah',
      'space-react',
      now,
      now
    );

    insertModule.run('mod-1', 'course-react-ts', 'Módulo 1: Fundamentos do React 19 & Tipagem Estrita', 'Conceitos essenciais, padrões de Server Components e TypeScript moderno.', 0);
    insertLesson.run('les-1', 'mod-1', '1.1 Introdução e Configuração do Ambiente Moderno', 'video', 'Nesta aula configuramos o TypeScript com definições estritas, Vite e ESLint para máxima estabilidade.', 'https://www.w3schools.com/html/mov_bbb.mp4', 12, 0, 30);
    insertLesson.run('les-2', 'mod-1', '1.2 Tipagem Avançada de Hooks & Props no React 19', 'video', 'Aprenda a tipar useState, useReducer, useRef e handlers de eventos com rigor e elegância.', 'https://www.w3schools.com/html/mov_bbb.mp4', 18, 1, 35);
    insertLesson.run('les-3', 'mod-1', '1.3 Questionário de Avaliação: Fundamentos', 'quiz', 'Avalie a sua compreensão sobre tipagem de componentes funcionais.', '', 10, 2, 50);

    insertQuiz.run('quiz-1', 'les-3', 'Questionário: Fundamentos do React com TypeScript', 'Teste prático de 2 perguntas essenciais de arquitetura.', 70, 50);
    insertQuizQuestion.run('qq-1', 'quiz-1', 'Qual é a forma recomendada de tipar as propriedades de um componente React funcional?', JSON.stringify(['Utilizar interface ou type dedicado com tipagem estrita', 'Utilizar o tipo "any"', 'Não definir tipos e deixar implícito', 'Utilizar a função genérica Object']), 0, 'Interfaces e types dedicados garantem verificação estrita em tempo de compilação.', 0);
    insertQuizQuestion.run('qq-2', 'quiz-1', 'Qual o benefício principal do modo estrito do TypeScript no React?', JSON.stringify(['Prevenir bugs e detetar referências nulas antes da execução', 'Aumentar a velocidade da rede Wi-Fi', 'Adicionar efeitos visuais CSS automaticamente', 'Permitir ignorar erros de sintaxe']), 0, 'O modo estrito previne erros comuns como acesso a propriedades indefinidas.', 1);

    insertCourse.run(
      'course-ui-ux',
      'Design Systems & Interfaces Cinemáticas no Figma',
      'design-systems-interfaces-cinematicas-figma',
      'Crie sistemas de design industriais, tokens de cores, tipografia responsiva, componentes reutilizáveis e protótipos de alta fidelidade prontos para implementação em código.',
      'design',
      'Avançado',
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
      now
    );

    insertModule.run('mod-design-1', 'course-ui-ux', 'Módulo 1: Fundações de Design & Tokens', 'Paletas semânticas, tipografia, espaçamento e acessibilidade WCAG.', 0);
    insertLesson.run('les-design-1', 'mod-design-1', '1.1 Definição de Variáveis e Design Tokens no Figma', 'video', 'Como estruturar tokens primitivos e semânticos para alimentar tanto o Figma como variáveis CSS.', 'https://www.w3schools.com/html/mov_bbb.mp4', 15, 0, 30);

    insertCourse.run(
      'course-cloud-devops',
      'DevOps Moderno, Docker & Arquitetura Cloud',
      'devops-moderno-docker-arquitetura-cloud',
      'Implemente pipelines automatizados de CI/CD, orquestre contentores com Docker e publique aplicações escaláveis na nuvem com segurança máxima.',
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
      now
    );

    insertCourse.run(
      'course-ai-pending',
      'Inteligência Artificial Aplicada & Engenharia de Prompts',
      'inteligencia-artificial-aplicada-engenharia-prompts',
      'Formação avançada sobre integração de modelos generativos, embeddings, recuperação aumentada (RAG) e fluxos de trabalho inteligentes em aplicações reais.',
      'ai',
      'Intermédio',
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
      now
    );

    insertModule.run('mod-ai-1', 'course-ai-pending', 'Módulo 1: Fundamentos de IA & LLMs', 'Conceitos de redes neurais e arquitetura Transformer.', 0);
    insertLesson.run('les-ai-1', 'mod-ai-1', '1.1 Visão Geral dos Grandes Modelos de Linguagem', 'video', 'Entenda como funcionam os modelos de linguagem modernos e tokenização.', 'https://www.w3schools.com/html/mov_bbb.mp4', 16, 0, 30);

    // 6. INSCRIÇÃO DEMO
    insertEnrollment.run('enr-1', 'user-student', 'course-react-ts', now, 68.0, 'les-2');

    // 7. CONQUISTAS (PT-PT)
    insertAchievement.run('ach-first-step', 'primeiro-passo', 'Primeiro Passo', 'Concluiu a sua primeira aula na plataforma NEXO.', 'CheckCircle2', 'learning', 'Comum', 100);
    insertAchievement.run('ach-quiz-master', 'mestre-quizzes', 'Mestre dos Questionários', 'Alcançou pontuação máxima de 100% num questionário de avaliação técnica.', 'Award', 'quiz', 'Raro', 250);
    insertAchievement.run('ach-streak-7', 'consistencia-7', 'Foco de Aço (7 Dias)', 'Manteve uma sequência ativa de estudo durante 7 dias consecutivos.', 'Flame', 'streak', 'Épico', 500);
    insertAchievement.run('ach-creator', 'criador-destaque', 'Formador Verificado', 'Teve a sua candidatura a criador aprovada e publicou o primeiro curso no NEXO.', 'Sparkles', 'creator', 'Lendário', 1000);

    // 8. NOTIFICAÇÕES (PT-PT)
    insertNotification.run('notif-1', 'user-student', 'achievement', 'Bem-vindo ao NEXO!', 'Explore o catálogo de cursos e junte-se às salas de estudo ao vivo.', '/explore', 0, now);
    insertNotification.run('notif-admin', 'user-alex', 'admin', 'Nova Candidatura a Criador', 'O utilizador Tiago Ramos submeteu um inquérito para se tornar Formador.', '/admin', 0, now);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}