import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Server } from 'socket.io';
import { io as clientIO } from 'socket.io-client';
import { prepareTestDatabase, cleanupTestDatabase } from './helpers/database.js';

const directory = mkdtempSync(path.join(tmpdir(), 'nexo-review-'));

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATA_DIRECTORY: directory,
  JWT_SECRET: '',
  DATABASE_URL: '',
  SMTP_HOST: '',
  SMTP_USER: '',
  SMTP_PASS: '',
  ENABLE_DEV_PASSWORD_RESET: 'false',
});
await prepareTestDatabase();

const db = await import('../src/database/connection.js');
const { default: app } = await import('../src/app.js');
const { signJwtToken, verifyJwtToken } = await import('../src/middleware/auth.js');
const { getSessionSecret } = await import('../src/config/sessionSecret.js');
const { authenticateSocket } = await import('../src/sockets/security.js');
const { setupSocketIO } = await import('../src/sockets/chatSocket.js');
let server;
let io;
let origin;
const tokens = {};
const clients = [];
const password = 'TestPassword2026!';

async function request(
  route,
  { user = 'student', method = 'GET', body, token = tokens[user] } = {},
) {
  const response = await fetch(origin + '/api' + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  return { status: response.status, body: await response.json() };
}

test.before(async () => {
  await db.connectDB();

  const now = new Date().toISOString();
  const hash = await bcrypt.hash(password, 10);
  for (const [id, role] of [
    ['owner', 'CREATOR'],
    ['admin', 'ADMIN'],
    ['student', 'STUDENT'],
    ['other', 'STUDENT'],
  ]) {
    await db.execute(
      'INSERT INTO utilizadores(id,email,nome_utilizador,hash_palavra_passe,nome,papel,criado_em,atualizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$7)',
      [id, `${id}@example.test`, id, hash, id, role, now],
    );
    tokens[id] = signJwtToken({ id, role });
  }

  await db.execute(
    'INSERT INTO espacos(id,nome,slug,categoria,id_proprietario,criado_em) VALUES ($1,$2,$3,$4,$5,$6)',
    ['space', 'Space', 'space', 'custom', 'owner', now],
  );
  for (const id of ['paid', 'hidden']) {
    await db.execute(
      'INSERT INTO cursos(id,titulo,slug,descricao,categoria,e_gratuito,preco,id_criador,id_espaco,criado_em,atualizado_em) VALUES ($1,$1,$1,$2,$3,0,19.99,$4,$5,$6,$6)',
      [id, 'Course', 'custom', 'owner', id === 'paid' ? 'space' : null, now],
    );
    await db.execute(
      'INSERT INTO inscricoes(id,id_utilizador,id_curso,inscrito_em,esta_oculto) VALUES ($1,$2,$3,$4,$5)',
      ['enrollment-' + id, 'student', id, now, id === 'hidden' ? 1 : 0],
    );
  }

  await db.execute('INSERT INTO modulos_curso(id,id_curso,titulo) VALUES ($1,$2,$3)', [
    'module',
    'paid',
    'Module',
  ]);
  await db.execute('INSERT INTO aulas(id,id_modulo,titulo,tipo,conteudo) VALUES ($1,$2,$3,$4,$5)', [
    'lesson',
    'module',
    'Lesson',
    'text',
    'Content',
  ]);
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  io = new Server(server);
  io.use(authenticateSocket);
  setupSocketIO(io);
  app.set('io', io);
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  clients.forEach((client) => client.disconnect());
  if (io) await new Promise((resolve) => io.close(resolve));
  else if (server) await new Promise((resolve) => server.close(resolve));
  await db.closeDatabase();
  await cleanupTestDatabase();
  rmSync(directory, { recursive: true, force: true });
});

test('login issues JWT and API rejects altered, expired, unsigned and stale tokens', async () => {
  const login = await request('/auth/login', {
    method: 'POST',
    body: { login: 'student', password },
    user: null,
  });

  assert.equal(login.status, 200);

  const payload = verifyJwtToken(login.body.token);

  assert.equal(payload.id, 'student');
  assert.ok(payload.exp > payload.iat);
  assert.equal(jwt.decode(login.body.token, { complete: true }).header.alg, 'HS256');
  assert.equal((await request('/auth/me', { token: login.body.token })).status, 200);

  const [header, body, signature] = login.body.token.split('.');
  const altered = `${header}.${body}.${signature[0] === 'a' ? 'b' : 'a'}${signature.slice(1)}`;
  for (const token of [
    altered,
    jwt.sign({ id: 'student' }, getSessionSecret(), { expiresIn: -1 }),
    jwt.sign({ id: 'student' }, '', { algorithm: 'none' }),
    signJwtToken({ id: 'student', authVersion: 99 }),
  ]) {
    assert.equal((await request('/auth/me', { token })).status, 401);
  }

  assert.equal(
    (await request('/admin/stats', { token: signJwtToken({ id: 'student', role: 'ADMIN' }) }))
      .status,
    403,
  );
  assert.equal((await request('/creator/stats')).status, 403);
});

test('protected domain routes require JWT even when requested directly', async () => {
  for (const route of [
    '/auth/me',
    '/admin/stats',
    '/creator/stats',
    '/courses/my-learning',
    '/payments',
    '/social/friends',
    '/notes',
    '/notifications',
    '/quizzes/reviews',
    '/projects/reviews',
    '/certificates/my',
  ]) {
    assert.equal((await request(route, { user: null })).status, 401, route);
  }

  assert.equal((await request('/courses', { user: null })).status, 200);
});

test('malformed filters are rejected and administration counts real records', async () => {
  for (const route of [
    '/courses?category[]=custom',
    '/spaces?search[nested]=value',
    '/social/users/search?query[]=student',
  ]) {
    assert.equal((await request(route)).status, 400);
  }

  await request('/reports', {
    method: 'POST',
    body: {
      targetType: 'course',
      targetId: 'paid',
      reason: 'Conteúdo para revisão da administração.',
    },
  });

  const stats = await request('/admin/stats', { user: 'admin' });

  assert.equal(stats.status, 200);
  assert.equal(stats.body.activeUsers, 4);
  assert.equal(stats.body.pendingReports, 1);
});

test('password recovery never exposes reset tokens without an explicitly enabled local helper', async () => {
  const result = await request('/auth/forgot-password', {
    user: null,
    method: 'POST',
    body: { email: 'student@example.test' },
  });

  assert.equal(result.status, 503);
  assert.equal(result.body.devResetUrl, undefined);
});

test('database failures return service errors without invalidating JWT sessions', async () => {
  const pool = db.getPool();
  const original = pool.query;

  pool.query = async () => {
    throw Object.assign(new Error('simulated database outage'), { code: 'ECONNRESET' });
  };

  try {
    assert.equal((await request('/auth/me')).status, 503);
    assert.equal((await request('/courses')).status, 503);
  } finally {
    pool.query = original;
  }

  assert.equal((await request('/auth/me')).status, 200);
});

test('profiles return course arrays and hide private courses and biographies across social endpoints', async () => {
  const update = await request('/auth/profile', {
    method: 'PUT',
    body: { bio: 'private-biography-marker', showBio: false, isPublic: true },
  });

  assert.equal(update.status, 200);

  const publicProfile = await request('/auth/user/student', { user: null });

  assert.ok(Array.isArray(publicProfile.body.courses));
  assert.deepEqual(
    publicProfile.body.courses.map((item) => item.courseId),
    ['paid'],
  );

  const ownProfile = await request('/auth/user/student');

  assert.equal(ownProfile.body.courses.length, 2);
  assert.equal(ownProfile.body.bio, 'private-biography-marker');
  for (const [route, user] of [
    ['/social/users/search?query=student', null],
    ['/social/dm/messages/student', 'other'],
  ]) {
    const result = await request(route, { user });

    assert.equal(result.status, 200);
    assert.ok(!JSON.stringify(result.body).includes('private-biography-marker'));
  }

  const learning = await request('/courses/my-learning');

  assert.ok(!JSON.stringify(learning.body).includes('correctOptionIndex'));
});

test('paid community membership checks access asynchronously and repeated joins remain idempotent', async () => {
  assert.equal(
    (await request('/spaces/space/join', { user: 'other', method: 'POST', body: {} })).status,
    403,
  );

  const joined = await Promise.all(
    Array.from({ length: 4 }, () => request('/spaces/space/join', { method: 'POST', body: {} })),
  );

  assert.ok(joined.every((result) => result.status === 201));
  assert.equal(
    (
      await db.queryOne(
        'SELECT COUNT(*) AS count FROM membros_espacos WHERE id_utilizador = $1 AND id_espaco = $2',
        ['student', 'space'],
      )
    ).count,
    1,
  );
});

test('concurrent note saves persist one note and do not cross user permissions', async () => {
  const results = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      request('/notes/lesson', { method: 'POST', body: { content: `Note ${index}` } }),
    ),
  );

  assert.ok(results.every((result) => result.status === 200));
  assert.equal(
    (
      await db.queryOne(
        'SELECT COUNT(*) AS count FROM notas WHERE id_utilizador = $1 AND id_aula = $2',
        ['student', 'lesson'],
      )
    ).count,
    1,
  );
  assert.match((await request('/notes/lesson')).body.content, /^Note [0-5]$/);
  assert.equal((await request('/notes/lesson', { user: 'other' })).status, 403);
});

