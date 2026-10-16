import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const directory = mkdtempSync(path.join(tmpdir(), 'nexo-payments-'));
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATA_DIRECTORY: directory,
  DATABASE_URL: '',
  SEED_DEMO_DATA: 'false',
  JWT_SECRET: '',
});
const { prepareTestDatabase, cleanupTestDatabase } = await import('./helpers/database.js');
await prepareTestDatabase();
const connection = await import('../src/database/connection.js');
const { default: app } = await import('../src/app.js');
const { signJwtToken } = await import('../src/middleware/auth.js');
let server;
test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await connection.closeDatabase();
  await cleanupTestDatabase();
  rmSync(directory, {
    recursive: true,
    force: true,
  });
});
test('payment simulation validates access, persists outcomes and survives a fresh process', async () => {
  await connection.connectDB();
  const now = new Date().toISOString();
  for (const id of ['owner', 'student', 'other']) {
    await connection.execute(
      'INSERT INTO utilizadores(id,email,nome_utilizador,hash_palavra_passe,nome,papel,criado_em,atualizado_em) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, `${id}@example.test`, id, 'unused', id, 'STUDENT', now, now],
    );
  }
  await connection.execute(
    'INSERT INTO espacos(id,nome,slug,categoria,id_proprietario,criado_em) VALUES($1,$2,$3,$4,$5,$6)',
    ['space', 'Space', 'space', 'Tecnologia', 'owner', now],
  );
  await connection.execute(
    'INSERT INTO cursos(id,titulo,slug,descricao,categoria,e_gratuito,preco,id_criador,id_espaco,criado_em,atualizado_em) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    ['paid', 'Curso', 'paid', 'Descrição', 'Tecnologia', 0, 19.99, 'owner', 'space', now, now],
  );
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const token = signJwtToken({
    id: 'student',
    username: 'student',
    role: 'STUDENT',
  });
  const origin = `http://127.0.0.1:${server.address().port}/api/payments`;
  const send = (body, auth = token, suffix = '/simulate/paid') =>
    fetch(origin + suffix, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(auth
          ? {
              Authorization: `Bearer ${auth}`,
            }
          : {}),
      },
      ...(body
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    });
  assert.equal(
    (
      await send(
        {
          method: 'card',
          outcome: 'approved',
        },
        '',
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await send({
        method: 'invalid',
        outcome: 'approved',
      })
    ).status,
    400,
  );
  const declined = await (
    await send({
      method: 'mbway',
      outcome: 'declined',
    })
  ).json();
  assert.equal(declined.status, 'declined');
  assert.equal((await connection.queryOne('SELECT COUNT(*) AS count FROM enrollments')).count, 0);
  const approved = await (
    await send({
      method: 'multibanco',
      outcome: 'approved',
      amountCents: 1,
    })
  ).json();
  assert.equal(approved.amountCents, 1999);
  assert.equal(approved.status, 'approved');
  assert.equal((await connection.queryOne('SELECT COUNT(*) AS count FROM memberships')).count, 1);
  assert.equal(
    (
      await (
        await send({
          method: 'card',
          outcome: 'approved',
        })
      ).json()
    ).alreadyEnrolled,
    true,
  );
  assert.equal((await (await send(null, token, '')).json()).length, 2);
  const otherToken = signJwtToken({
    id: 'other',
    username: 'other',
    role: 'STUDENT',
  });
  assert.deepEqual(await (await send(null, otherToken, '')).json(), []);
  // A new runtime reopens the same file and verifies the token from before restart.
  const script = `
    const db = await import('./src/database/connection.js');
    await db.connectDB();
    const { verifyJwtToken } = await import('./src/middleware/auth.js');
    console.log(JSON.stringify({ user: verifyJwtToken(process.env.TEST_TOKEN).id,
      payments: (await db.queryOne('SELECT COUNT(*) AS count FROM simulacoes_pagamento')).count,
      enrollments: (await db.queryOne('SELECT COUNT(*) AS count FROM enrollments')).count }));
    await db.closeDatabase();`;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: {
      ...process.env,
      TEST_TOKEN: token,
    },
    encoding: 'utf8',
  });
  assert.deepEqual(JSON.parse(output.trim().split('\n').at(-1)), {
    user: 'student',
    payments: 2,
    enrollments: 1,
  });
});
