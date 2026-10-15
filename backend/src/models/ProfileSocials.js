import { queryOne, execute } from '../database/connection.js';

export const PROFILE_SOCIAL_SCHEMA = `CREATE TABLE IF NOT EXISTS ligacoes_sociais_perfil (
  id_utilizador TEXT PRIMARY KEY REFERENCES utilizadores(id) ON DELETE CASCADE,
  ligacoes TEXT NOT NULL DEFAULT '{}'
);`;

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

export function validateSocialLinks(input) {
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

export function getProfileSocialLinks(userId) {
  const row = queryOne('SELECT ligacoes FROM ligacoes_sociais_perfil WHERE id_utilizador = ?', [
    userId,
  ]);
  try {
    return row ? validateSocialLinks(JSON.parse(row.ligacoes)) : {};
  } catch {
    return {};
  }
}

export function saveProfileSocialLinks(userId, links) {
  execute(
    `INSERT INTO ligacoes_sociais_perfil (id_utilizador, ligacoes) VALUES (?, ?)
    ON CONFLICT (id_utilizador) DO UPDATE SET ligacoes = excluded.ligacoes`,
    [userId, JSON.stringify(links)],
  );
}
