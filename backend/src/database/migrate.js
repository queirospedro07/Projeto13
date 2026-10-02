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
      console.log('🐘 A criar tabelas no PostgreSQL...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
          avatar_url TEXT,
          bio TEXT,
          location VARCHAR(100),
          streak_days INTEGER NOT NULL DEFAULT 0,
          daily_goal_minutes INTEGER NOT NULL DEFAULT 45,
          total_minutes INTEGER NOT NULL DEFAULT 0,
          xp INTEGER NOT NULL DEFAULT 0,
          level INTEGER NOT NULL DEFAULT 1,
          is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS profiles (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          headline VARCHAR(255),
          website VARCHAR(255),
          github VARCHAR(100),
          twitter VARCHAR(100),
          linkedin VARCHAR(100),
          instagram VARCHAR(100),
          banner_url TEXT,
          is_public BOOLEAN NOT NULL DEFAULT TRUE,
          theme_preference VARCHAR(20) NOT NULL DEFAULT 'light'
        );

        CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(100) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          difficulty VARCHAR(50) NOT NULL DEFAULT 'Iniciante',
          thumbnail_url TEXT,
          banner_url TEXT,
          price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
          is_free BOOLEAN NOT NULL DEFAULT TRUE,
          is_published BOOLEAN NOT NULL DEFAULT TRUE,
          duration_hours NUMERIC(6,1) NOT NULL DEFAULT 10.0,
          language VARCHAR(50) NOT NULL DEFAULT 'Português',
          creator_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(64) NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
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
