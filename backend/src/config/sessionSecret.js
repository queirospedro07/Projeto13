const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

require('./environment.js');

const { getDataDirectory } = require('./storage.js');

function getSessionSecret() {
  const configured = process.env.JWT_SECRET?.trim();
  if (configured || process.env.NODE_ENV === 'production') return configured;
  const filename = path.join(getDataDirectory(), '.session-secret');

  fs.mkdirSync(path.dirname(filename), {
    recursive: true,
  });
  try {
    fs.writeFileSync(filename, randomBytes(48).toString('hex'), {
      flag: 'wx',
      mode: 0o600,
    });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }

  const secret = fs.readFileSync(filename, 'utf8').trim();
  if (secret.length < 32)
    throw new Error('A chave de sessão local está inválida. Configure JWT_SECRET.');

  return secret;
}

exports.getSessionSecret = getSessionSecret;
