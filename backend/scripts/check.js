import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
let count = 0;
for (const directory of ['src', 'scripts', 'tests']) {
  for (const file of fs.readdirSync(path.join(root, directory), { recursive: true })) {
    if (!file.endsWith('.js')) continue;
    execFileSync(process.execPath, ['--check', path.join(root, directory, file)], {
      stdio: 'inherit',
    });
    count++;
  }
}
console.log(`${count} ficheiros JavaScript verificados.`);
