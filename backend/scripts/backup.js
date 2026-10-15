import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getDatabasePath } from '../src/database/connection.js';
const source = getDatabasePath();
if (!fs.existsSync(source))
  throw new Error('Base de dados não encontrada. Não foi criado um ficheiro vazio.');
const output = path.resolve(path.dirname(source), 'backups');
fs.mkdirSync(output, { recursive: true });
const destination = path.join(
  output,
  `nexo-${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}.db`,
);
const db = new DatabaseSync(source, { readOnly: true });
try {
  db.prepare('VACUUM INTO ?').run(destination);
  console.log('Cópia de segurança criada:', destination);
} finally {
  db.close();
}
