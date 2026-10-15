import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, db } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runSeed() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Dados de demonstração não podem ser inseridos em produção.');
  process.env.SEED_DEMO_DATA = 'true';
  console.log('A inserir dados de demonstração locais...');
  await connectDB();
  const { initializeSchemaAndSeed } = await import('./init.js');
  initializeSchemaAndSeed(db);
  console.log('Seed concluído com sucesso.');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Erro ao executar seed:', err);
  process.exit(1);
});
