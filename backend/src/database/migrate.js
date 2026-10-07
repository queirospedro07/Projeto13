import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isPostgres, pool, db } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigrate() {
  console.log('🚀 A iniciar migrações da base de dados...');
  const conn = await connectDB();

  if (isPostgres && pool) {
    const client = await pool.connect();
    try {
      console.log('🐘 A criar tabelas no PostgreSQL em PT-PT...');
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
          dias_sequencia INTEGER NOT NULL DEFAULT 0,
          meta_diaria_minutos INTEGER NOT NULL DEFAULT 45,
          total_minutes INTEGER NOT NULL DEFAULT 0,
          xp INTEGER NOT NULL DEFAULT 0,
          nivel INTEGER NOT NULL DEFAULT 1,
          esta_suspenso BOOLEAN NOT NULL DEFAULT FALSE,
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
          url_banner TEXT,
          e_publico BOOLEAN NOT NULL DEFAULT TRUE,
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
          url_banner TEXT,
          preco NUMERIC(10,2) NOT NULL DEFAULT 0.00,
          e_gratuito BOOLEAN NOT NULL DEFAULT TRUE,
          e_publicado BOOLEAN NOT NULL DEFAULT TRUE,
          duracao_horas NUMERIC(6,1) NOT NULL DEFAULT 10.0,
          idioma VARCHAR(50) NOT NULL DEFAULT 'Português',
          id_criador VARCHAR(100) NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
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
        SELECT id, email, nome_utilizador AS username, hash_palavra_passe AS password_hash, nome AS name, papel AS role, url_avatar AS avatar_url, biografia AS bio, localizacao AS location, dias_sequencia AS streak_days, meta_diaria_minutos AS daily_goal_minutes, total_minutes, xp, nivel AS level, esta_suspenso AS is_suspended, criado_em AS created_at, atualizado_em AS updated_at
        FROM utilizadores;

        CREATE OR REPLACE VIEW profiles AS
        SELECT id, id_utilizador AS user_id, titulo_perfil AS headline, website, github, twitter, linkedin, instagram, url_banner AS banner_url, e_publico AS is_public, preferencia_tema AS theme_preference
        FROM perfis;

        CREATE OR REPLACE VIEW courses AS
        SELECT id, titulo AS title, slug, descricao AS description, categoria AS category, dificuldade AS difficulty, url_miniatura AS thumbnail_url, url_banner AS banner_url, preco AS price, e_gratuito AS is_free, e_publicado AS is_published, duracao_horas AS duration_hours, idioma AS language, id_criador AS creator_id, criado_em AS created_at, atualizado_em AS updated_at
        FROM cursos;

        CREATE OR REPLACE VIEW password_reset_tokens AS
        SELECT id, id_utilizador AS user_id, hash_token AS token_hash, expira_em AS expires_at, criado_em AS created_at
        FROM tokens_recuperacao_palavra_passe;
      `);
      console.log('✅ Migrações concluídas com sucesso no PostgreSQL.');
    } finally {
      client.release();
    }
  } else {
    console.log('📦 A verificar/atualizar tabelas SQLite nativas...');
    const { initializeSchemaAndSeed } = await import('./init.js');
    initializeSchemaAndSeed(db);
    console.log('✅ Migrações concluídas com sucesso no SQLite.');
  }

  process.exit(0);
}

runMigrate().catch((err) => {
  console.error('❌ Falha na migração da base de dados:', err);
  process.exit(1);
});
