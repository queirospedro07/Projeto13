import { connectDB, execute, transaction, db } from '../src/database/connection.js';
import { User } from '../src/models/User.js';
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
  if (User.findByEmail(email) || User.findByUsername(username))
    throw new Error('A conta já existe. Nenhuma conta foi promovida ou alterada.');
  const user = await User.create({ name, username, email, password });
  transaction(() => execute("UPDATE utilizadores SET papel = 'ADMIN' WHERE id = ?", [user.id]));
  console.log('Conta de administração criada.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  db?.close();
}
