const { ligarBaseDados, fecharBaseDados, consultarUm } = require('./connection.js');
const { prepararDadosDemonstracao } = require('./demoData.js');

async function principal() {
  try {
    if (process.env.NODE_ENV === 'production')
      throw new Error('Demonstração indisponível em produção.');
    process.env.SEED_DEMO_DATA = 'false';
    await ligarBaseDados();

    const nomeUtilizador = process.argv[2];
    const formador = nomeUtilizador
      ? await consultarUm('SELECT id FROM utilizadores WHERE lower(nome_utilizador) = lower($1)', [
          nomeUtilizador,
        ])
      : null;
    if (nomeUtilizador && !formador) throw new Error('Conta responsável não encontrada.');
    await prepararDadosDemonstracao({
      idFormadorResponsavel: formador?.id,
    });
    console.log(
      'Demonstração preparada: 5 cursos, 2 formadores e 6 alunos. Dados existentes conservados.',
    );
    console.log(
      'Contas: sofia.almeida, miguel.ferreira, marta.lopes, diogo.costa, beatriz.martins, joao.neves, ines.carvalho, rafael.moreira.',
    );
    console.log('Palavra-passe inicial das contas demo: nexoDemo2026!');
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
