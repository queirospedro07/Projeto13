import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, db } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runSeed() {
  console.log('🌱 A executar seed de dados iniciais...');
  await connectDB();
  const { initializeSchemaAndSeed } = await import('./init.js');
  initializeSchemaAndSeed(db);
  console.log('✅ Dados de seed criados com sucesso (contas demo, cursos e comunidade prontos).');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Falha ao executar seed:', err);
  process.exit(1);
});
