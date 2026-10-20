const { queryAll, queryOne, execute } = require('../database/connection.js');
const Chat = {
  listMessagesByChannelId(params = []) {
    return queryAll(
      `SELECT m.*,
              u.id as user_id, u.name as user_name, u.username as user_username, u."avatarUrl" as "user_avatarUrl", u.role as user_role
       FROM messages m
       JOIN users u ON m."userId" = u.id
       WHERE m."channelId" = $1
       ORDER BY m."createdAt" ASC
       LIMIT 100`,
      params,
    );
  },
  findParentByIdAndChannelId(params = []) {
    return queryOne(
      'SELECT m.id, m.content, u.username FROM messages m JOIN users u ON m."userId" = u.id WHERE m.id = $1 AND m."channelId" = $2',
      params,
    );
  },
  findResolucoesMensagensByIdMensagem(params = []) {
    return queryOne('SELECT id_mensagem FROM resolucoes_mensagens WHERE id_mensagem=$1', params);
  },
  findChannelInfoById(params = []) {
    return queryOne(
      `SELECT c."isLocked", c."accessMode", c.type, c."spaceId", s."ownerId"
       FROM channels c
       LEFT JOIN spaces s ON s.id = c."spaceId"
       WHERE c.id = $1`,
      params,
    );
  },
  findCoursesBySpaceIdAndCreatorIdAndUserId(params = []) {
    return queryOne(
      `SELECT c.id FROM courses c
         LEFT JOIN course_collaborators cc ON cc."courseId" = c.id
         WHERE c."spaceId" = $1 AND (c."creatorId" = $2 OR cc."userId" = $3)
         LIMIT 1`,
      params,
    );
  },
  findMessagesByIdAndChannelId(params = []) {
    return queryOne('SELECT id FROM messages WHERE id = $1 AND "channelId" = $2', params);
  },
  insertMessages(params = []) {
    return execute(
      `INSERT INTO mensagens (id, id_canal, id_utilizador, conteudo, id_pai, anexos, esta_afixado, criado_em, atualizado_em)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)`,
      params,
    );
  },
  findUserById(params = []) {
    return queryOne(
      'SELECT id, name, username, "avatarUrl", role FROM users WHERE id = $1',
      params,
    );
  },
  findMessageById(params = []) {
    return queryOne('SELECT "channelId", "isPinned" FROM messages WHERE id = $1', params);
  },
  findChannelById(params = []) {
    return queryOne('SELECT "spaceId" FROM channels WHERE id = $1', params);
  },
  updateMessagesByIsPinnedAndId(params = []) {
    return execute('UPDATE mensagens SET esta_afixado = $1 WHERE id = $2', params);
  },
  findMessageByIdForPostChatMessagesByMessageIdResolve(params = []) {
    return queryOne(
      'SELECT m.id,c."spaceId" FROM messages m JOIN channels c ON c.id=m."channelId" WHERE m.id=$1',
      params,
    );
  },
  deleteResolucoesMensagensByIdMensagem(params = []) {
    return execute('DELETE FROM resolucoes_mensagens WHERE id_mensagem=$1', params);
  },
  insertResolucoesMensagens(params = []) {
    return execute(
      'INSERT INTO resolucoes_mensagens(id_mensagem,id_utilizador,resolvido_em) VALUES($1,$2,$3)',
      params,
    );
  },
};

module.exports = Chat;
