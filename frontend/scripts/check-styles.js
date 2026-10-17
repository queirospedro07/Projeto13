import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../src');
const violations = fs
  .readdirSync(root, { recursive: true })
  .filter((file) => file.endsWith('.css'))
  .filter((file) => /!\s*important\b/i.test(fs.readFileSync(path.join(root, file), 'utf8')));
if (violations.length) {
  console.error('Resolva a prioridade com camadas CSS e seletores, sem !important:', ...violations);
  process.exitCode = 1;
} else {
  console.log('Estilos verificados: sem !important.');
}