test('viewing a free course does not enroll and completing a lesson requires explicit enrollment', async () => {
  const now = new Date().toISOString();

  await db.execute(
    'INSERT INTO cursos(id,titulo,slug,descricao,categoria,e_gratuito,preco,id_criador,criado_em,atualizado_em) VALUES ($1,$1,$1,$2,$3,1,0,$4,$5,$5)',
    ['free-preview', 'Free preview', 'custom', 'owner', now],
  );
  await db.execute('INSERT INTO modulos_curso(id,id_curso,titulo) VALUES ($1,$2,$3)', [
    'free-preview-module',
    'free-preview',
    'Module',
  ]);
  await db.execute('INSERT INTO aulas(id,id_modulo,titulo,tipo,conteudo) VALUES ($1,$2,$3,$4,$5)', [
    'free-preview-lesson',
    'free-preview-module',
    'Lesson',
    'text',
    'Content',
  ]);
  for (let index = 0; index < 2; index++) {
    const preview = await request('/courses/free-preview', { user: 'other' });

    assert.equal(preview.status, 200);
    assert.equal(preview.body.isEnrolled, false);
  }

  for (const user of ['admin', 'owner']) {
    const preview = await request('/courses/free-preview', { user });

    assert.equal(preview.status, 200);
    assert.equal(preview.body.isEnrolled, false);
    assert.equal(preview.body.isCreator, true);
    assert.equal(preview.body.userProgress, 0);

    const catalog = await request('/courses', { user });
    const course = catalog.body.find((item) => item.id === 'free-preview');

    assert.equal(course.isEnrolled, false);
    assert.equal(course.isMember, false);
  }

  const count = async () =>
    (
      await db.queryOne(
        'SELECT COUNT(*) AS count FROM inscricoes WHERE id_utilizador = $1 AND id_curso = $2',
        ['other', 'free-preview'],
      )
    ).count;

  assert.equal(await count(), 0);
  assert.equal(
    (
      await request('/courses/free-preview/lessons/free-preview-lesson/complete', {
        user: 'other',
        method: 'POST',
        body: {},
      })
    ).status,
    403,
  );
  assert.equal(await count(), 0);
  assert.equal(
    (await request('/courses/free-preview/enroll', { user: 'other', method: 'POST', body: {} }))
      .status,
    201,
  );
  assert.equal(await count(), 1);
  assert.equal(
    (
      await request('/courses/free-preview/lessons/free-preview-lesson/complete', {
        user: 'other',
        method: 'POST',
        body: {},
      })
    ).status,
    200,
  );
  assert.equal((await db.queryOne('SELECT COUNT(*) AS count FROM simulacoes_pagamento')).count, 0);
});

