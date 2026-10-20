const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { getPool, closeDatabase } = require('../src/database/connection.js');
const { getDataDirectory } = require('../src/config/storage.js');

async function main() {
  const directory = path.join(getDataDirectory(), 'backups');

  fs.mkdirSync(directory, {
    recursive: true,
  });

  const destination = path.join(
    directory,
    `nexo-postgresql-${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}.json`,
  );
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');

    const names = (
      await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename <> 'nexo_migrations' ORDER BY tablename",
      )
    ).rows.map((row) => row.tablename);
    const tables = {};
    for (const name of names) tables[name] = (await client.query(`SELECT * FROM "${name}"`)).rows;
    fs.writeFileSync(
      destination,
      JSON.stringify({
        format: 'nexo-postgresql-v1',
        createdAt: new Date().toISOString(),
        tables,
      }),
      {
        flag: 'wx',
        mode: 0o600,
      },
    );
    await client.query('COMMIT');
    console.log('Backup PostgreSQL criado:', destination);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closeDatabase();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
