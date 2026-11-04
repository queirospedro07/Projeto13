require('../src/config/environment.js');

const { validarAmbienteProducao } = require('../src/config/production.js');
const { obterConjuntoLigacoes, fecharBaseDados } = require('../src/database/connection.js');

async function principal() {
  const erros = validarAmbienteProducao(process.env);
  if (erros.length) throw new Error(erros.join('\n'));

  // Read-only check: never seed, migrate, rotate credentials or delete accounts.
  const { rows: registos } = await obterConjuntoLigacoes().query(
    "SELECT COUNT(*)::int AS count FROM utilizadores WHERE id LIKE 'demo-%'",
  );
  if (registos[0].count) {
    throw new Error(
      'Existem contas de demonstração. Use uma base de produção limpa ou reveja essas contas antes da publicação.',
    );
  }

  console.log('Configuração de produção e PostgreSQL verificados.');
}

principal()
  .catch((erro) => {
    console.error(erro.message);
    process.exitCode = 1;
  })
  .finally(fecharBaseDados);
