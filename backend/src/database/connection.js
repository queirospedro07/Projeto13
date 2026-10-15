import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { DatabaseSync } from 'node:sqlite';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
let sqliteDb = null;
export function getDatabasePath() {
  const configured = process.env.DATABASE_PATH;
  if (process.env.NODE_ENV === 'production' && !configured)
    throw new Error(
      'Configure DATABASE_PATH num volume persistente antes de arrancar em produção.',
    );
  const root = fileURLToPath(new URL('../../', import.meta.url));
  return path.resolve(root, configured || 'data/nexo.db');
}
function ensureSqliteDb() {
  if (sqliteDb) return sqliteDb;
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('nexo_desativado'))
    throw new Error(
      'Esta versão usa SQLite. Remova DATABASE_URL e configure DATABASE_PATH; não é feito fallback nem migração automática de dados PostgreSQL.',
    );
  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  return sqliteDb;
}
export async function connectDB() {
  const db = ensureSqliteDb();
  const { initializeSchemaAndSeed } = await import('./init.js');
  initializeSchemaAndSeed(db);
  return { db };
}
const sqlForSqlite = (sql) => sql.replace(/\$\d+/g, '?');
export function queryOne(sql, params = []) {
  return ensureSqliteDb()
    .prepare(sqlForSqlite(sql))
    .get(...params);
}
export function queryAll(sql, params = []) {
  return ensureSqliteDb()
    .prepare(sqlForSqlite(sql))
    .all(...params);
}
export function execute(sql, params = []) {
  return ensureSqliteDb()
    .prepare(sqlForSqlite(sql))
    .run(...params);
}
export async function query(sql, params = []) {
  if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
    const rows = queryAll(sql, params);
    return { rows, rowCount: rows.length };
  }
  const info = execute(sql, params);
  return { rows: [], rowCount: Number(info.changes) };
}
let transactionDepth = 0;
export function transaction(fn) {
  const db = ensureSqliteDb(),
    outer = transactionDepth === 0,
    savepoint = `sp_${transactionDepth}`;
  transactionDepth++;
  let started = false;
  try {
    db.exec(outer ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${savepoint}`);
    started = true;
    const result = fn();
    if (result && typeof result.then === 'function')
      throw new Error('As transações SQLite devem usar operações síncronas.');
    db.exec(outer ? 'COMMIT' : `RELEASE SAVEPOINT ${savepoint}`);
    return result;
  } catch (error) {
    if (started) db.exec(outer ? 'ROLLBACK' : `ROLLBACK TO SAVEPOINT ${savepoint}`);
    if (started && !outer) db.exec(`RELEASE SAVEPOINT ${savepoint}`);
    throw error;
  } finally {
    transactionDepth--;
  }
}
export { sqliteDb as db };
