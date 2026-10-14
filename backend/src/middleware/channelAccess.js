import { queryOne } from '../database/connection.js';

export function canAccessChannel(user, channelId) {
  if (!user?.id || !channelId) return false;
  if (user.role === 'ADMIN') return true;

  const channel = queryOne(
    `SELECT c.id_espaco AS spaceId, s.id_proprietario AS ownerId
     FROM canais c
     JOIN espacos s ON s.id = c.id_espaco
     WHERE c.id = ?`,
    [channelId]
  );

  if (!channel) return false;
  if (channel.ownerId === user.id) return true;

  const isCollab = queryOne(
    `SELECT cc.id
     FROM colaboradores_curso cc
     JOIN cursos c ON c.id = cc.id_curso
     WHERE c.id_espaco = ? AND cc.id_utilizador = ?
     LIMIT 1`,
    [channel.spaceId, user.id]
  );
  if (isCollab) return true;

  const membership = queryOne(
    'SELECT id FROM membros_espacos WHERE id_espaco = ? AND id_utilizador = ?',
    [channel.spaceId, user.id]
  );
  if (membership) return true;

  return Boolean(queryOne(
    `SELECT e.id
     FROM inscricoes e
     JOIN cursos c ON c.id = e.id_curso
     WHERE c.id_espaco = ? AND e.id_utilizador = ?
     LIMIT 1`,
    [channel.spaceId, user.id]
  ));
}