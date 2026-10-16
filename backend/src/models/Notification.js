const { queryAll, execute } = require('../database/connection.js');
const Notification = {
  listNotificationsByUserId(params = []) {
    return queryAll(
      'SELECT * FROM notifications WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50',
      params,
    );
  },
  updateNotificationsByUserId(params = []) {
    return execute('UPDATE notificacoes SET esta_lida = 1 WHERE id_utilizador = $1', params);
  },
  updateNotificationsByIdAndUserId(params = []) {
    return execute(
      'UPDATE notificacoes SET esta_lida = 1 WHERE id = $1 AND id_utilizador = $2',
      params,
    );
  },
};
module.exports = Notification;
