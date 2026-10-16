const { connectDB, execute, transaction, closeDatabase } = require('../src/database/connection.js');
const User = require('../src/models/User.js');
async function main() {
  const email = process.env.ADMIN_EMAIL,
    username = process.env.ADMIN_USERNAME,
    password = process.env.ADMIN_PASSWORD,
    name = process.env.ADMIN_NAME || 'Administração';
  try {
    if (
      !email ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !username ||
      !/^\w{3,30}$/.test(username) ||
      !password ||
      password.length < 12 ||
      Buffer.byteLength(password, 'utf8') > 72
    )
      throw new Error(
        'Configure ADMIN_EMAIL, ADMIN_USERNAME e ADMIN_PASSWORD (mínimo de 12 caracteres e máximo de 72 bytes) no ambiente.',
      );
    await connectDB();
    if ((await User.findByEmail(email)) || (await User.findByUsername(username)))
      throw new Error('A conta já existe. Nenhuma conta foi promovida ou alterada.');
    const user = await User.create({
      name,
      username,
      email,
      password,
    });
    await transaction(
      async () => await execute("UPDATE utilizadores SET papel = 'ADMIN' WHERE id = $1", [user.id]),
    );
    console.log('Conta de administração criada.');
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
