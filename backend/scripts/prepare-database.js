const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const dotenv = require('dotenv');

async function main() {
  const root = path.resolve(__dirname, '../..');
  const environmentFile = path.join(root, 'backend/.env');
  let source = fs.readFileSync(environmentFile, 'utf8');
  const env = dotenv.parse(source);
  if (env.LOCAL_POSTGRES_DOCKER !== 'true') {
    console.log('external');
    process.exit(0);
  }

  if (!env.DATABASE_URL || env.DATABASE_URL.includes('CHANGE_ME')) {
    env.DATABASE_URL = `postgresql://nexo:${randomBytes(24).toString('hex')}@127.0.0.1:5433/nexo`;
    source =
      source.replace(/^DATABASE_URL=.*\r?\n?/gm, '') + `\nDATABASE_URL=${env.DATABASE_URL}\n`;
    fs.writeFileSync(environmentFile, source);
  }

  const url = new URL(env.DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== '5433')
    throw new Error('LOCAL_POSTGRES_DOCKER exige DATABASE_URL local na porta 5433.');
  const values = {
    POSTGRES_USER: decodeURIComponent(url.username),
    POSTGRES_PASSWORD: decodeURIComponent(url.password),
    POSTGRES_DB: url.pathname.slice(1),
  };
  if (Object.values(values).some((value) => !value || /[\r\n]/.test(value)))
    throw new Error('Configuração PostgreSQL local inválida.');
  fs.mkdirSync(path.join(root, '.runtime'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, '.runtime/postgres.env'),
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n',
    {
      mode: 0o600,
    },
  );
  console.log('managed');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
