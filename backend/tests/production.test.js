import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProductionEnvironment } from '../src/config/production.js';
import { simulatePayment } from '../src/services/payments.js';

const valid = {
  NODE_ENV: 'production',
  CLIENT_URL: 'https://learning.company.pt',
  FRONTEND_URL: 'https://learning.company.pt',
  JWT_SECRET: 'a'.repeat(64),
  DATABASE_URL: 'postgresql://nexo:secure-fixture-password@database:5432/nexo',
  SMTP_HOST: 'smtp.company.pt',
  SMTP_USER: 'fixture',
  SMTP_PASS: 'fixture',
  SMTP_FROM: 'NEXO <no-reply@company.pt>',
  TRUST_PROXY_HOPS: '1',
};

test('production accepts a complete configuration', () => {
  assert.deepEqual(validateProductionEnvironment(valid), []);
});

test('production rejects development origins, placeholders and unsafe switches', () => {
  for (const overrides of [
    { CLIENT_URL: 'http://learning.company.pt' },
    { FRONTEND_URL: 'https://localhost' },
    { FRONTEND_URL: 'https://nexo.example.com' },
    { FRONTEND_URL: 'https://learning.company.pt/reset' },
    { JWT_SECRET: 'CHANGE_ME' },
    { DATABASE_URL: 'postgresql://nexo:CHANGE_ME@database/nexo' },
    { SMTP_PASS: '' },
    { TRUST_PROXY_HOPS: 'true' },
    ...[
      'ENABLE_DEMO_LOGIN',
      'ENABLE_DEV_PASSWORD_RESET',
      'LOCAL_POSTGRES_DOCKER',
      'ENABLE_PAYMENT_SIMULATION',
    ].map((key) => ({ [key]: 'true' })),
  ]) {
    assert.ok(validateProductionEnvironment({ ...valid, ...overrides }).length);
  }
});

test('production cannot enroll a student through a simulated payment', async () => {
  const previous = process.env.NODE_ENV;

  process.env.NODE_ENV = 'production';
  try {
    await assert.rejects(
      simulatePayment({ id: 'fixture' }, 'fixture', { method: 'card', outcome: 'approved' }),
      (error) => error.status === 503,
    );
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
