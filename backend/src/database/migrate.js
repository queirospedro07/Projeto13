const { ligarBaseDados, fecharBaseDados } = require('./connection.js');

async function principal() {
  try {
    await ligarBaseDados();
    console.log('Migracoes PostgreSQL verificadas sem repor dados.');
    await fecharBaseDados();
  } catch (erro) {
    console.error('Migração interrompida:', erro.message);
    process.exitCode = 1;
  }
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exitCode = 1;
});
