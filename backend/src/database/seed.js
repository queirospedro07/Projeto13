const { connectDB, closeDatabase, queryOne } = require('./connection.js');
const { seedDemoShowcaseData } = require('./demoSeed.js');
async function main() {
  try {
    if (process.env.NODE_ENV === 'production')
      throw new Error('Demonstração indisponível em produção.');
    process.env.SEED_DEMO_DATA = 'false';
    await connectDB();
    const username = process.argv[2];
    const teacher = username
      ? await queryOne('SELECT id FROM utilizadores WHERE lower(nome_utilizador) = lower($1)', [
          username,
        ])
      : null;
    if (username && !teacher) throw new Error('Conta responsável não encontrada.');
    await seedDemoShowcaseData({
      teacherId: teacher?.id,
    });
    console.log(
      'Demonstração preparada: 5 cursos, 2 formadores e 6 alunos. Dados existentes conservados.',
    );
    console.log(
      'Contas: sofia.almeida, miguel.ferreira, marta.lopes, diogo.costa, beatriz.martins, joao.neves, ines.carvalho, rafael.moreira.',
    );
    console.log('Palavra-passe inicial das contas demo: nexoDemo2026!');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
