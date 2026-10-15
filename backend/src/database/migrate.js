import { connectDB, db } from './connection.js';
try {
  await connectDB();
  console.log('Estrutura SQLite atualizada sem repor dados.');
  db.close();
} catch (error) {
  console.error('Migração interrompida:', error.message);
  process.exitCode = 1;
}
