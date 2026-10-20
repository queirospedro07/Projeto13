import { randomUUID } from 'node:crypto';
import pg from 'pg';

let schema;
let databaseUrl;

export async function prepareTestDatabase() {
  databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl)
    throw new Error(
      'Configure TEST_DATABASE_URL com uma base PostgreSQL descartável. Os testes não usam DATABASE_URL nem a base real por defeito.',
    );
  schema = `test_${process.pid}_${randomUUID().replaceAll('-', '')}`;

  const pool = new pg.Pool({
    connectionString: databaseUrl,
  });
  try {
    await pool.query(`CREATE SCHEMA "${schema}"`);
  } finally {
    await pool.end();
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_SCHEMA = schema;
}

export async function cleanupTestDatabase() {
  if (!schema) return;
  const pool = new pg.Pool({
    connectionString: databaseUrl,
  });
  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await pool.end();
  }
}
