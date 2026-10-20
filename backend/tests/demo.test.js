import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const directory = mkdtempSync(path.join(tmpdir(), 'nexo-demo-'));

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATA_DIRECTORY: directory,
  DATABASE_URL: '',
  SEED_DEMO_DATA: 'false',
});

const { prepareTestDatabase, cleanupTestDatabase } = await import('./helpers/database.js');

await prepareTestDatabase();

const connection = await import('../src/database/connection.js');
const { seedDemoShowcaseData } = await import('../src/database/demoSeed.js');
const { demoLogin } = await import('../src/controllers/auth.controller.js');

test.after(async () => {
  await connection.closeDatabase();
  await cleanupTestDatabase();
  rmSync(directory, {
    recursive: true,
    force: true,
  });
});
test('demo setup is additive, repeatable and never resets existing users or content', async () => {
  await connection.connectDB();

  const now = new Date().toISOString();

  await connection.execute(
    'INSERT INTO utilizadores (id,email,nome_utilizador,hash_palavra_passe,nome,papel,criado_em,atualizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    ['real-admin', 'real@example.test', 'real_admin', 'unchanged', 'Admin', 'ADMIN', now, now],
  );
  await seedDemoShowcaseData({
    teacherId: 'real-admin',
  });
  assert.equal((await connection.queryOne('SELECT COUNT(*) AS count FROM utilizadores')).count, 9);
  assert.equal((await connection.queryOne('SELECT COUNT(*) AS count FROM cursos')).count, 5);
  assert.equal(
    (await connection.queryOne("SELECT id_criador FROM cursos WHERE id = 'demo-course-html-css'"))
      .id_criador,
    'real-admin',
  );

  const student = await connection.queryOne(
    "SELECT * FROM utilizadores WHERE id = 'demo-student-marta'",
  );

  assert.ok(await bcrypt.compare('nexoDemo2026!', student.hash_palavra_passe));
  await connection.execute(
    "UPDATE utilizadores SET url_avatar = 'edited', hash_palavra_passe = 'edited-password' WHERE id = 'demo-student-marta'",
  );
  await connection.execute(
    "UPDATE cursos SET titulo = 'Edited course' WHERE id = 'demo-course-sql'",
  );
  await seedDemoShowcaseData();
  assert.equal((await connection.queryOne('SELECT COUNT(*) AS count FROM utilizadores')).count, 9);
  assert.equal(
    (
      await connection.queryOne(
        "SELECT hash_palavra_passe FROM utilizadores WHERE id = 'real-admin'",
      )
    ).hash_palavra_passe,
    'unchanged',
  );

  const edited = await connection.queryOne(
    "SELECT * FROM utilizadores WHERE id = 'demo-student-marta'",
  );

  assert.equal(edited.hash_palavra_passe, 'edited-password');
  assert.equal(edited.url_avatar, 'edited');
  assert.equal(
    (await connection.queryOne("SELECT titulo FROM cursos WHERE id = 'demo-course-sql'")).titulo,
    'Edited course',
  );
  process.env.NODE_ENV = 'production';
  await assert.rejects(async () => await seedDemoShowcaseData(), /produção/);
  process.env.NODE_ENV = 'test';
});
test('quick demo login cannot select a real account or an administrator', async () => {
  const response = () => ({
    statusCode: 200,
    status(code) {
      this.statusCode = code;

      return this;
    },
    json(body) {
      this.body = body;

      return this;
    },
  });
  let res = response();

  await demoLogin(
    {
      params: {
        role: 'creator',
      },
    },
    res,
  );
  assert.equal(res.statusCode, 403);
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_DEMO_LOGIN = 'true';
  res = response();
  await demoLogin(
    {
      params: {
        role: 'admin',
      },
    },
    res,
  );
  assert.equal(res.statusCode, 400);
  res = response();
  await demoLogin(
    {
      params: {
        role: 'creator',
      },
    },
    res,
  );
  assert.equal(res.body.user.id, 'demo-creator-sofia');
  assert.equal(res.body.user.role, 'CREATOR');
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_DEMO_LOGIN = 'false';
});
