import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prepareTestDatabase, cleanupTestDatabase } from './helpers/database.js';

process.env.NODE_ENV = 'test';
await prepareTestDatabase();

const db = await import('../src/database/connection.js');
const { default: app } = await import('../src/app.js');
const { signJwtToken } = await import('../src/middleware/auth.js');
let server;
let origin;
const tokens = {};

async function request(route, user = 'teacher', method = 'GET', body) {
  const response = await fetch(origin + '/api' + route, {
    method,
    headers: {
      ...(user ? { Authorization: `Bearer ${tokens[user]}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return { status: response.status, body: await response.json() };
}

function body(overrides = {}) {
  return {
    title: `Curso ${randomUUID()}`,
    description: 'Curso completo para testar o fluxo de publicação.',
    category: 'programming',
    isFree: true,
    isPublished: false,
    hasCommunity: true,
    allowStudentCamera: false,
    defaultCallMode: 'stage',
    learningOutcomes: ['Aprender programação'],
    channels: [
      { name: 'geral', type: 'text' },
      { name: 'voz', type: 'voice' },
    ],
    modules: [
      {
        title: 'Introdução',
        lessons: [
          {
            title: 'Primeira aula',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          },
        ],
      },
    ],
    ...overrides,
  };
}

test.before(async () => {
  await db.connectDB();
  for (const [id, role] of [
    ['teacher', 'CREATOR'],
    ['other', 'CREATOR'],
    ['admin', 'ADMIN'],
    ['student', 'STUDENT'],
  ]) {
    await db.execute(
      'INSERT INTO utilizadores(id,email,nome_utilizador,nome,hash_palavra_passe,papel,criado_em,atualizado_em) VALUES($1,$2,$1,$1,$3,$4,$5,$5)',
      [id, `${id}@example.test`, 'unused', role, new Date().toISOString()],
    );
    tokens[id] = signJwtToken({ id, role });
  }

  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await db.closeDatabase();
  await cleanupTestDatabase();
});

test('draft, submission, rejection feedback, correction and approval form a persistent workflow', async () => {
  const created = await request('/creator/courses', 'teacher', 'POST', body());

  assert.equal(created.status, 201);

  const id = created.body.id;
  const route = `/creator/courses/${id}`;

  assert.equal(created.body.approvalStatus, 'DRAFT');
  assert.equal((await request(route + '/submit-review', 'student', 'POST', {})).status, 403);
  assert.equal((await request(route + '/submit-review', 'teacher', 'POST', {})).status, 200);
  assert.equal((await request(route + '/submit-review', 'teacher', 'POST', {})).status, 200);

  const adminNotifications = (await request('/notifications', 'admin')).body;

  assert.equal(adminNotifications.filter((item) => item.title === 'Curso para revisão').length, 1);

  let current = (await request(route)).body;

  assert.equal(current.approvalStatus, 'PENDING');
  assert.equal(
    (
      await request(`/admin/courses/${id}/approve`, 'admin', 'PUT', {
        expectedUpdatedAt: 'old-version',
      })
    ).status,
    409,
  );
  assert.equal(
    (await request(`/admin/courses/${id}/reject`, 'admin', 'PUT', { notes: ' ' })).status,
    400,
  );

  const notes = 'Explique melhor os objetivos da primeira aula.';

  assert.equal(
    (
      await request(`/admin/courses/${id}/reject`, 'admin', 'PUT', {
        notes,
        expectedUpdatedAt: current.updatedAt,
      })
    ).status,
    200,
  );
  current = (await request(route)).body;
  assert.equal(current.adminNotes, notes);
  assert.equal(current.approvalStatus, 'REJECTED');
  assert.equal((await request(route, 'other')).status, 404);

  const notification = (await request('/notifications')).body.find((item) =>
    item.content.includes(notes),
  );

  assert.equal(notification.link, `/creator/courses/${id}/edit`);
  await request(`/notifications/${notification.id}/read`, 'other', 'PUT', {});
  assert.equal(
    (await request('/notifications')).body.find((item) => item.id === notification.id).isRead,
    false,
  );
  await request(`/notifications/${notification.id}/read`, 'teacher', 'PUT', {});
  assert.equal(
    (await request('/notifications')).body.find((item) => item.id === notification.id).isRead,
    true,
  );
  assert.equal((await request(route + '/submit-review', 'teacher', 'POST', {})).status, 409);
  assert.equal(
    (
      await request(route, 'teacher', 'PUT', {
        title: 'Curso corrigido',
        expectedUpdatedAt: current.updatedAt,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(route, 'teacher', 'PUT', {
        title: 'Alteração atrasada',
        expectedUpdatedAt: current.updatedAt,
      })
    ).status,
    409,
  );
  current = (await request(route)).body;
  assert.equal(current.title, 'Curso corrigido');
  assert.equal(current.adminNotes, notes);
  assert.equal(current.allowStudentCamera, false);
  assert.equal(current.defaultCallMode, 'stage');
  assert.deepEqual(current.learningOutcomes, ['Aprender programação']);
  assert.equal((await request(route + '/submit-review', 'teacher', 'POST', {})).status, 200);
  current = (await request(route)).body;

  const approve = () =>
    request(`/admin/courses/${id}/approve`, 'admin', 'PUT', {
      expectedUpdatedAt: current.updatedAt,
    });
  const approvals = await Promise.all([approve(), approve()]);

  assert.deepEqual(approvals.map((item) => item.status).sort(), [200, 409]);
  assert.equal((await request(route)).body.isPublished, true);
  assert.ok((await request('/courses', null)).body.some((item) => item.id === id));
  assert.equal((await request(`/courses/${id}/enroll`, 'student', 'POST', {})).status, 201);
  await request(route, 'teacher', 'PUT', {
    description: 'Descrição atualizada para uma nova revisão.',
  });
  assert.equal((await request(`/courses/${id}`, 'student')).status, 200);
  assert.equal((await request(`/courses/${id}`, null)).status, 403);
  assert.ok(!(await request('/courses', null)).body.some((item) => item.id === id));
});

test('incomplete courses and malformed content cannot be submitted or silently published', async () => {
  const created = await request(
    '/creator/courses',
    'teacher',
    'POST',
    body({ modules: [], isPublished: true }),
  );

  assert.equal(created.status, 201);
  assert.equal(created.body.isPublished, 0);
  assert.equal(
    (await request(`/creator/courses/${created.body.id}/submit-review`, 'teacher', 'POST', {}))
      .status,
    400,
  );
  assert.equal(
    (await request(`/admin/courses/${created.body.id}/approve`, 'admin', 'PUT', {})).status,
    409,
  );
  for (const invalid of [
    { durationHours: -1 },
    { defaultCallMode: 'invalid' },
    {
      channels: [
        { id: 'same', name: 'one' },
        { id: 'same', name: 'two' },
      ],
    },
    { modules: [{ title: 'Módulo', lessons: [{ title: 'Aula', type: 'text', xpReward: -100 }] }] },
  ])
    assert.equal((await request('/creator/courses', 'teacher', 'POST', body(invalid))).status, 400);
});

test('channel removal persists and category filters match exact categories without accidental AI results', async () => {
  const created = await request('/creator/courses', 'teacher', 'POST', body());
  const route = `/creator/courses/${created.body.id}`;
  const course = (await request(route)).body;

  assert.equal(course.channels.length, 2);
  await request(route, 'teacher', 'PUT', { hasCommunity: true, channels: [course.channels[0]] });
  assert.equal((await request(route)).body.channels.length, 1);
  await db.execute(
    "UPDATE cursos SET estado_aprovacao='APPROVED',e_publicado=1,categoria='Ciências & Engenharia' WHERE id=$1",
    [created.body.id],
  );
  assert.ok(
    !(await request('/courses?category=ai', null)).body.some((item) => item.id === created.body.id),
  );
  assert.ok(
    (await request('/courses?category=science', null)).body.some(
      (item) => item.id === created.body.id,
    ),
  );
});

test('completion returns a persistent certificate and never rounds unfinished courses to 100 percent', async () => {
  const now = new Date().toISOString();

  await db.execute(
    'INSERT INTO cursos(id,titulo,slug,descricao,categoria,id_criador,criado_em,atualizado_em) VALUES($1,$1,$1,$1,$2,$3,$4,$4)',
    ['certificate-course', 'programming', 'teacher', now],
  );
  await db.execute('INSERT INTO modulos_curso(id,id_curso,titulo) VALUES($1,$2,$1)', [
    'certificate-module',
    'certificate-course',
  ]);
  await db.execute(
    "INSERT INTO aulas(id,id_modulo,titulo,tipo,conteudo) SELECT 'certificate-lesson-' || n, 'certificate-module', 'Aula ' || n, 'text', 'Conteúdo' FROM generate_series(1,200) n",
  );
  await db.execute(
    'INSERT INTO inscricoes(id,id_utilizador,id_curso,inscrito_em) VALUES($1,$2,$3,$4)',
    ['certificate-enrollment', 'student', 'certificate-course', now],
  );
  await db.execute(
    "INSERT INTO progresso_aulas(id,id_inscricao,id_aula,concluido,concluido_em) SELECT 'progress-' || id, 'certificate-enrollment', id, 1, $1 FROM aulas WHERE id_modulo='certificate-module' AND id <> 'certificate-lesson-200'",
    [now],
  );

  const unfinished = await request(
    '/courses/certificate-course/lessons/certificate-lesson-1/complete',
    'student',
    'POST',
    {},
  );

  assert.equal(unfinished.status, 200);
  assert.equal(unfinished.body.enrollment.progressPercent, 99);
  assert.equal(unfinished.body.enrollment.completedAt, null);
  assert.equal(unfinished.body.certificate, null);

  const finished = await request(
    '/courses/certificate-course/lessons/certificate-lesson-200/complete',
    'student',
    'POST',
    {},
  );

  assert.equal(finished.status, 200);
  assert.equal(finished.body.enrollment.progressPercent, 100);
  assert.ok(finished.body.certificate.id);

  const certificateId = finished.body.certificate.id;
  const repeated = await request(
    '/courses/certificate-course/lessons/certificate-lesson-200/complete',
    'student',
    'POST',
    {},
  );

  assert.equal(repeated.body.certificate.id, certificateId);

  const restored = await request('/courses/certificate-course', 'student');

  assert.equal(restored.body.certificate.id, certificateId);
  assert.equal((await request('/courses/certificate-course', 'other')).body.certificate, null);
  assert.equal((await request('/certificates/verify/' + certificateId, null)).status, 200);
});

test('administrators assign independent teaching access and stale sessions lose permissions immediately', async () => {
  const now = new Date().toISOString();

  await db.execute(
    'INSERT INTO utilizadores(id,email,nome_utilizador,nome,hash_palavra_passe,papel,criado_em,atualizado_em) VALUES($1,$2,$1,$1,$3,$4,$5,$5)',
    ['role-target', 'role@example.test', 'unused', 'STUDENT', now],
  );
  tokens.target = signJwtToken({ id: 'role-target', role: 'STUDENT' });

  const route = '/admin/users/role-target/role';
  const creator = { role: 'CREATOR', isTeacher: true };

  assert.equal((await request(route, null, 'PUT', creator)).status, 401);
  assert.equal((await request(route, 'teacher', 'PUT', creator)).status, 403);
  assert.equal((await request('/admin/users/admin/role', 'admin', 'PUT', creator)).status, 403);
  assert.equal(
    (await request(route, 'admin', 'PUT', { role: 'ADMIN', isTeacher: 'true' })).status,
    400,
  );
  for (const [role, isTeacher] of [
    ['CREATOR', true],
    ['ADMIN', false],
    ['ADMIN', true],
    ['STUDENT', false],
  ]) {
    assert.equal((await request(route, 'admin', 'PUT', { role, isTeacher })).status, 200);
    assert.equal((await request('/auth/me', 'target')).status, 401);

    const row = await db.queryOne(
      'SELECT id,papel AS role,versao_sessao AS "authVersion" FROM utilizadores WHERE id=$1',
      ['role-target'],
    );

    tokens.target = signJwtToken(row);

    const me = await request('/auth/me', 'target');

    assert.equal(me.status, 200);
    assert.equal(me.body.user?.isTeacher ?? me.body.isTeacher, isTeacher);
    assert.equal((await request('/admin/stats', 'target')).status, role === 'ADMIN' ? 200 : 403);
    assert.equal((await request('/creator/stats', 'target')).status, isTeacher ? 200 : 403);
    assert.equal((await request('/projects/reviews', 'target')).status, isTeacher ? 200 : 403);
    assert.equal((await request('/quizzes/reviews', 'target')).status, isTeacher ? 200 : 403);
  }

  const admin = (await request('/auth/me', 'admin')).body;

  assert.equal(admin.user?.isTeacher ?? admin.isTeacher, true);
});

test('dedicated assessment endpoints show only work from the instructor courses and persist feedback', async () => {
  const now = new Date().toISOString();
  const submissions = {};
  for (const teacher of ['teacher', 'other']) {
    const id = `assessment-${teacher}`;

    await db.execute(
      'INSERT INTO cursos(id,titulo,slug,descricao,categoria,id_criador,criado_em,atualizado_em) VALUES($1,$1,$1,$1,$2,$3,$4,$4)',
      [id, 'programming', teacher, now],
    );
    await db.execute('INSERT INTO modulos_curso(id,id_curso,titulo) VALUES($1,$1,$1)', [id]);
    await db.execute(
      "INSERT INTO aulas(id,id_modulo,titulo,tipo,conteudo) VALUES($1,$1,$1,'project','Projeto prático')",
      [id],
    );
    await db.execute(
      'INSERT INTO inscricoes(id,id_utilizador,id_curso,inscrito_em) VALUES($1,$2,$1,$3)',
      [id, 'student', now],
    );

    const submitted = await request(`/projects/lesson/${id}`, 'student', 'POST', {
      url: 'https://example.com/project',
    });

    assert.equal(submitted.status, 201);
    submissions[teacher] = submitted.body.id;
  }

  const reviews = await request('/projects/reviews', 'teacher');

  assert.equal(reviews.status, 200);
  assert.ok(
    reviews.body.some(
      (item) => item.courseId === 'assessment-teacher' && item.courseTitle === 'assessment-teacher',
    ),
  );
  assert.ok(!reviews.body.some((item) => item.courseId === 'assessment-other'));
  assert.equal(
    (
      await request(`/projects/reviews/${submissions.other}`, 'teacher', 'PUT', {
        status: 'APPROVED',
        feedback: 'Bom trabalho',
      })
    ).status,
    403,
  );

  const own = reviews.body.find((item) => item.courseId === 'assessment-teacher');

  assert.equal(
    (
      await request(`/projects/reviews/${own.id}`, 'teacher', 'PUT', {
        status: 'CHANGES_REQUESTED',
        feedback: '',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/projects/reviews/${own.id}`, 'teacher', 'PUT', {
        status: 'CHANGES_REQUESTED',
        feedback: 'Adicione os testes do projeto.',
      })
    ).status,
    200,
  );

  const feedback = await request('/projects/lesson/assessment-teacher', 'student');

  assert.equal(feedback.body.feedback, 'Adicione os testes do projeto.');
  assert.ok(
    !(await request('/projects/reviews', 'teacher')).body.some((item) => item.id === own.id),
  );
});
