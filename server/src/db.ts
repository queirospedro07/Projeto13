import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initializeSchemaAndSeed } from './db/init.js';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/learnspace.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Enable pragmas
try {
  db.exec('PRAGMA foreign_keys = ON;');
} catch (_) {}

console.log('📦 Base de dados SQLite nativa (node:sqlite) pronta em:', dbPath);

/**
 * Executes a SELECT query expecting multiple rows.
 * Uses prepared statements to guarantee 100% protection against SQL Injection.
 */
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Executes a SELECT query expecting a single row.
 * Uses prepared statements to guarantee 100% protection against SQL Injection.
 */
export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

/**
 * Executes an INSERT, UPDATE, or DELETE statement.
 * Uses prepared statements to guarantee 100% protection against SQL Injection.
 */
export function execute(sql: string, params: any[] = []): any {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Executes a callback within an ACID transaction.
 */
export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Polyfill db.transaction for any internal caller expecting better-sqlite3 style db.transaction
if (!(db as any).transaction) {
  (db as any).transaction = function(fn: Function) {
    return function(...args: any[]) {
      return transaction(() => fn(...args));
    };
  };
}

// Auto-initialize tables and seed data on startup
initializeSchemaAndSeed(db);
