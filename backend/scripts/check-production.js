require('../src/config/environment.js');

const { validateProductionEnvironment } = require('../src/config/production.js');
const { getPool, closeDatabase } = require('../src/database/connection.js');

async function main() {
  const errors = validateProductionEnvironment(process.env);

  if (errors.length) throw new Error(errors.join('\n'));

  // Read-only check: never seed, migrate, rotate credentials or delete accounts.
  const { rows } = await getPool().query(
    "SELECT COUNT(*)::int AS count FROM utilizadores WHERE id LIKE 'demo-%'",
  );

  if (rows[0].count) {
    throw new Error(
      'Existem contas de demonstração. Use uma base de produção limpa ou reveja essas contas antes da publicação.',
    );
  }

  const { verifyEmailTransport } = require('../src/config/email.js');

  await verifyEmailTransport();
  console.log('Configuração de produção, PostgreSQL e ligação SMTP verificados.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
