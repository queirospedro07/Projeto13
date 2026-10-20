import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Server } from 'socket.io';
import { readFileSync } from 'node:fs';
import { io as clientIO } from 'socket.io-client';

const directory = mkdtempSync(path.join(tmpdir(), 'nexo-security-'));

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATA_DIRECTORY: directory,
  DATABASE_URL: '',
  SEED_DEMO_DATA: 'false',
});

const { prepareTestDatabase, cleanupTestDatabase } = await import('./helpers/database.js');

await prepareTestDatabase();

const db = await import('../src/database/connection.js');
const { default: app } = await import('../src/app.js');
const { signJwtToken } = await import('../src/middleware/auth.js');
const { runMigrations } = await import('../src/database/schema.js');
const { authenticateSocket } = await import('../src/sockets/security.js');
const { setupSocketIO } = await import('../src/sockets/chatSocket.js');
const { eligibleForCertificate, issueCertificate } = await import('../src/services/progress.js');
let server;
let io;
const clients = [];

test.after(async () => {
  clients.forEach((s) => s.disconnect());
  if (io) await new Promise((resolve) => io.close(resolve));
  else if (server) await new Promise((resolve) => server.close(resolve));
  await db.closeDatabase();
  await cleanupTestDatabase();
  rmSync(directory, {
    recursive: true,
    force: true,
  });
});
test(
  'isolated security and learning workflows',
  {
    timeout: 30000,
  },
  async (t) => {
    await db.connectDB();

    const now = new Date().toISOString();
    const tokens = {};
    for (const [id, role] of [
      ['owner', 'CREATOR'],
      ['other', 'CREATOR'],
      ['student', 'STUDENT'],
      ['outsider', 'STUDENT'],
      ['admin', 'ADMIN'],
    ]) {
      await db.execute(
        'INSERT INTO utilizadores(id,email,nome_utilizador,hash_palavra_passe,nome,papel,criado_em,atualizado_em) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [id, `${id}@example.test`, id, 'unused', id, role, now, now],
      );
      tokens[id] = signJwtToken({
        id,
        role,
        username: id,
      });
    }

    await db.execute(
      'INSERT INTO espacos(id,nome,slug,categoria,id_proprietario,criado_em) VALUES($1,$2,$3,$4,$5,$6)',
      ['space', 'Comunidade', 'space', 'Tecnologia', 'owner', now],
    );
    for (const [id, free] of [
      ['free', 1],
      ['paid', 0],
    ]) {
      await db.execute(
        'INSERT INTO cursos(id,titulo,slug,descricao,categoria,e_gratuito,preco,id_criador,id_espaco,criado_em,atualizado_em) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        [
          id,
          `Curso ${id}`,
          id,
          'Descrição do curso',
          'Tecnologia',
          free,
          free ? 0 : 99,
          'owner',
          id === 'paid' ? 'space' : null,
          now,
          now,
        ],
      );
      await db.execute('INSERT INTO modulos_curso(id,id_curso,titulo) VALUES($1,$2,$3)', [
        `module-${id}`,
        id,
        'Módulo',
      ]);
    }

    await db.execute('INSERT INTO canais(id,id_espaco,nome) VALUES($1,$2,$3)', [
      'channel',
      'space',
      'geral',
    ]);
    await db.execute(
      'INSERT INTO inscricoes(id,id_utilizador,id_curso,inscrito_em) VALUES($1,$2,$3,$4)',
      ['enrollment', 'student', 'free', now],
    );

    const assessment = {
      questions: [
        {
          id: 'q',
          question: 'Escolha a resposta certa',
          options: [
            {
              id: 'yes',
              text: 'Certa',
              isCorrect: true,
            },
            {
              id: 'no',
              text: 'Errada',
              isCorrect: false,
            },
          ],
        },
      ],
    };
    for (const [id, type, content] of [
      ['video', 'video', 'Conteúdo'],
      ['quiz', 'quiz', JSON.stringify(assessment)],
      [
        'manual',
        'quiz',
        JSON.stringify({
          questions: [
            {
              id: 'open',
              type: 'open-ended',
              question: 'Explique',
              gradingMode: 'teacher',
              points: 10,
            },
          ],
        }),
      ],
      ['project', 'project', 'Projeto'],
    ])
      await db.execute(
        'INSERT INTO aulas(id,id_modulo,titulo,tipo,conteudo) VALUES($1,$2,$3,$4,$5)',
        [id, 'module-free', id, type, content],
      );
    await db.execute(
      'INSERT INTO aulas(id,id_modulo,titulo,tipo,conteudo,url_video) VALUES($1,$2,$3,$4,$5,$6)',
      [
        'paid-video',
        'module-paid',
        'Vídeo privado',
        'video',
        'Privado',
        'https://example.test/paid-secret',
      ],
    );
    server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    io = new Server(server);
    io.use(authenticateSocket);
    setupSocketIO(io);
    app.set('io', io);

    const origin = `http://127.0.0.1:${server.address().port}`;
    const request = async (route, { user = 'student', method = 'GET', body } = {}) => {
      const response = await fetch(origin + '/api' + route, {
        method,
        headers: {
          ...(user
            ? {
                Authorization: `Bearer ${tokens[user]}`,
              }
            : {}),
          ...(body !== undefined
            ? {
                'Content-Type': 'application/json',
              }
            : {}),
        },
        ...(body !== undefined
          ? {
              body: JSON.stringify(body),
            }
          : {}),
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    };

    const status = (r, n) => assert.equal(r.status, n, JSON.stringify(r.body));

    await t.test('administrators can access both administration and teaching tools', async () => {
      status(
        await request('/admin/stats', {
          user: 'admin',
        }),
        200,
      );
      status(
        await request('/creator/stats', {
          user: 'admin',
        }),
        200,
      );
      status(
        await request('/creator/courses', {
          user: 'admin',
        }),
        200,
      );
      status(
        await request('/admin/stats', {
          user: 'student',
        }),
        403,
      );
      status(
        await request('/creator/stats', {
          user: 'student',
        }),
        403,
      );
    });
    await t.test('authentication, role boundaries and malformed input', async () => {
      status(
        await request('/auth/me', {
          user: null,
        }),
        401,
      );
      status(await request('/admin/users'), 403);
      status(
        await request('/auth/demo/admin', {
          user: null,
        }),
        404,
      );
      status(
        await request('/auth/login', {
          user: null,
          method: 'POST',
          body: {
            login: {
              x: 1,
            },
            password: {
              x: 1,
            },
          },
        }),
        400,
      );
      status(
        await request('/auth/profile', {
          method: 'PUT',
          body: {
            avatarUrl: 'data:image/svg+xml;base64,PHN2Zz4=',
          },
        }),
        400,
      );
      status(
        await request('/auth/profile', {
          method: 'PUT',
          body: {
            socialLinks: {
              github: 'javascript:alert(1)',
            },
          },
        }),
        400,
      );
    });
    await t.test('paid content and manual enrollment permissions', async () => {
      status(
        await request('/courses/paid/enroll', {
          method: 'POST',
          body: {},
        }),
        409,
      );
      status(
        await request('/courses/paid/lessons/paid-video/complete', {
          method: 'POST',
          body: {},
        }),
        403,
      );
      status(await request('/channels/channel/messages'), 403);

      const pub = await request('/courses/paid', {
        user: null,
      });

      status(pub, 200);
      assert.ok(!JSON.stringify(pub.body).includes('paid-secret'));
      status(await request('/courses/paid/classmates'), 403);
      status(
        await request('/creator/courses/paid/enrollments', {
          user: 'other',
          method: 'POST',
          body: {
            identifier: 'student',
          },
        }),
        403,
      );
      for (let i = 0; i < 2; i++)
        status(
          await request('/creator/courses/paid/enrollments', {
            user: 'owner',
            method: 'POST',
            body: {
              identifier: 'student',
            },
          }),
          200,
        );
      assert.equal(
        (
          await db.queryOne(
            'SELECT COUNT(*) AS n FROM enrollments WHERE "courseId"=$1 AND "userId"=$2',
            ['paid', 'student'],
          )
        ).n,
        1,
      );
    });
    await t.test('server grading, teacher review, projects and certificate integrity', async () => {
      status(
        await request('/quizzes/lesson/quiz', {
          user: 'outsider',
        }),
        403,
      );

      const quiz = await request('/quizzes/lesson/quiz');

      status(quiz, 200);
      assert.ok(!JSON.stringify(quiz.body).includes('isCorrect'));
      status(
        await request('/courses/free/lessons/quiz/complete', {
          method: 'POST',
          body: {
            score: 100,
          },
        }),
        403,
      );

      const wrong = await request('/quizzes/quiz/submit', {
        method: 'POST',
        body: {
          answers: {
            q: 'no',
          },
          score: 100,
          passed: true,
        },
      });

      status(wrong, 200);
      assert.equal(wrong.body.passed, false);
      assert.equal(wrong.body.score, 0);

      const right = await request('/quizzes/quiz/submit', {
        method: 'POST',
        body: {
          answers: {
            q: 'yes',
          },
        },
      });

      status(right, 200);
      assert.equal(right.body.passed, true);
      status(
        await request('/courses/free/lessons/quiz/complete', {
          method: 'POST',
          body: {},
        }),
        200,
      );
      await db.execute('UPDATE inscricoes SET percentagem_progresso=100 WHERE id=$1', [
        'enrollment',
      ]);
      assert.equal(await eligibleForCertificate('student', 'free'), false);
      await assert.rejects(async () => await issueCertificate('student', 'free'));

      const pending = await request('/quizzes/manual/submit', {
        method: 'POST',
        body: {
          answers: {
            open: 'Resposta para revisão do formador.',
          },
        },
      });

      status(pending, 200);
      assert.equal(pending.body.passed, false);
      status(
        await request('/quizzes/reviews/' + pending.body.attemptId, {
          user: 'other',
          method: 'PUT',
          body: {
            score: 100,
          },
        }),
        403,
      );
      status(
        await request('/quizzes/reviews/' + pending.body.attemptId, {
          user: 'owner',
          method: 'PUT',
          body: {
            score: 100,
          },
        }),
        200,
      );
      status(
        await request('/courses/free/lessons/project/complete', {
          method: 'POST',
          body: {
            passed: true,
          },
        }),
        403,
      );

      const project = await request('/projects/lesson/project', {
        method: 'POST',
        body: {
          url: 'https://example.test/project',
        },
      });

      status(project, 201);
      assert.equal((await request('/projects/lesson/project')).body.id, project.body.id);
      status(
        await request('/projects/reviews/' + project.body.id, {
          user: 'other',
          method: 'PUT',
          body: {
            status: 'APPROVED',
            feedback: 'Bom trabalho.',
          },
        }),
        403,
      );
      status(
        await request('/projects/reviews/' + project.body.id, {
          user: 'owner',
          method: 'PUT',
          body: {
            status: 'APPROVED',
            feedback: 'Bom trabalho.',
          },
        }),
        200,
      );
      for (let i = 0; i < 2; i++)
        status(
          await request('/courses/free/lessons/video/complete', {
            method: 'POST',
            body: {},
          }),
          200,
        );
      assert.equal(await eligibleForCertificate('student', 'free'), true);
      assert.equal(
        (
          await db.queryOne(
            'SELECT COUNT(*) AS n FROM certificates WHERE "userId"=$1 AND "courseId"=$2',
            ['student', 'free'],
          )
        ).n,
        1,
      );
    });
    await t.test('chat input, attachments, replies and moderation', async () => {
      const message = await request('/channels/channel/messages', {
        method: 'POST',
        body: {
          content: 'Mensagem legítima',
        },
      });

      status(message, 201);
      status(
        await request('/messages/' + message.body.id + '/pin', {
          method: 'POST',
          body: {},
        }),
        403,
      );
      status(
        await request('/messages/' + message.body.id + '/pin', {
          user: 'owner',
          method: 'POST',
          body: {},
        }),
        200,
      );
      for (const body of [
        {
          content: {
            bad: true,
          },
        },
        {
          content: 'x'.repeat(4001),
        },
        {
          content: 'Olá',
          replyToId: 'nonexistent',
        },
        {
          content: 'Olá',
          attachments: [
            {
              url: 'javascript:alert(1)',
            },
          ],
        },
      ])
        status(
          await request('/channels/channel/messages', {
            method: 'POST',
            body,
          }),
          400,
        );
      status(
        await request('/social/dm/send', {
          method: 'POST',
          body: {
            receiverId: 'owner',
            content: {
              bad: true,
            },
          },
        }),
        400,
      );
    });
    await t.test(
      'help FAQ remains available and removed support endpoints return 404',
      async () => {
        status(await request('/help/faq'), 200);
        for (const method of ['GET', 'POST', 'PUT']) {
          status(
            await request('/support/tickets' + (method === 'PUT' ? '/removed' : ''), {
              method,
              ...(method === 'GET'
                ? {}
                : {
                    body: {},
                  }),
            }),
            404,
          );
        }
      },
    );
    await t.test(
      'publication requires administration and communities cannot be hijacked',
      async () => {
        const body = {
          title: 'Novo curso',
          description: 'Descrição do curso',
          category: 'Tecnologia',
          isFree: true,
          isPublished: true,
          modules: [
            {
              title: 'Módulo',
              lessons: ['video', 'text', 'resource', 'project'].map((type) => ({
                title: 'Aula ' + type,
                type,
                content: 'Conteúdo',
                videoUrl: type === 'video' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : '',
              })),
            },
          ],
        };

        status(
          await request('/creator/courses', {
            user: 'other',
            method: 'POST',
            body: {
              ...body,
              spaceId: 'space',
            },
          }),
          403,
        );

        const created = await request('/creator/courses', {
          user: 'owner',
          method: 'POST',
          body,
        });

        status(created, 201);
        assert.equal(created.body.isPublished, 0);
        assert.equal(created.body.approvalStatus, 'DRAFT');
        status(
          await request('/creator/courses/' + created.body.id + '/submit-review', {
            user: 'owner',
            method: 'POST',
            body: {},
          }),
          200,
        );
        assert.equal(
          (await db.queryOne('SELECT "approvalStatus" FROM courses WHERE id=$1', [created.body.id]))
            .approvalStatus,
          'PENDING',
        );
        status(
          await request('/admin/courses/' + created.body.id + '/approve', {
            user: 'student',
            method: 'PUT',
            body: {},
          }),
          403,
        );
        status(
          await request('/admin/courses/' + created.body.id + '/approve', {
            user: 'admin',
            method: 'PUT',
            body: {},
          }),
          200,
        );

        const adminCourse = await request('/creator/courses', {
          user: 'admin',
          method: 'POST',
          body: {
            ...body,
            title: 'Curso do administrador',
          },
        });

        status(adminCourse, 201);
        assert.equal(adminCourse.body.isPublished, 1);
      },
    );
    await t.test('channel creation and edits require a course moderator', async () => {
      const body = {
        name: 'sala-de-estudo',
        type: 'voice',
        topic: 'Discussão',
      };

      status(
        await request('/spaces/space/channels', {
          method: 'POST',
          body,
        }),
        403,
      );

      const created = await request('/spaces/space/channels', {
        user: 'owner',
        method: 'POST',
        body,
      });

      status(created, 201);
      status(
        await request('/spaces/space/channels/' + created.body.id, {
          user: 'owner',
          method: 'PUT',
          body: {
            ...body,
            name: 'sala-atualizada',
          },
        }),
        200,
      );
      assert.equal(
        (await db.queryOne('SELECT name FROM channels WHERE id=$1', [created.body.id])).name,
        'sala-atualizada',
      );

      const message = await db.queryOne('SELECT id FROM messages LIMIT 1');

      status(
        await request('/messages/' + message.id + '/resolve', {
          method: 'POST',
          body: {},
        }),
        403,
      );
      status(
        await request('/messages/' + message.id + '/resolve', {
          user: 'owner',
          method: 'POST',
          body: {},
        }),
        200,
      );
      assert.equal((await request('/channels/channel/messages')).body[0].isResolved, true);
    });
    await t.test('dashboard and course endpoints work on a fresh database', async () => {
      for (const [user, routes] of [
        [
          'student',
          [
            '/courses',
            '/courses/my-learning',
            '/courses/free',
            '/courses/free/classmates',
            '/spaces',
            '/spaces/space',
            '/certificates/my',
            '/notifications',
            '/social/dm/conversations',
            '/auth/me',
          ],
        ],
        [
          'owner',
          [
            '/creator/stats',
            '/creator/courses',
            '/creator/members',
            '/creator/courses/free',
            '/quizzes/reviews',
            '/projects/reviews',
          ],
        ],
        ['admin', ['/admin/stats', '/admin/users', '/admin/courses', '/admin/reports']],
      ])
        for (const route of routes)
          status(
            await request(route, {
              user,
            }),
            200,
          );
    });
    await t.test('socket authentication and forged events', async () => {
      const anonymous = clientIO(origin, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 2000,
      });

      clients.push(anonymous);
      await new Promise((resolve, reject) => {
        anonymous.once('connect_error', resolve);
        anonymous.once('connect', () => reject(new Error('Anonymous socket connected')));
      });

      const outsider = clientIO(origin, {
        auth: {
          token: tokens.outsider,
        },
        transports: ['websocket'],
        reconnection: false,
        timeout: 2000,
      });

      clients.push(outsider);
      await new Promise((resolve, reject) => {
        outsider.once('connect', resolve);
        outsider.once('connect_error', reject);
      });

      const denied = new Promise((resolve) => outsider.once('operation-error', resolve));

      outsider.emit('join-channel', 'channel');
      await denied;
      assert.equal(io.sockets.sockets.get(outsider.id).rooms.has('channel_channel'), false);

      const forged = new Promise((resolve) => outsider.once('operation-error', resolve));

      outsider.emit('send-message', {
        channelId: 'channel',
        content: 'Spoof',
        userId: 'owner',
      });
      await forged;
    });
    await t.test('single-use password reset revokes old sessions', async () => {
      const oldSocket = clients.at(-1);
      const disconnected = new Promise((resolve) => oldSocket.once('disconnect', resolve));
      const reset = 'a'.repeat(64);

      await db.execute(
        'INSERT INTO tokens_recuperacao_palavra_passe(id,id_utilizador,hash_token,expira_em,criado_em) VALUES($1,$2,$3,$4,$5)',
        [
          'reset',
          'outsider',
          createHash('sha256').update(reset).digest('hex'),
          new Date(Date.now() + 60000).toISOString(),
          now,
        ],
      );
      status(
        await request('/auth/reset-password', {
          user: null,
          method: 'POST',
          body: {
            token: reset,
            password: 'NewStrongPassword123!',
          },
        }),
        200,
      );
      await disconnected;
      assert.equal(oldSocket.connected, false);
      status(
        await request('/auth/me', {
          user: 'outsider',
        }),
        401,
      );
      status(
        await request('/auth/reset-password', {
          user: null,
          method: 'POST',
          body: {
            token: reset,
            password: 'NewStrongPassword123!',
          },
        }),
        400,
      );
    });
    await t.test('startup preserves users, suspension, messages and submissions', async () => {
      await db.execute('UPDATE utilizadores SET esta_suspenso=1 WHERE id=$1', ['admin']);
      await runMigrations();
      assert.equal((await db.queryOne('SELECT COUNT(*) AS n FROM utilizadores')).n, 5);
      assert.equal(
        (await db.queryOne('SELECT esta_suspenso FROM utilizadores WHERE id=$1', ['admin']))
          .esta_suspenso,
        1,
      );
      assert.equal((await db.queryOne('SELECT COUNT(*) AS n FROM submissoes_projeto')).n, 1);
      assert.equal((await db.queryOne('SELECT COUNT(*) AS n FROM messages')).n, 1);
    });
    await t.test(
      'registration cannot escalate role and records explicit terms acceptance',
      async () => {
        const body = {
          name: 'Nova Conta',
          username: 'nova_conta',
          email: 'new@example.test',
          password: 'StrongPassword123!',
          role: 'ADMIN',
        };

        status(
          await request('/auth/register', {
            user: null,
            method: 'POST',
            body,
          }),
          400,
        );
        status(
          await request('/auth/register', {
            user: null,
            method: 'POST',
            body: {
              ...body,
              acceptedTerms: true,
              password: 'á'.repeat(37),
            },
          }),
          400,
        );

        const result = await request('/auth/register', {
          user: null,
          method: 'POST',
          body: {
            ...body,
            acceptedTerms: true,
          },
        });

        status(result, 201);
        assert.equal(result.body.user.role, 'STUDENT');
        assert.equal(result.body.user.avatarUrl, null);
        assert.equal(
          (
            await db.queryOne('SELECT url_avatar FROM utilizadores WHERE id = $1', [
              result.body.user.id,
            ])
          ).url_avatar,
          null,
        );
        assert.ok(
          await db.queryOne(
            'SELECT termos_aceites_em FROM consentimentos_utilizador WHERE id_utilizador=$1',
            [result.body.user.id],
          ),
        );
      },
    );
    await t.test('backup produces a consistent PostgreSQL snapshot', () => {
      execFileSync(process.execPath, ['scripts/backup.js'], {
        cwd: path.resolve(import.meta.dirname, '..'),
        env: process.env,
      });

      const files = readdirSync(path.join(directory, 'backups')).filter((file) =>
        file.endsWith('.json'),
      );

      assert.equal(files.length, 1);

      const snapshot = JSON.parse(readFileSync(path.join(directory, 'backups', files[0]), 'utf8'));

      assert.equal(snapshot.format, 'nexo-postgresql-v1');
      assert.equal(snapshot.tables.submissoes_projeto.length, 1);
    });
  },
);
