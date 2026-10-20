const { queryAll, queryOne, execute } = require('../database/connection.js');
const Social = {
  listAcceptedFriendshipsByRequesterIdAndAddresseeId(params = []) {
    return queryAll(
      `SELECT f.id as "friendshipId", f."createdAt" as "friendsSince",
              CASE WHEN f."requesterId" = $1 THEN f."addresseeId" ELSE f."requesterId" END as "friendId"
         FROM friendships f
         WHERE (f."requesterId" = $2 OR f."addresseeId" = $3) AND f.status = 'ACCEPTED'`,
      params,
    );
  },
  findUById(params = []) {
    return queryOne(
      'SELECT id, name, username, "avatarUrl", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = users.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio FROM users WHERE id = $1',
      params,
    );
  },
  listIncomingByAddresseeId(params = []) {
    return queryAll(
      `SELECT f.id as "friendshipId", f."createdAt", u.id as user_id, u.name, u.username, u."avatarUrl", u.role
       FROM friendships f
       JOIN users u ON f."requesterId" = u.id
       WHERE f."addresseeId" = $1 AND f.status = 'PENDING'`,
      params,
    );
  },
  listOutgoingByRequesterId(params = []) {
    return queryAll(
      `SELECT f.id as "friendshipId", f."createdAt", u.id as user_id, u.name, u.username, u."avatarUrl", u.role
       FROM friendships f
       JOIN users u ON f."addresseeId" = u.id
       WHERE f."requesterId" = $1 AND f.status = 'PENDING'`,
      params,
    );
  },
  findTargetUserById(params = []) {
    return queryOne('SELECT id, name FROM users WHERE id = $1', params);
  },
  findExistingByRequesterIdAndAddresseeId(params = []) {
    return queryOne(
      'SELECT * FROM friendships WHERE ("requesterId" = $1 AND "addresseeId" = $2) OR ("requesterId" = $3 AND "addresseeId" = $4)',
      params,
    );
  },
  updateFriendshipsByUpdatedAtAndId(params = []) {
    return execute(
      "UPDATE amizades SET estado = 'ACCEPTED', atualizado_em = $1 WHERE id = $2",
      params,
    );
  },
  insertFriendships(params = []) {
    return execute(
      "INSERT INTO amizades (id, id_solicitante, id_destinatario, estado, criado_em, atualizado_em) VALUES ($1, $2, $3, 'PENDING', $4, $5)",
      params,
    );
  },
  insertNotifications(params = []) {
    return execute(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'social', $3, $4, '/messages', 0, $5)",
      params,
    );
  },
  findFriendshipById(params = []) {
    return queryOne('SELECT * FROM friendships WHERE id = $1', params);
  },
  deleteFriendshipsById(params = []) {
    return execute('DELETE FROM amizades WHERE id = $1', params);
  },
  deleteFriendshipsByRequesterIdAndAddresseeId(params = []) {
    return execute(
      'DELETE FROM amizades WHERE (id_solicitante = $1 AND id_destinatario = $2) OR (id_solicitante = $3 AND id_destinatario = $4)',
      params,
    );
  },
  findTargetUserByIdForPostSocialFollowByTargetUserId(params = []) {
    return queryOne('SELECT id FROM users WHERE id = $1', params);
  },
  findExistingByFollowerIdAndFollowingId(params = []) {
    return queryOne(
      'SELECT id FROM follows WHERE "followerId" = $1 AND "followingId" = $2',
      params,
    );
  },
  insertFollows(params = []) {
    return execute(
      'INSERT INTO seguidores (id, id_seguidor, id_a_seguir, criado_em) VALUES ($1, $2, $3, $4)',
      params,
    );
  },
  insertNotificationsForLookup(params = []) {
    return execute(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'social', $3, $4, $5, 0, $6)",
      params,
    );
  },
  deleteFollowsByFollowerIdAndFollowingId(params = []) {
    return execute('DELETE FROM seguidores WHERE id_seguidor = $1 AND id_a_seguir = $2', params);
  },
  listFollowersByFollowingId(params = []) {
    return queryAll(
      `SELECT u.id, u.name, u.username, u."avatarUrl", u.role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END AS bio, f."createdAt" as "followedAt"
       FROM follows f
       JOIN users u ON f."followerId" = u.id
       WHERE f."followingId" = $1
       ORDER BY f."createdAt" DESC`,
      params,
    );
  },
  listFollowingByFollowerId(params = []) {
    return queryAll(
      `SELECT u.id, u.name, u.username, u."avatarUrl", u.role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END AS bio, f."createdAt" as "followedAt"
       FROM follows f
       JOIN users u ON f."followingId" = u.id
       WHERE f."followerId" = $1
       ORDER BY f."createdAt" DESC`,
      params,
    );
  },
  countFollowsByFollowingId(params = []) {
    return queryOne('SELECT COUNT(*) as c FROM follows WHERE "followingId" = $1', params);
  },
  countFollowsByFollowerId(params = []) {
    return queryOne('SELECT COUNT(*) as c FROM follows WHERE "followerId" = $1', params);
  },
  countFriendshipsByRequesterIdAndAddresseeId(params = []) {
    return queryOne(
      'SELECT COUNT(*) as c FROM friendships WHERE ("requesterId" = $1 OR "addresseeId" = $2) AND status = \'ACCEPTED\'',
      params,
    );
  },
  listUsers(params = []) {
    return queryAll(
      'SELECT id, name, username, "avatarUrl", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = users.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio FROM users WHERE id != $1 AND "isSuspended" = 0 LIMIT 15',
      params,
    );
  },
  listUsersForGetSocialUsersSearch(params = []) {
    return queryAll(
      'SELECT id, name, username, "avatarUrl", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = users.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio FROM users WHERE "isSuspended" = 0 LIMIT 15',
      params,
    );
  },
  listUsersByNameAndUsername(params = []) {
    return queryAll(
      `SELECT id, name, username, "avatarUrl", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = users.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio
         FROM users
         WHERE id != $1 AND "isSuspended" = 0 AND (name LIKE $2 OR username LIKE $3)
         LIMIT 20`,
      params,
    );
  },
  listUsersByNameAndUsernameForGetSocialUsersSearch(params = []) {
    return queryAll(
      `SELECT id, name, username, "avatarUrl", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = users.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio
         FROM users
         WHERE "isSuspended" = 0 AND (name LIKE $1 OR username LIKE $2)
         LIMIT 20`,
      params,
    );
  },
  listPeersBySenderIdAndReceiverId(params = []) {
    return queryAll(
      `SELECT DISTINCT CASE WHEN "senderId" = $1 THEN "receiverId" ELSE "senderId" END as "peerId"
       FROM direct_messages
       WHERE "senderId" = $2 OR "receiverId" = $3`,
      params,
    );
  },
  findLastMessageBySenderIdAndReceiverId(params = []) {
    return queryOne(
      `SELECT * FROM direct_messages 
         WHERE ("senderId" = $1 AND "receiverId" = $2) OR ("senderId" = $3 AND "receiverId" = $4)
         ORDER BY "createdAt" DESC LIMIT 1`,
      params,
    );
  },
  countDirectMessagesBySenderIdAndReceiverId(params = []) {
    return queryOne(
      'SELECT COUNT(*) as c FROM direct_messages WHERE "senderId" = $1 AND "receiverId" = $2 AND "isRead" = 0',
      params,
    );
  },
  updateDirectMessagesBySenderIdAndReceiverId(params = []) {
    return execute(
      'UPDATE mensagens_diretas SET esta_lida = 1 WHERE id_remetente = $1 AND id_destinatario = $2 AND esta_lida = 0',
      params,
    );
  },
  listMessagesBySenderIdAndReceiverId(params = []) {
    return queryAll(
      `SELECT m.*,
              u.id as user_id, u.name as user_name, u.username as user_username, u."avatarUrl" as "user_avatarUrl", u.role as user_role
         FROM direct_messages m
         JOIN users u ON m."senderId" = u.id
         WHERE (m."senderId" = $1 AND m."receiverId" = $2) OR (m."senderId" = $3 AND m."receiverId" = $4)
         ORDER BY m."createdAt" ASC
         LIMIT 150`,
      params,
    );
  },
  insertDirectMessages(params = []) {
    return execute(
      'INSERT INTO mensagens_diretas (id, id_remetente, id_destinatario, conteudo, esta_lida, criado_em) VALUES ($1, $2, $3, $4, 0, $5)',
      params,
    );
  },
  findSenderById(params = []) {
    return queryOne(
      'SELECT id, name, username, "avatarUrl", role FROM users WHERE id = $1',
      params,
    );
  },
};

module.exports = Social;
