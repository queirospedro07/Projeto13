const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');
const { Client } = require('pg');

async function main() {
  const root = path.resolve(__dirname, '../..');
  const env = dotenv.parse(fs.readFileSync(path.join(root, 'backend/.env'), 'utf8'));

  if (env.LOCAL_POSTGRES_DOCKER !== 'true') return;

  const url = new URL(env.DATABASE_URL);

  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== '5433') {
    throw new Error('A sincronizacao so e permitida no PostgreSQL local gerido pelo projeto.');
  }

  const client = new Client({ connectionString: url.href, connectionTimeoutMillis: 5000 });

  try {
    await client.connect();

    return;
  } catch (error) {
    if (error.code !== '28P01') throw error;
  } finally {
    await client.end();
  }

  // PostgreSQL only applies POSTGRES_PASSWORD when initializing an empty volume.
  // Reconcile an existing local volume through its trusted Unix socket instead
  // of deleting data or exposing the password in command-line arguments.
  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = decodeURIComponent(url.pathname.slice(1));
  const identifier = `"${username.replaceAll('"', '""')}"`;
  const literal = `'${password.replaceAll("'", "''")}'`;
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      'nexo-postgres',
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      username,
      '-d',
      database,
    ],
    {
      input: `SET standard_conforming_strings = on;\nALTER ROLE ${identifier} WITH PASSWORD ${literal};\n`,
      encoding: 'utf8',
      timeout: 15000,
      windowsHide: true,
    },
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      'Nao foi possivel sincronizar a credencial do PostgreSQL local. Os dados foram preservados.',
    );
  }

  console.log('Credencial do PostgreSQL local sincronizada; dados preservados.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
