const Notification = require('../models/Notification.js');
const getNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.listNotificationsByUserId([userId]);
    return res.json(
      notifications.map((n) => ({
        ...n,
        isRead: n.isRead === 1,
      })),
    );
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao obter notificações',
    });
  }
};
const putNotificationReadAll = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateNotificationsByUserId([userId]);
    return res.json({
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao atualizar notificações',
    });
  }
};
const putNotificationByIdRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await Notification.updateNotificationsByIdAndUserId([id, userId]);
    return res.json({
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao marcar notificação como lida',
    });
  }
};
exports.getNotification = getNotification;
exports.putNotificationReadAll = putNotificationReadAll;
exports.putNotificationByIdRead = putNotificationByIdRead;
