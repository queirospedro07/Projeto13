require('../config/environment.js');
const { AsyncLocalStorage } = require('node:async_hooks');
const pg = require('pg');
pg.types.setTypeParser(20, (value) => Number(value));
pg.types.setTypeParser(1700, (value) => Number(value));
let pool;
const transactionContext = new AsyncLocalStorage();
function getPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL)
    throw new Error('Configure DATABASE_URL com a ligação PostgreSQL.');
  const schema = process.env.DATABASE_SCHEMA || 'public';
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('DATABASE_SCHEMA inválido.');
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    options: `-c search_path=${schema},public`,
    ...(process.env.PGSSL === 'true'
      ? {
          ssl: {
            rejectUnauthorized: true,
          },
        }
      : {}),
  });
  pool.on('error', (error) => console.error('Ligação PostgreSQL:', error.message));
  return pool;
}
async function query(sql, params = []) {
  const client = transactionContext.getStore()?.client || getPool();
  return client.query(sql, params);
}
async function queryOne(sql, params = []) {
  return (await query(sql, params)).rows[0];
}
async function queryAll(sql, params = []) {
  return (await query(sql, params)).rows;
}
async function execute(sql, params = []) {
  const result = await query(sql, params);
  return {
    changes: result.rowCount,
    rowCount: result.rowCount,
  };
}
async function transaction(callback) {
  const current = transactionContext.getStore();
  if (current) {
    const savepoint = `nested_${++current.sequence}`;
    await current.client.query(`SAVEPOINT ${savepoint}`);
    try {
      const result = await callback();
      await current.client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return result;
    } catch (error) {
      await current.client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      throw error;
    }
  }
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await transactionContext.run(
      {
        client,
        sequence: 0,
      },
      callback,
    );
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
async function lockTransaction(resource) {
  const current = transactionContext.getStore();
  if (!current) throw new Error('O bloqueio exige uma transação ativa.');
  await current.client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [resource]);
}
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
async function connectDB() {
  await getPool().query('SELECT 1');
  const { runMigrations } = require('./schema.js');
  await runMigrations();
  return getPool();
}
exports.getPool = getPool;
exports.query = query;
exports.queryOne = queryOne;
exports.queryAll = queryAll;
exports.execute = execute;
exports.transaction = transaction;
exports.lockTransaction = lockTransaction;
exports.closeDatabase = closeDatabase;
exports.connectDB = connectDB;
