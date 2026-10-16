const { connectDB, closeDatabase } = require('./connection.js');
async function main() {
  try {
    await connectDB();
    console.log('Migracoes PostgreSQL verificadas sem repor dados.');
    await closeDatabase();
  } catch (error) {
    console.error('Migração interrompida:', error.message);
    process.exitCode = 1;
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
