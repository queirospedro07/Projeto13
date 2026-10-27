const {
  ligarBaseDados,
  fecharBaseDados,
  consultarUm,
  executar,
  transacao,
} = require('../src/base-dados/ligacao.js');

async function principal() {
  try {
    const nomeUtilizador = process.argv[2];
    if (!nomeUtilizador || !/^[a-zA-Z0-9_.]{3,30}$/.test(nomeUtilizador)) {
      throw new Error('Utilização: npm run account:promote -- nome_utilizador');
    }

    await ligarBaseDados();

    const utilizador = await consultarUm(
      'SELECT id, papel, admin_formador FROM utilizadores WHERE lower(nome_utilizador) = lower($1)',
      [nomeUtilizador],
    );
    if (!utilizador) throw new Error('Conta não encontrada. Nenhuma conta foi criada ou alterada.');
    if (utilizador.papel !== 'ADMIN' || utilizador.admin_formador !== 1) {
      await transacao(
        async () =>
          await executar(
            "UPDATE utilizadores SET papel = 'ADMIN', admin_formador = 1, versao_sessao = versao_sessao + 1, atualizado_em = $1 WHERE id = $2",
            [new Date().toISOString(), utilizador.id],
          ),
      );
    }

    console.log(
      `${nomeUtilizador}: administrador e formador. A palavra-passe foi conservada. Inicie sessão novamente.`,
    );
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
