import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';

dotenv.config();

const { Pool } = pg;

let pool = null;
let sqliteDb = null;
let isPostgres = false;

// Converter parâmetros $1, $2 de PostgreSQL para ? no SQLite
function toSqliteQuery(sql) {
  return sql.replace(/\$\d+/g, '?');
}

function getSqliteDbPath() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const backendRoot = path.resolve(__dirname, '../../');
  const configuredPath = process.env.DATABASE_PATH || 'data/nexo.db';
  return path.isAbsolute(configuredPath) ? configuredPath : path.resolve(backendRoot, configuredPath);
}

export async function connectDB() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes('localhost:5432/nexo_desativado')) {
    try {
      const testPool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 3000,
      });
      const client = await testPool.connect();
      client.release();
      pool = testPool;
      isPostgres = true;
      console.log('Ligado à base de dados PostgreSQL.');
      return { isPostgres: true, pool };
    } catch (err) {
      console.warn('Não foi possível ligar ao PostgreSQL (' + err.message + '). A usar SQLite local.');
    }
  }

  // Ligação SQLite local
  const dbPath = getSqliteDbPath();
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
  console.log('Base de dados SQLite iniciada em:', dbPath);

  const { initializeSchemaAndSeed } = await import('./init.js');
  initializeSchemaAndSeed(sqliteDb);

  return { isPostgres: false, db: sqliteDb };
}

// Funções auxiliares para queries
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

function ensureSqliteDb() {
  if (!sqliteDb) {
    const dbPath = getSqliteDbPath();
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    sqliteDb = new DatabaseSync(dbPath);
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
  }
  return sqliteDb;
}

export function queryOne(sql, params = []) {
  if (isPostgres && pool) {
    throw new Error('Utilize await query(sql, params) em contexto assíncrono para PostgreSQL.');
  }
  const dbInstance = ensureSqliteDb();
  const converted = toSqliteQuery(sql);
  const stmt = dbInstance.prepare(converted);
  return stmt.get(...params);
}

export function queryAll(sql, params = []) {
  if (isPostgres && pool) {
    throw new Error('Utilize await query(sql, params) em contexto assíncrono para PostgreSQL.');
  }
  const dbInstance = ensureSqliteDb();
  const converted = toSqliteQuery(sql);
  const stmt = dbInstance.prepare(converted);
  return stmt.all(...params);
}

export function execute(sql, params = []) {
  if (isPostgres && pool) {
    throw new Error('Utilize await query(sql, params) em contexto assíncrono para PostgreSQL.');
  }
  const dbInstance = ensureSqliteDb();
  const converted = toSqliteQuery(sql);
  const stmt = dbInstance.prepare(converted);
  return stmt.run(...params);
}

let transactionDepth = 0;

export function transaction(fn) {
  const dbInstance = ensureSqliteDb();
  const isOuter = transactionDepth === 0;
  const savepointName = `sp_${transactionDepth}`;
  transactionDepth += 1;
  dbInstance.exec(isOuter ? 'BEGIN' : `SAVEPOINT ${savepointName}`);
  try {
    const result = fn();
    dbInstance.exec(isOuter ? 'COMMIT' : `RELEASE SAVEPOINT ${savepointName}`);
    return result;
  } catch (err) {
    dbInstance.exec(isOuter ? 'ROLLBACK' : `ROLLBACK TO SAVEPOINT ${savepointName}`);
    throw err;
  } finally {
    transactionDepth -= 1;
  }
}

export { pool, sqliteDb as db, isPostgres };
