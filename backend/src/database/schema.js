const { readFileSync, readdirSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { getPool } = require('./connection.js');
async function runMigrations() {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(63842915)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS nexo_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );
    const directory = require('node:path').resolve(__dirname, './migrations/');
    for (const name of readdirSync(directory)
      .filter((file) => file.endsWith('.sql'))
      .sort()) {
      const sql = readFileSync(
        require('node:path').resolve(__dirname, `./migrations/${name}`),
        'utf8',
      );
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = (
        await client.query('SELECT checksum FROM nexo_migrations WHERE name = $1', [name])
      ).rows[0];
      if (existing && existing.checksum !== checksum)
        throw new Error(`A migração ${name} foi alterada depois de aplicada.`);
      if (!existing) {
        await client.query(sql);
        await client.query('INSERT INTO nexo_migrations(name, checksum) VALUES ($1, $2)', [
          name,
          checksum,
        ]);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
exports.runMigrations = runMigrations;
