import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isPostgres, pool, db } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigrate() {
  console.log('A iniciar migrações da base de dados...');
  const conn = await connectDB();

  if (isPostgres && pool) {
    const client = await pool.connect();
    try {
      console.log('A criar tabelas no PostgreSQL...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS utilizadores (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          nome_utilizador VARCHAR(100) UNIQUE NOT NULL,
          hash_palavra_passe VARCHAR(255) NOT NULL,
          nome VARCHAR(255) NOT NULL,
          papel VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
          url_avatar TEXT,
          biografia TEXT,
          localizacao VARCHAR(100),
          meta_diaria_minutos INTEGER NOT NULL DEFAULT 45,
          minutos_hoje INTEGER NOT NULL DEFAULT 0,
          minutos_totais INTEGER NOT NULL DEFAULT 0,
          esta_suspenso INTEGER NOT NULL DEFAULT 0,
          criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS perfis (
          id VARCHAR(100) PRIMARY KEY,
          id_utilizador VARCHAR(100) UNIQUE NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
          titulo_perfil VARCHAR(255),
          website VARCHAR(255),
          github VARCHAR(100),
          twitter VARCHAR(100),
          linkedin VARCHAR(100),
          instagram VARCHAR(100),
          youtube VARCHAR(100),
          tiktok VARCHAR(100),
          discord VARCHAR(100),
          twitch VARCHAR(100),
          url_banner TEXT,
          posicao_banner VARCHAR(50) DEFAULT '50% 50%',
          e_publico INTEGER NOT NULL DEFAULT 1,
          mostrar_sequencia INTEGER NOT NULL DEFAULT 1,
          mostrar_classificacao INTEGER NOT NULL DEFAULT 1,
          mostrar_biografia INTEGER NOT NULL DEFAULT 1,
          mostrar_localizacao INTEGER NOT NULL DEFAULT 1,
          mostrar_redes_sociais INTEGER NOT NULL DEFAULT 1,
          mostrar_estatisticas INTEGER NOT NULL DEFAULT 1,
          mostrar_cursos INTEGER NOT NULL DEFAULT 1,
          mostrar_insignias INTEGER NOT NULL DEFAULT 1,
          preferencia_tema VARCHAR(20) NOT NULL DEFAULT 'light'
        );

        CREATE TABLE IF NOT EXISTS cursos (
          id VARCHAR(100) PRIMARY KEY,
          titulo VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          descricao TEXT NOT NULL,
          categoria VARCHAR(100) NOT NULL,
          dificuldade VARCHAR(50) NOT NULL DEFAULT 'Iniciante',
          url_miniatura TEXT,
          posicao_miniatura VARCHAR(50) DEFAULT '50% 50%',
          url_banner TEXT,
          posicao_banner VARCHAR(50) DEFAULT '50% 50%',
          preco NUMERIC(10,2) NOT NULL DEFAULT 0.00,
          e_gratuito INTEGER NOT NULL DEFAULT 1,
          e_publicado INTEGER NOT NULL DEFAULT 1,
          estado_aprovacao VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
          notas_admin TEXT,
          submetido_para_revisao_em TEXT,
          revisto_em TEXT,
          destaque INTEGER NOT NULL DEFAULT 0,
          duracao_horas NUMERIC(6,1) NOT NULL DEFAULT 10.0,
          idioma VARCHAR(50) NOT NULL DEFAULT 'Português',
          id_criador VARCHAR(100) NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
          id_espaco VARCHAR(100),
          modo_chamada_padrao VARCHAR(50) NOT NULL DEFAULT 'open',
          permitir_partilha_ecra_aluno INTEGER NOT NULL DEFAULT 1,
          permitir_camara_aluno INTEGER NOT NULL DEFAULT 1,
          resultados_aprendizagem TEXT,
          requisitos TEXT,
          documentos TEXT,
          criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tokens_recuperacao_palavra_passe (
          id VARCHAR(100) PRIMARY KEY,
          id_utilizador VARCHAR(100) NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
          hash_token VARCHAR(64) NOT NULL UNIQUE,
          expira_em TEXT NOT NULL,
          criado_em TEXT NOT NULL
        );

        CREATE OR REPLACE VIEW users AS
        SELECT
          id, email, nome_utilizador AS username, hash_palavra_passe AS "passwordHash", nome AS name,
          papel AS role, url_avatar AS "avatarUrl", biografia AS bio, localizacao AS location,
          meta_diaria_minutos AS "dailyGoalMinutes", minutos_hoje AS "minutesToday",
          minutos_totais AS "totalMinutes", esta_suspenso AS "isSuspended",
          criado_em AS "createdAt", atualizado_em AS "updatedAt"
        FROM utilizadores;

        CREATE OR REPLACE VIEW profiles AS
        SELECT
          id, id_utilizador AS "userId", titulo_perfil AS headline, website, github, twitter, linkedin, instagram,
          youtube, tiktok, discord, twitch, url_banner AS "bannerUrl", posicao_banner AS "bannerPosition",
          e_publico AS "isPublic", mostrar_sequencia AS "showStreak", mostrar_classificacao AS "showLeaderboard",
          mostrar_biografia AS "showBio", mostrar_localizacao AS "showLocation", mostrar_redes_sociais AS "showSocials",
          mostrar_estatisticas AS "showStats", mostrar_cursos AS "showCourses", mostrar_insignias AS "showBadges",
          preferencia_tema AS "themePreference"
        FROM perfis;

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

        CREATE OR REPLACE VIEW password_reset_tokens AS
        SELECT id, id_utilizador AS user_id, hash_token AS token_hash, expira_em AS expires_at, criado_em AS created_at
        FROM tokens_recuperacao_palavra_passe;
      `);
      console.log('Migrações concluídas no PostgreSQL.');
    } finally {
      client.release();
    }
  } else {
    console.log('A atualizar tabelas SQLite...');
    const { initializeSchemaAndSeed } = await import('./init.js');
    initializeSchemaAndSeed(db);
    console.log('Migrações concluídas no SQLite.');
  }

  process.exit(0);
}

runMigrate().catch((err) => {
  console.error('Erro na migração da base de dados:', err);
  process.exit(1);
});
