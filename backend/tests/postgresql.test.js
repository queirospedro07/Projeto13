import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { prepareTestDatabase, cleanupTestDatabase } from './helpers/database.js';

process.env.NODE_ENV = 'test';

const directory = mkdtempSync(path.join(tmpdir(), 'nexo-postgresql-'));

process.env.DATA_DIRECTORY = directory;
await prepareTestDatabase();

const connection = await import('../src/database/connection.js');
const { simulatePayment } = await import('../src/services/payments.js');
const { default: app } = await import('../src/app.js');
const { signJwtToken } = await import('../src/middleware/auth.js');
let server;

test.before(async () => {
  await connection.connectDB();

  const now = new Date().toISOString();
  for (const id of ['teacher', 'student']) {
    await connection.execute(
      'INSERT INTO utilizadores(id,email,nome_utilizador,hash_palavra_passe,nome,papel,criado_em,atualizado_em) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, `${id}@example.test`, id, 'unused', id, 'STUDENT', now, now],
    );
  }

  for (const [id, price] of [
    ['free', 0],
    ['paid', 19.99],
  ]) {
    await connection.execute(
      'INSERT INTO cursos(id,titulo,slug,descricao,categoria,id_criador,preco,e_gratuito,criado_em,atualizado_em) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [id, id, id, 'Teste concorrente', 'programming', 'teacher', price, price ? 0 : 1, now, now],
    );
  }

  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
});
test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await connection.closeDatabase();
  await cleanupTestDatabase();
  assert.ok(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep));
  rmSync(directory, {
    recursive: true,
    force: true,
  });
});
test('simultaneous approved payments create one charge simulation and one enrollment', async () => {
  const results = await Promise.all(
    Array.from(
      {
        length: 8,
      },
      () =>
        simulatePayment(
          {
            id: 'student',
          },
          'paid',
          {
            method: 'card',
            outcome: 'approved',
          },
        ),
    ),
  );

  assert.equal(results.filter((result) => result.status === 'approved').length, 1);
  assert.equal((await connection.queryOne('SELECT COUNT(*) AS n FROM simulacoes_pagamento')).n, 1);
  assert.equal(
    (await connection.queryOne('SELECT COUNT(*) AS n FROM enrollments WHERE "courseId" = \'paid\''))
      .n,
    1,
  );
});
test('course aggregates retain numeric API types after the PostgreSQL migration', async () => {
  await connection.execute(
    'INSERT INTO avaliacoes(id,id_curso,id_utilizador,classificacao,comentario,criado_em) VALUES ($1,$2,$3,$4,$5,$6)',
    ['rating', 'free', 'student', 4, 'Teste de avaliação', new Date().toISOString()],
  );

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/courses`);
  const course = (await response.json()).find((item) => item.id === 'free');

  assert.equal(course.averageRating, 4);
  assert.equal(typeof course.reviewsCount, 'number');
  assert.equal(typeof course.price, 'number');
});
test('simultaneous free enrollments remain idempotent', async () => {
  const token = signJwtToken({
    id: 'student',
    role: 'STUDENT',
  });
  const url = `http://127.0.0.1:${server.address().port}/api/courses/free/enroll`;
  const responses = await Promise.all(
    Array.from(
      {
        length: 8,
      },
      () =>
        fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
    ),
  );

  assert.ok(responses.every((response) => [200, 201].includes(response.status)));
  assert.equal(
    (await connection.queryOne('SELECT COUNT(*) AS n FROM enrollments WHERE "courseId" = \'free\''))
      .n,
    1,
  );
  assert.equal((await connection.queryOne('SELECT COUNT(*) AS n FROM notifications')).n, 1);
});

test('native PostgreSQL handles combined filters, profile fields and course moderation', async () => {
  const { default: Course } = await import('../src/models/Course.js');
  const { default: Creator } = await import('../src/models/Creator.js');
  const { default: User } = await import('../src/models/User.js');
  const now = new Date().toISOString();

  await connection.execute(
    `INSERT INTO cursos (id,titulo,slug,descricao,categoria,dificuldade,id_criador,preco,e_gratuito,e_publicado,estado_aprovacao,criado_em,atualizado_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,0,1,1,'APPROVED',$8,$8)`,
    [
      'native-sql',
      'SQL regression',
      'native-sql',
      'Combined filters',
      'custom',
      'beginner',
      'teacher',
      now,
    ],
  );
  try {
    const courses = await Course.search({
      search: 'regression',
      category: 'custom',
      difficulty: 'beginner',
      sort: 'popular',
    });

    assert.deepEqual(
      courses.map((course) => course.id),
      ['native-sql'],
    );

    const updated = await User.update('teacher', {
      name: 'Updated teacher',
      bio: 'Profile regression',
    });

    assert.equal(updated.name, 'Updated teacher');

    const fields = [
      null,
      null,
      null,
      null,
      null,
      0,
      1,
      1,
      null,
      null,
      null,
      null,
      1,
      'open',
      1,
      1,
      '[]',
      '[]',
      '[]',
      now,
      'native-sql',
    ];

    await Creator.updateCourseDetails(true, fields);
    assert.equal((await Creator.findCoursesById(['native-sql'])).approvalStatus, 'APPROVED');
    await Creator.updateCourseDetails(false, fields);
    assert.equal((await Creator.findCoursesById(['native-sql'])).approvalStatus, 'DRAFT');
  } finally {
    await connection.execute('DELETE FROM cursos WHERE id = $1', ['native-sql']);
  }
});
test('failed transactions roll back and savepoints isolate nested failures', async () => {
  await assert.rejects(
    connection.transaction(async () => {
      await connection.execute("UPDATE utilizadores SET nome = 'Rollback' WHERE id = 'student'");
      throw new Error('intentional rollback');
    }),
  );
  assert.equal(
    (await connection.queryOne("SELECT nome FROM utilizadores WHERE id = 'student'")).nome,
    'student',
  );
  await connection.transaction(async () => {
    await connection.execute("UPDATE utilizadores SET nome = 'Outer' WHERE id = 'student'");
    await assert.rejects(
      connection.transaction(async () => {
        await connection.execute("UPDATE utilizadores SET nome = 'Inner' WHERE id = 'student'");
        throw new Error('intentional savepoint rollback');
      }),
    );
    assert.equal(
      (await connection.queryOne("SELECT nome FROM utilizadores WHERE id = 'student'")).nome,
      'Outer',
    );
  });
});
test('PostgreSQL backups restore into an empty schema without overwriting existing data', async () => {
  const cwd = path.resolve(import.meta.dirname, '..');

  execFileSync(process.execPath, ['scripts/backup.js'], {
    cwd,
    env: process.env,
  });

  const filename = path.join(directory, 'backups', readdirSync(path.join(directory, 'backups'))[0]);

  assert.throws(() =>
    execFileSync(process.execPath, ['scripts/restore.js', filename], {
      cwd,
      env: process.env,
      stdio: 'pipe',
    }),
  );

  const schema = `restore_${process.pid}`;

  await connection.getPool().query(`CREATE SCHEMA "${schema}"`);
  try {
    execFileSync(process.execPath, ['scripts/restore.js', filename], {
      cwd,
      env: {
        ...process.env,
        DATABASE_SCHEMA: schema,
      },
    });

    const restored = await connection
      .getPool()
      .query(`SELECT COUNT(*) AS n FROM "${schema}".inscricoes`);

    assert.equal(Number(restored.rows[0].n), 2);
  } finally {
    await connection.getPool().query(`DROP SCHEMA "${schema}" CASCADE`);
  }
});
