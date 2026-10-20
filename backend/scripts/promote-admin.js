const {
  connectDB,
  closeDatabase,
  queryOne,
  execute,
  transaction,
} = require('../src/database/connection.js');
async function main() {
  try {
    const username = process.argv[2];
    if (!username || !/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
      throw new Error('Utilização: npm run account:promote -- nome_utilizador');
    }
    await connectDB();
    const user = await queryOne(
      'SELECT id, papel, admin_formador FROM utilizadores WHERE lower(nome_utilizador) = lower($1)',
      [username],
    );
    if (!user) throw new Error('Conta não encontrada. Nenhuma conta foi criada ou alterada.');
    if (user.papel !== 'ADMIN' || user.admin_formador !== 1) {
      await transaction(
        async () =>
          await execute(
            "UPDATE utilizadores SET papel = 'ADMIN', admin_formador = 1, versao_sessao = versao_sessao + 1, atualizado_em = $1 WHERE id = $2",
            [new Date().toISOString(), user.id],
          ),
      );
    }
    console.log(
      `${username}: administrador e formador. A palavra-passe foi conservada. Inicie sessão novamente.`,
    );
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
