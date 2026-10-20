import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const testDirectory = mkdtempSync(path.join(tmpdir(), 'nexo-profile-test-'));

process.env.DATA_DIRECTORY = testDirectory;
process.env.DATABASE_URL = '';
process.env.NODE_ENV = 'test';

const { prepareTestDatabase, cleanupTestDatabase } = await import('./helpers/database.js');

await prepareTestDatabase();

const connection = await import('../src/database/connection.js');
const { validateSocialLinks } = await import('../src/models/ProfileSocials.js');
const { normalizeProfileLink, PROFILE_NETWORKS } =
  await import('../../frontend/src/utils/profileSocials.js');
const { default: app } = await import('../src/app.js');
const { signJwtToken } = await import('../src/middleware/auth.js');
let server;

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await connection.closeDatabase();
  await cleanupTestDatabase();
  rmSync(testDirectory, {
    recursive: true,
    force: true,
  });
});
test('social links reject executable URLs and normalise handles without breaking dots', () => {
  const network = (key) => PROFILE_NETWORKS.find((n) => n.key === key);

  assert.equal(
    normalizeProfileLink(network('instagram'), '@pedro.silva'),
    'https://www.instagram.com/pedro.silva',
  );
  assert.equal(normalizeProfileLink(network('youtube'), '@nexo'), 'https://www.youtube.com/@nexo');
  assert.equal(
    normalizeProfileLink(network('github'), 'github.com/pedro'),
    'https://github.com/pedro',
  );
  assert.equal(normalizeProfileLink(network('website'), 'exemplo.pt'), 'https://exemplo.pt/');
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,test',
    'https://user:password@example.com',
    'https://example.com/a b',
  ]) {
    assert.throws(() => normalizeProfileLink(network('instagram'), value));
    assert.throws(() =>
      validateSocialLinks({
        instagram: value,
      }),
    );
  }

  assert.throws(() => validateSocialLinks([]));
  assert.throws(() =>
    validateSocialLinks({
      unsupported: 'https://example.com',
    }),
  );
});
test('profile links persist, survive partial edits, respect privacy, and can be removed', async () => {
  await connection.connectDB();

  const now = new Date().toISOString();

  await connection.execute(
    `INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, criado_em, atualizado_em)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      'profile-test',
      'profile-test@example.test',
      'profile_test',
      'unused-test-hash',
      'Teste Perfil',
      'STUDENT',
      now,
      now,
    ],
  );
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  const origin = `http://127.0.0.1:${server.address().port}/api/auth`;
  const token = signJwtToken({
    id: 'profile-test',
    username: 'profile_test',
    role: 'STUDENT',
  });
  const request = async (route, body, authenticated = true) => {
    const response = await fetch(origin + route, {
      method: body ? 'PUT' : 'GET',
      headers: {
        ...(authenticated
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...(body
          ? {
              'Content-Type': 'application/json',
            }
          : {}),
      },
      ...(body
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

  const links = Object.fromEntries(
    PROFILE_NETWORKS.map((n) => [n.key, `https://example.com/${n.key}`]),
  );
  const saved = await request('/profile', {
    name: 'Novo nome',
    bio: 'Biografia de teste',
    socialLinks: links,
  });

  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.deepEqual(saved.body.user.profile.socialLinks, links);
  assert.deepEqual((await request('/me')).body.user.profile.socialLinks, links);
  assert.deepEqual(
    (await request('/user/profile_test', undefined, false)).body.profile.socialLinks,
    links,
  );
  assert.equal(
    (
      await request('/profile', {
        headline: 'Nova especialidade',
      })
    ).status,
    200,
  );
  assert.deepEqual((await request('/me')).body.user.profile.socialLinks, links);
  await request('/profile', {
    showSocials: false,
  });
  assert.deepEqual(
    (await request('/user/profile_test', undefined, false)).body.profile.socialLinks,
    {},
  );
  assert.deepEqual((await request('/me')).body.user.profile.socialLinks, links);

  const rejected = await request('/profile', {
    name: 'Não guardar',
    socialLinks: {
      instagram: 'javascript:alert(1)',
    },
  });

  assert.equal(rejected.status, 400);
  assert.equal((await request('/me')).body.user.name, 'Novo nome');
  await request('/profile', {
    socialLinks: {},
  });
  assert.deepEqual((await request('/me')).body.user.profile.socialLinks, {});
});
