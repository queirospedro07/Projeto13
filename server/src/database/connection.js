import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';

dotenv.config();

const { Pool } = pg;

let pool = null;
let sqliteDb = null;
let isPostgres = false;

// Convert PostgreSQL parameterized $1, $2, ... to SQLite ?
function toSqliteQuery(sql) {
  return sql.replace(/\$\d+/g, '?');
}

export async function connectDB() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes('localhost:5432/learnspace_desativado')) {
    try {
      const testPool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 3000,
      });
      // Test connectivity
      const client = await testPool.connect();
      client.release();
      pool = testPool;
      isPostgres = true;
      console.log('🐘 Base de dados PostgreSQL conectada com sucesso via pg.Pool');
      return { isPostgres: true, pool };
    } catch (err) {
      console.warn('⚠️  Não foi possível conectar ao PostgreSQL (' + err.message + '). Ativando fallback automático para SQLite.');
    }
  }

  // SQLite Fallback
  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/nexo.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(dbPath);
  try {
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
  } catch (_) {}

  isPostgres = false;
  console.log('📦 Base de dados SQLite ativa em:', dbPath);

  // Initialize schema if not present
  const { initializeSchemaAndSeed } = await import('../db/init.js');
  initializeSchemaAndSeed(sqliteDb);

  return { isPostgres: false, db: sqliteDb };
}

// Unified query methods
export async function query(sql, params = []) {
  if (isPostgres && pool) {
    const res = await pool.query(sql, params);
    return res;
  }
  if (!sqliteDb) {
    await connectDB();
  }
  const converted = toSqliteQuery(sql);
  const stmt = sqliteDb.prepare(converted);
  if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
    const rows = stmt.all(...params);
    return { rows, rowCount: rows.length };
  }
  const info = stmt.run(...params);
  return { rows: [], rowCount: info.changes };
}

export function queryOne(sql, params = []) {
  if (isPostgres && pool) {
    throw new Error('Use await query(sql, params) in async context for PostgreSQL');
  }
  if (!sqliteDb) {
    const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/nexo.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    sqliteDb = new DatabaseSync(dbPath);
  }
  const converted = toSqliteQuery(sql);
  const stmt = sqliteDb.prepare(converted);
  return stmt.get(...params);
}

export function queryAll(sql, params = []) {
  if (isPostgres && pool) {
    throw new Error('Use await query(sql, params) in async context for PostgreSQL');
  }
  if (!sqliteDb) {
    const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/nexo.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    sqliteDb = new DatabaseSync(dbPath);
  }
  const converted = toSqliteQuery(sql);
  const stmt = sqliteDb.prepare(converted);
  return stmt.all(...params);
}

export function execute(sql, params = []) {
  if (isPostgres && pool) {
    throw new Error('Use await query(sql, params) in async context for PostgreSQL');
  }
  if (!sqliteDb) {
    const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/nexo.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    sqliteDb = new DatabaseSync(dbPath);
  }
  const converted = toSqliteQuery(sql);
  const stmt = sqliteDb.prepare(converted);
  return stmt.run(...params);
}

export function transaction(fn) {
  if (!sqliteDb) {
    const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/nexo.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    sqliteDb = new DatabaseSync(dbPath);
  }
  sqliteDb.exec('BEGIN');
  try {
    const result = fn();
    sqliteDb.exec('COMMIT');
    return result;
  } catch (err) {
    sqliteDb.exec('ROLLBACK');
    throw err;
  }
}

export { pool, sqliteDb as db, isPostgres };
