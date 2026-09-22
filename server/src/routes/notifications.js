import { Router } from 'express';
import { queryAll, execute } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = queryAll('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50', [userId]);
    return res.json(notifications.map(n => ({
      ...n,
      isRead: n.isRead === 1
    })));
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao obter notificações'
    });
  }
});
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    execute('UPDATE notifications SET isRead = 1 WHERE userId = ?', [userId]);
    return res.json({
      success: true
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao atualizar notificações'
    });
  }
});
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const userId = req.user.id;
    execute('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [id, userId]);
    return res.json({
      success: true
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao marcar notificação como lida'
    });
  }
});
export default router;