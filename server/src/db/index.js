import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initializeSchemaAndSeed } from './init.js';
dotenv.config();
const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/learnspace.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, {
    recursive: true
  });
}
export const db = new DatabaseSync(dbPath);
try {
  db.exec('PRAGMA foreign_keys = ON;');
} catch (_) {}
console.log('📦 Base de dados SQLite nativa (node:sqlite) pronta em:', dbPath);
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}
export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}
export function execute(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}
export function transaction(fn) {
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
if (!db.transaction) {
  db.transaction = function (fn) {
    return function (...args) {
      return transaction(() => fn(...args));
    };
  };
}
initializeSchemaAndSeed(db);