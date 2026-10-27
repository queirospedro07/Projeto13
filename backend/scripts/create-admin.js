const {
  ligarBaseDados,
  executar,
  transacao,
  fecharBaseDados,
} = require('../src/base-dados/ligacao.js');
const Utilizador = require('../src/modelos/Utilizador.js');

async function principal() {
  const email = process.env.ADMIN_EMAIL;
  const nomeUtilizador = process.env.ADMIN_USERNAME;
  const palavraPasse = process.env.ADMIN_PASSWORD;
  const nome = process.env.ADMIN_NAME || 'Administração';
  try {
    if (
      !email ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !nomeUtilizador ||
      !/^\w{3,30}$/.test(nomeUtilizador) ||
      !palavraPasse ||
      palavraPasse.length < 12 ||
      Buffer.byteLength(palavraPasse, 'utf8') > 72
    )
      throw new Error(
        'Configure ADMIN_EMAIL, ADMIN_USERNAME e ADMIN_PASSWORD (mínimo de 12 caracteres e máximo de 72 bytes) no ambiente.',
      );
    await ligarBaseDados();
    if (
      (await Utilizador.procurarPorEmail(email)) ||
      (await Utilizador.procurarPorNomeUtilizador(nomeUtilizador))
    )
      throw new Error('A conta já existe. Nenhuma conta foi promovida ou alterada.');
    const utilizador = await Utilizador.criar({
      name: nome,
      username: nomeUtilizador,
      email,
      password: palavraPasse,
    });

    await transacao(
      async () =>
        await executar("UPDATE utilizadores SET papel = 'ADMIN' WHERE id = $1", [utilizador.id]),
    );
    console.log('Conta de administração criada.');
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  } finally {
    await fecharBaseDados();
  }
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exitCode = 1;
});
