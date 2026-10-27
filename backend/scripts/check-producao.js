require('../src/configuracao/ambiente.js');

const { validarAmbienteProducao } = require('../src/configuracao/producao.js');
const { obterConjuntoLigacoes, fecharBaseDados } = require('../src/base-dados/ligacao.js');

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

  const { verificarEmailTransporte } = require('../src/configuracao/email.js');

  await verificarEmailTransporte();
  console.log('Configuração de produção, PostgreSQL e ligação SMTP verificados.');
}

principal()
  .catch((erro) => {
    console.error(erro.message);
    process.exitCode = 1;
  })
  .finally(fecharBaseDados);