test('checkout rejects changed prices and repeated purchases after revoked enrollment', async () => {
  const pay = (body) =>
    request('/payments/simulate/paid', {
      user: 'other',
      method: 'POST',
      body: { method: 'card', outcome: 'approved', ...body },
    });

  assert.equal((await pay({ expectedAmountCents: 999 })).status, 409);
  assert.equal((await pay({ expectedAmountCents: 19.99 })).status, 400);
  assert.equal((await db.queryOne('SELECT COUNT(*) AS count FROM simulacoes_pagamento')).count, 0);
  assert.equal((await pay({ expectedAmountCents: 1999 })).status, 200);
  assert.equal((await pay({ expectedAmountCents: 1999 })).body.alreadyEnrolled, true);
  await db.execute('DELETE FROM inscricoes WHERE id_utilizador = $1 AND id_curso = $2', [
    'other',
    'paid',
  ]);
  assert.equal((await pay({ expectedAmountCents: 1999 })).status, 409);
  assert.equal((await db.queryOne('SELECT COUNT(*) AS count FROM simulacoes_pagamento')).count, 1);
});

test('creator earnings sum approved historical payments only for their own courses', async () => {
  const now = new Date().toISOString();
  const id = 'revenue-teacher';

  await db.execute(
    'INSERT INTO utilizadores(id,email,nome_utilizador,hash_palavra_passe,nome,papel,criado_em,atualizado_em) VALUES ($1,$2,$1,$3,$1,$4,$5,$5)',
    [id, 'revenue@example.test', 'unused', 'CREATOR', now],
  );

  const token = signJwtToken({ id, role: 'CREATOR' });
  const initial = await request('/creator/stats', { token });

  assert.equal(initial.status, 200);
  assert.equal(initial.body.totalRevenueCents, 0);
  await db.execute(
    'INSERT INTO cursos(id,titulo,slug,descricao,categoria,id_criador,preco,e_gratuito,criado_em,atualizado_em) VALUES ($1,$1,$1,$1,$2,$3,999,0,$4,$4)',
    ['revenue-course', 'programming', id, now],
  );
  for (const [paymentId, buyer, courseId, amount, state] of [
    ['revenue-one', 'student', 'revenue-course', 1999, 'approved'],
    ['revenue-two', 'other', 'revenue-course', 251, 'approved'],
    ['revenue-declined', 'admin', 'revenue-course', 99900, 'declined'],
    ['revenue-another-teacher', 'admin', 'paid', 1999, 'approved'],
  ]) {
    await db.execute(
      "INSERT INTO simulacoes_pagamento(id,id_utilizador,id_curso,montante_centimos,metodo,estado,criado_em) VALUES ($1,$2,$3,$4,'card',$5,$6)",
      [paymentId, buyer, courseId, amount, state, now],
    );
  }

  const result = await request('/creator/stats', { token });

  assert.equal(result.status, 200);
  assert.equal(result.body.totalRevenueCents, 2250);
  assert.equal(result.body.totalRevenue, 22.5);
  assert.equal((await request('/creator/stats', { user: 'student' })).status, 403);
});

