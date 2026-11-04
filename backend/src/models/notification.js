const { consultarTodos, executar } = require('../database/connection.js');
const Notificacao = {
  listarNotificacoesPorUtilizadorId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_notificacoes WHERE "idUtilizador" = $1 ORDER BY "criadoEm" DESC LIMIT 50',
      parametros,
    );
  },
  atualizarNotificacoesPorUtilizadorId(parametros = []) {
    return executar('UPDATE notificacoes SET esta_lida = 1 WHERE id_utilizador = $1', parametros);
  },
  atualizarNotificacoesPorIdAndUtilizadorId(parametros = []) {
    return executar(
      'UPDATE notificacoes SET esta_lida = 1 WHERE id = $1 AND id_utilizador = $2',
      parametros,
    );
  },
};

module.exports = Notificacao;
