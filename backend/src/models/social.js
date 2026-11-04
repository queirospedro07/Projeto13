const { consultarTodos, consultarUm, executar } = require('../database/connection.js');
const Social = {
  listarAceiteAmizadesPorRequesterIdAndAddresseeId(parametros = []) {
    return consultarTodos(
      `SELECT f.id as "friendshipId", f."criadoEm" as "friendsSince",
              CASE WHEN f."idSolicitante" = $1 THEN f."idDestinatario" ELSE f."idSolicitante" END as "friendId"
         FROM consulta_amizades f
         WHERE (f."idSolicitante" = $2 OR f."idDestinatario" = $3) AND f.status = 'ACCEPTED'`,
      parametros,
    );
  },
  procurarUPorId(parametros = []) {
    return consultarUm(
      'SELECT id, name, username, "urlAvatar", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = consulta_utilizadores.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio FROM consulta_utilizadores WHERE id = $1',
      parametros,
    );
  },
  listarRecebidaPorAddresseeId(parametros = []) {
    return consultarTodos(
      `SELECT f.id as "friendshipId", f."criadoEm", u.id as user_id, u.name, u.username, u."urlAvatar", u.role
       FROM consulta_amizades f
       JOIN consulta_utilizadores u ON f."idSolicitante" = u.id
       WHERE f."idDestinatario" = $1 AND f.status = 'PENDING'`,
      parametros,
    );
  },
  listarEnviadaPorRequesterId(parametros = []) {
    return consultarTodos(
      `SELECT f.id as "friendshipId", f."criadoEm", u.id as user_id, u.name, u.username, u."urlAvatar", u.role
       FROM consulta_amizades f
       JOIN consulta_utilizadores u ON f."idDestinatario" = u.id
       WHERE f."idSolicitante" = $1 AND f.status = 'PENDING'`,
      parametros,
    );
  },
  procurarDestinoUtilizadorPorId(parametros = []) {
    return consultarUm('SELECT id, name FROM consulta_utilizadores WHERE id = $1', parametros);
  },
  procurarExistentePorRequesterIdAndAddresseeId(parametros = []) {
    return consultarUm(
      'SELECT * FROM consulta_amizades WHERE ("idSolicitante" = $1 AND "idDestinatario" = $2) OR ("idSolicitante" = $3 AND "idDestinatario" = $4)',
      parametros,
    );
  },
  atualizarAmizadesPorAtualizadoAtAndId(parametros = []) {
    return executar(
      "UPDATE amizades SET estado = 'ACCEPTED', atualizado_em = $1 WHERE id = $2",
      parametros,
    );
  },
  inserirAmizades(parametros = []) {
    return executar(
      "INSERT INTO amizades (id, id_solicitante, id_destinatario, estado, criado_em, atualizado_em) VALUES ($1, $2, $3, 'PENDING', $4, $5)",
      parametros,
    );
  },
  inserirNotificacoes(parametros = []) {
    return executar(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'social', $3, $4, '/consulta_mensagens', 0, $5)",
      parametros,
    );
  },
  procurarAmizadePorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_amizades WHERE id = $1', parametros);
  },
  eliminarAmizadesPorId(parametros = []) {
    return executar('DELETE FROM amizades WHERE id = $1', parametros);
  },
  eliminarAmizadesPorRequesterIdAndAddresseeId(parametros = []) {
    return executar(
      'DELETE FROM amizades WHERE (id_solicitante = $1 AND id_destinatario = $2) OR (id_solicitante = $3 AND id_destinatario = $4)',
      parametros,
    );
  },
  procurarDestinoUtilizadorPorIdParaEnviarSocialFollowPorDestinoUtilizadorId(parametros = []) {
    return consultarUm('SELECT id FROM consulta_utilizadores WHERE id = $1', parametros);
  },
  procurarExistentePorSeguidorIdAndSeguidosId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_seguidores WHERE "idSeguidor" = $1 AND "idSeguido" = $2',
      parametros,
    );
  },
  inserirSeguidores(parametros = []) {
    return executar(
      'INSERT INTO seguidores (id, id_seguidor, id_a_seguir, criado_em) VALUES ($1, $2, $3, $4)',
      parametros,
    );
  },
  inserirNotificacoesParaLookup(parametros = []) {
    return executar(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'social', $3, $4, $5, 0, $6)",
      parametros,
    );
  },
  eliminarSeguidoresPorSeguidorIdAndSeguidosId(parametros = []) {
    return executar(
      'DELETE FROM seguidores WHERE id_seguidor = $1 AND id_a_seguir = $2',
      parametros,
    );
  },
  listarSeguidoresPorSeguidosId(parametros = []) {
    return consultarTodos(
      `SELECT u.id, u.name, u.username, u."urlAvatar", u.role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END AS bio, f."criadoEm" as "followedAt"
       FROM consulta_seguidores f
       JOIN consulta_utilizadores u ON f."idSeguidor" = u.id
       WHERE f."idSeguido" = $1
       ORDER BY f."criadoEm" DESC`,
      parametros,
    );
  },
  listarSeguidosPorSeguidorId(parametros = []) {
    return consultarTodos(
      `SELECT u.id, u.name, u.username, u."urlAvatar", u.role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END AS bio, f."criadoEm" as "followedAt"
       FROM consulta_seguidores f
       JOIN consulta_utilizadores u ON f."idSeguido" = u.id
       WHERE f."idSeguidor" = $1
       ORDER BY f."criadoEm" DESC`,
      parametros,
    );
  },
  contarSeguidoresPorSeguidosId(parametros = []) {
    return consultarUm(
      'SELECT COUNT(*) as c FROM consulta_seguidores WHERE "idSeguido" = $1',
      parametros,
    );
  },
  contarSeguidoresPorSeguidorId(parametros = []) {
    return consultarUm(
      'SELECT COUNT(*) as c FROM consulta_seguidores WHERE "idSeguidor" = $1',
      parametros,
    );
  },
  contarAmizadesPorRequesterIdAndAddresseeId(parametros = []) {
    return consultarUm(
      'SELECT COUNT(*) as c FROM consulta_amizades WHERE ("idSolicitante" = $1 OR "idDestinatario" = $2) AND status = \'ACCEPTED\'',
      parametros,
    );
  },
  listarUtilizadores(parametros = []) {
    return consultarTodos(
      'SELECT id, name, username, "urlAvatar", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = consulta_utilizadores.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio FROM consulta_utilizadores WHERE id != $1 AND "estaSuspenso" = 0 LIMIT 15',
      parametros,
    );
  },
  listarUtilizadoresParaObterSocialUtilizadoresPesquisar(parametros = []) {
    return consultarTodos(
      'SELECT id, name, username, "urlAvatar", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = consulta_utilizadores.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio FROM consulta_utilizadores WHERE "estaSuspenso" = 0 LIMIT 15',
      parametros,
    );
  },
  listarUtilizadoresPorNomeAndNomeUtilizador(parametros = []) {
    return consultarTodos(
      `SELECT id, name, username, "urlAvatar", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = consulta_utilizadores.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio
         FROM consulta_utilizadores
         WHERE id != $1 AND "estaSuspenso" = 0 AND (name LIKE $2 OR username LIKE $3)
         LIMIT 20`,
      parametros,
    );
  },
  listarUtilizadoresPorNomeAndNomeUtilizadorParaObterSocialUtilizadoresPesquisar(parametros = []) {
    return consultarTodos(
      `SELECT id, name, username, "urlAvatar", role, CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = consulta_utilizadores.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN bio ELSE NULL END AS bio
         FROM consulta_utilizadores
         WHERE "estaSuspenso" = 0 AND (name LIKE $1 OR username LIKE $2)
         LIMIT 20`,
      parametros,
    );
  },
  listarParticipantesPorRemetenteIdAndDestinatarioId(parametros = []) {
    return consultarTodos(
      `SELECT DISTINCT CASE WHEN "idRemetente" = $1 THEN "idDestinatarioMensagem" ELSE "idRemetente" END as "peerId"
       FROM consulta_mensagens_diretas
       WHERE "idRemetente" = $2 OR "idDestinatarioMensagem" = $3`,
      parametros,
    );
  },
  procurarUltimaMensagemPorRemetenteIdAndDestinatarioId(parametros = []) {
    return consultarUm(
      `SELECT * FROM consulta_mensagens_diretas 
         WHERE ("idRemetente" = $1 AND "idDestinatarioMensagem" = $2) OR ("idRemetente" = $3 AND "idDestinatarioMensagem" = $4)
         ORDER BY "criadoEm" DESC LIMIT 1`,
      parametros,
    );
  },
  contarDiretaMensagensPorRemetenteIdAndDestinatarioId(parametros = []) {
    return consultarUm(
      'SELECT COUNT(*) as c FROM consulta_mensagens_diretas WHERE "idRemetente" = $1 AND "idDestinatarioMensagem" = $2 AND "estaLida" = 0',
      parametros,
    );
  },
  atualizarDiretaMensagensPorRemetenteIdAndDestinatarioId(parametros = []) {
    return executar(
      'UPDATE mensagens_diretas SET esta_lida = 1 WHERE id_remetente = $1 AND id_destinatario = $2 AND esta_lida = 0',
      parametros,
    );
  },
  listarMensagensPorRemetenteIdAndDestinatarioId(parametros = []) {
    return consultarTodos(
      `SELECT m.*,
              u.id as user_id, u.name as user_name, u.username as user_username, u."urlAvatar" as "user_avatarUrl", u.role as user_role
         FROM consulta_mensagens_diretas m
         JOIN consulta_utilizadores u ON m."idRemetente" = u.id
         WHERE (m."idRemetente" = $1 AND m."idDestinatarioMensagem" = $2) OR (m."idRemetente" = $3 AND m."idDestinatarioMensagem" = $4)
         ORDER BY m."criadoEm" ASC
         LIMIT 150`,
      parametros,
    );
  },
  inserirDiretaMensagens(parametros = []) {
    return executar(
      'INSERT INTO mensagens_diretas (id, id_remetente, id_destinatario, conteudo, esta_lida, criado_em) VALUES ($1, $2, $3, $4, 0, $5)',
      parametros,
    );
  },
  procurarRemetentePorId(parametros = []) {
    return consultarUm(
      'SELECT id, name, username, "urlAvatar", role FROM consulta_utilizadores WHERE id = $1',
      parametros,
    );
  },
};

module.exports = Social;
