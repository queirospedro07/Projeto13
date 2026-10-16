const { queryOne, execute } = require('../database/connection.js');
const SUPPORTED = new Set([
  'website',
  'github',
  'linkedin',
  'instagram',
  'twitter',
  'youtube',
  'tiktok',
  'twitch',
  'discord',
  'facebook',
]);
function validateSocialLinks(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('As redes sociais devem ser um objeto.');
  const result = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!SUPPORTED.has(key)) throw new Error('Rede social não suportada.');
    if (typeof raw !== 'string' || raw.length > 500)
      throw new Error('Cada link deve ter até 500 caracteres.');
    const value = raw.trim();
    if (!value) continue;
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error('Introduza links http ou https válidos.');
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname.includes('.') ||
      url.username ||
      url.password ||
      /\s/.test(value)
    ) {
      throw new Error('Introduza links http ou https válidos.');
    }
    result[key] = url.href;
  }
  return result;
}
async function getProfileSocialLinks(userId) {
  const row = await queryOne(
    'SELECT ligacoes FROM ligacoes_sociais_perfil WHERE id_utilizador = $1',
    [userId],
  );
  try {
    return row ? validateSocialLinks(JSON.parse(row.ligacoes)) : {};
  } catch {
    return {};
  }
}
async function saveProfileSocialLinks(userId, links) {
  await execute(
    `INSERT INTO ligacoes_sociais_perfil (id_utilizador, ligacoes) VALUES ($1, $2)
    ON CONFLICT (id_utilizador) DO UPDATE SET ligacoes = excluded.ligacoes`,
    [userId, JSON.stringify(links)],
  );
}
exports.validateSocialLinks = validateSocialLinks;
exports.getProfileSocialLinks = getProfileSocialLinks;
exports.saveProfileSocialLinks = saveProfileSocialLinks;
