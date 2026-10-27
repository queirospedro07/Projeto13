const { consultarTodos, consultarUm, executar } = require('../base-dados/ligacao.js');
const Conversa = {
  listarMensagensPorCanalId(parametros = []) {
    return consultarTodos(
      `SELECT m.*,
              u.id as user_id, u.name as user_name, u.username as user_username, u."urlAvatar" as "user_avatarUrl", u.role as user_role
       FROM consulta_mensagens m
       JOIN consulta_utilizadores u ON m."idUtilizador" = u.id
       WHERE m."idCanal" = $1
       ORDER BY m."criadoEm" ASC
       LIMIT 100`,
      parametros,
    );
  },
  procurarParentPorIdAndCanalId(parametros = []) {
    return consultarUm(
      'SELECT m.id, m.content, u.username FROM consulta_mensagens m JOIN consulta_utilizadores u ON m."idUtilizador" = u.id WHERE m.id = $1 AND m."idCanal" = $2',
      parametros,
    );
  },
  procurarResolucoesMensagensPorIdMensagem(parametros = []) {
    return consultarUm(
      'SELECT id_mensagem FROM resolucoes_mensagens WHERE id_mensagem=$1',
      parametros,
    );
  },
  procurarCanalInfoPorId(parametros = []) {
    return consultarUm(
      `SELECT c."estaBloqueado", c."modoAcesso", c.type, c."idEspaco", s."idProprietario"
       FROM consulta_canais c
       LEFT JOIN consulta_espacos s ON s.id = c."idEspaco"
       WHERE c.id = $1`,
      parametros,
    );
  },
  procurarCursosPorEspacoIdAndFormadorIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      `SELECT c.id FROM consulta_cursos c
         LEFT JOIN consulta_colaboradores_curso cc ON cc."idCurso" = c.id
         WHERE c."idEspaco" = $1 AND (c."idFormador" = $2 OR cc."idUtilizador" = $3)
         LIMIT 1`,
      parametros,
    );
  },
  procurarMensagensPorIdAndCanalId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_mensagens WHERE id = $1 AND "idCanal" = $2',
      parametros,
    );
  },
  inserirMensagens(parametros = []) {
    return executar(
      `INSERT INTO mensagens (id, id_canal, id_utilizador, conteudo, id_pai, anexos, esta_afixado, criado_em, atualizado_em)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)`,
      parametros,
    );
  },
  procurarUtilizadorPorId(parametros = []) {
    return consultarUm(
      'SELECT id, name, username, "urlAvatar", role FROM consulta_utilizadores WHERE id = $1',
      parametros,
    );
  },
  procurarMensagemPorId(parametros = []) {
    return consultarUm(
      'SELECT "idCanal", "estaAfixada" FROM consulta_mensagens WHERE id = $1',
      parametros,
    );
  },
  procurarCanalPorId(parametros = []) {
    return consultarUm('SELECT "idEspaco" FROM consulta_canais WHERE id = $1', parametros);
  },
  atualizarMensagensPorIsAfixadoAndId(parametros = []) {
    return executar('UPDATE mensagens SET esta_afixado = $1 WHERE id = $2', parametros);
  },
  procurarMensagemPorIdParaEnviarConversaMensagensPorMensagemIdResolver(parametros = []) {
    return consultarUm(
      'SELECT m.id,c."idEspaco" FROM consulta_mensagens m JOIN consulta_canais c ON c.id=m."idCanal" WHERE m.id=$1',
      parametros,
    );
  },
  eliminarResolucoesMensagensPorIdMensagem(parametros = []) {
    return executar('DELETE FROM resolucoes_mensagens WHERE id_mensagem=$1', parametros);
  },
  inserirResolucoesMensagens(parametros = []) {
    return executar(
      'INSERT INTO resolucoes_mensagens(id_mensagem,id_utilizador,resolvido_em) VALUES($1,$2,$3)',
      parametros,
    );
  },
};

module.exports = Conversa;
