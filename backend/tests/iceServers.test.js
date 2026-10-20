import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getIceServers } from '../src/config/iceServers.js';

test('ICE uses STUN only, even when old relay settings remain in the environment', () => {
  const previousUrls = process.env.TURN_URLS;
  const previousSecret = process.env.TURN_SHARED_SECRET;

  process.env.TURN_URLS = 'turn:legacy.company.pt:3478';
  process.env.TURN_SHARED_SECRET = 'unused-fixture-secret';
  try {
    const servers = getIceServers();

    assert.ok(servers.length > 0);
    assert.ok(servers.every((server) => String(server.urls).startsWith('stun:')));
  } finally {
    for (const [key, value] of [
      ['TURN_URLS', previousUrls],
      ['TURN_SHARED_SECRET', previousSecret],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('ICE configuration never exposes relay credentials', () => {
  for (const server of getIceServers()) {
    assert.equal(server.username, undefined);
    assert.equal(server.credential, undefined);
  }
});
