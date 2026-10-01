import { queryAll, queryOne, execute } from '../database/connection.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = queryAll(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
      [req.user.id]
    );
    return res.json(notifications.map(n => ({ ...n, isRead: n.isRead === 1 })));
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar notificações.', error: 'Falha ao carregar notificações.' });
  }
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      execute('UPDATE notifications SET isRead = 1 WHERE userId = ?', [req.user.id]);
    } else {
      execute('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [id, req.user.id]);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao marcar notificação como lida.', error: 'Falha ao marcar notificação como lida.' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = (queryOne('SELECT COUNT(*) as c FROM notifications WHERE userId = ? AND isRead = 0', [req.user.id]) || {}).c || 0;
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao obter contagem.', error: 'Falha ao obter contagem.' });
  }
};

export default { getNotifications, markRead, getUnreadCount };