test('courses support optional communities and existing students retain access after activation', async () => {
  const create = (title, hasCommunity) =>
    request('/creator/courses', {
      user: 'owner',
      method: 'POST',
      body: {
        title,
        category: 'programming',
        isFree: true,
        hasCommunity,
        channels: [
          { name: 'geral', type: 'text' },
          { name: 'sala-ao-vivo', type: 'voice' },
        ],
      },
    });
  const withCommunity = await create('Curso com comunidade', true);

  assert.equal(withCommunity.status, 201);

  const withDetails = await request(`/creator/courses/${withCommunity.body.id}`, { user: 'owner' });

  assert.equal(withDetails.body.hasCommunity, true);
  assert.equal(withDetails.body.channels.length, 2);

  const without = await create('Curso sem comunidade', false);

  assert.equal(without.status, 201);

  const id = without.body.id;
  const details = await request(`/creator/courses/${id}`, { user: 'owner' });

  assert.equal(details.body.hasCommunity, false);
  assert.equal(details.body.channels.length, 0);
  await db.execute(
    'INSERT INTO inscricoes(id,id_utilizador,id_curso,inscrito_em) VALUES($1,$2,$3,$4)',
    ['community-student', 'student', id, new Date().toISOString()],
  );

  const saved = await request(`/creator/courses/${id}`, {
    user: 'owner',
    method: 'PUT',
    body: {
      hasCommunity: true,
      channels: [
        { name: 'discussao', type: 'text' },
        { name: 'aula-ao-vivo', type: 'voice' },
      ],
    },
  });

  assert.equal(saved.status, 200);

  const enabled = await request(`/creator/courses/${id}`, { user: 'owner' });

  assert.equal(enabled.body.hasCommunity, true);
  assert.equal(enabled.body.channels.length, 2);
  assert.ok(
    await db.queryOne('SELECT id FROM membros_espacos WHERE id_utilizador=$1 AND id_espaco=$2', [
      'student',
      enabled.body.spaceId,
    ]),
  );

  const preview = await request(`/courses/${id}`, { user: 'admin' });

  assert.equal(preview.body.spaceId, enabled.body.spaceId);
  assert.equal(preview.body.space.channels.length, 2);

  const lazy = await create('Comunidade ativada na sala de aula', false);
  const route = `/creator/courses/${lazy.body.id}/community`;

  assert.equal((await request(route, { user: 'student', method: 'POST', body: {} })).status, 403);

  const outsiderToken = signJwtToken({ id: 'revenue-teacher', role: 'CREATOR' });

  assert.equal(
    (await request(route, { token: outsiderToken, method: 'POST', body: {} })).status,
    403,
  );

  const results = await Promise.all([
    request(route, { user: 'owner', method: 'POST', body: {} }),
    request(route, { user: 'owner', method: 'POST', body: {} }),
  ]);

  assert.ok(results.every((result) => result.status === 200));
  assert.equal(results[0].body.spaceId, results[1].body.spaceId);
  for (const type of ['text', 'voice']) {
    const channel = await request(`/spaces/${results[0].body.spaceId}/channels`, {
      user: 'owner',
      method: 'POST',
      body: { name: `canal-${type}`, type },
    });

    assert.equal(channel.status, 201);
  }

  assert.equal((await create('Modo inválido', 'false')).status, 400);
});

test('idle WebSocket sessions disconnect when their JWT expires', { timeout: 5000 }, async () => {
  const token = jwt.sign({ id: 'student', version: 0 }, getSessionSecret(), { expiresIn: 2 });
  const client = clientIO(origin, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });

  clients.push(client);
  await new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
  });

  const reason = await new Promise((resolve) => client.once('disconnect', resolve));

  assert.equal(reason, 'io server disconnect');
});
