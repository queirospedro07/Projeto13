import { Router } from 'express';
import { queryAll, queryOne, execute } from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';
import { canAccessChannel } from '../middleware/channelAccess.js';
import { canModerateSpace } from '../services/courseAccess.js';
import { randomUUID } from 'node:crypto';
const router = Router();
router.get('/channels/:channelId/messages', authenticate, async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!canAccessChannel(req.user, channelId)) {
      return res.status(403).json({ error: 'Não tem acesso a este canal.' });
    }
    const messages = queryAll(
      `SELECT m.*,
              u.id as user_id, u.name as user_name, u.username as user_username, u.avatarUrl as user_avatarUrl, u.role as user_role
       FROM messages m
       JOIN users u ON m.userId = u.id
       WHERE m.channelId = ?
       ORDER BY m.createdAt ASC
       LIMIT 100`,
      [channelId],
    );
    const formatted = messages.map((m) => {
      let replyTo = null;
      if (m.parentId) {
        const parent = queryOne(
          `SELECT m.id, m.content, u.username FROM messages m JOIN users u ON m.userId = u.id WHERE m.id = ? AND m.channelId = ?`,
          [m.parentId, channelId],
        );
        if (parent) {
          replyTo = {
            id: parent.id,
            content: parent.content,
            sender: {
              username: parent.username,
            },
          };
        }
      }
      return {
        id: m.id,
        channelId: m.channelId,
        senderId: m.userId,
        content: m.content,
        parentId: m.parentId,
        attachments: (() => {
          try {
            return m.attachments ? JSON.parse(m.attachments) : [];
          } catch (_) {
            return [];
          }
        })(),
        isResolved: Boolean(
          queryOne('SELECT id_mensagem FROM resolucoes_mensagens WHERE id_mensagem=?', [m.id]),
        ),
        isPinned: m.isPinned === 1,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        sender: {
          id: m.user_id,
          name: m.user_name,
          username: m.user_username,
          avatarUrl: m.user_avatarUrl,
          role: m.user_role,
        },
        reactions: [],
        replyTo,
      };
    });
    return res.json(formatted);
  } catch (err) {
    console.error('Messages error:', err);
    return res.status(500).json({
      error: 'Falha ao obter mensagens',
    });
  }
});
router.post('/channels/:channelId/messages', authenticate, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, replyToId, attachments } = req.body;
    const userId = req.user.id;
    if (!canAccessChannel(req.user, channelId)) {
      return res.status(403).json({ error: 'Não tem acesso a este canal.' });
    }
    const channelInfo = queryOne(
      `SELECT c.isLocked, c.accessMode, c.type, c.spaceId, s.ownerId
       FROM channels c
       LEFT JOIN spaces s ON s.id = c.spaceId
       WHERE c.id = ?`,
      [channelId],
    );
    if (!channelInfo) {
      return res.status(404).json({ error: 'Canal não encontrado.' });
    }
    if (
      channelInfo.isLocked === 1 ||
      channelInfo.accessMode === 'announcement' ||
      channelInfo.type === 'announcement'
    ) {
      const isGlobalMod = req.user.role === 'ADMIN';
      const isSpaceOwner = channelInfo.ownerId === userId;
      const isCourseCreatorOrCollab = Boolean(
        queryOne(
          `SELECT c.id FROM courses c
         LEFT JOIN course_collaborators cc ON cc.courseId = c.id
         WHERE c.spaceId = ? AND (c.creatorId = ? OR cc.userId = ?)
         LIMIT 1`,
          [channelInfo.spaceId, userId, userId],
        ),
      );
      if (!isGlobalMod && !isSpaceOwner && !isCourseCreatorOrCollab) {
        return res.status(403).json({
          error: 'Apenas formadores, colaboradores e administradores podem publicar neste canal.',
        });
      }
    }
    const now = new Date().toISOString();
    if (typeof content !== 'string' || !content.trim() || content.length > 4000) {
      return res.status(400).json({
        error: 'O conteúdo da mensagem não pode estar vazio',
      });
    }
    if (
      replyToId != null &&
      (typeof replyToId !== 'string' ||
        !queryOne('SELECT id FROM messages WHERE id = ? AND channelId = ?', [replyToId, channelId]))
    ) {
      return res.status(400).json({ error: 'A resposta deve referir uma mensagem deste canal.' });
    }
    // File uploads need a dedicated storage service; never accept arbitrary inline files.
    if (attachments != null && (!Array.isArray(attachments) || attachments.length > 0)) {
      return res.status(400).json({
        error: 'Os anexos ainda não estão disponíveis. Partilhe uma ligação na mensagem.',
      });
    }
    const messageId = randomUUID();
    const attachStr = attachments ? JSON.stringify(attachments) : null;
    execute(
      `INSERT INTO messages (id, channelId, userId, content, parentId, attachments, isPinned, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [messageId, channelId, userId, content.trim(), replyToId || null, attachStr, now, now],
    );
    const user = queryOne('SELECT id, name, username, avatarUrl, role FROM users WHERE id = ?', [
      userId,
    ]);
    const newMsgObj = {
      id: messageId,
      channelId,
      senderId: userId,
      content: content.trim(),
      parentId: replyToId || null,
      attachments: attachments || [],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      sender: user,
      reactions: [],
    };
    const io = req.app.get('io');
    if (io) {
      io.to(`channel_${channelId}`).emit('new-message', newMsgObj);
    }
    return res.status(201).json(newMsgObj);
  } catch (err) {
    console.error('Post message error:', err);
    return res.status(500).json({
      error: 'Falha ao enviar mensagem',
    });
  }
});

router.post('/messages/:messageId/pin', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = queryOne('SELECT channelId, isPinned FROM messages WHERE id = ?', [messageId]);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }
    if (!canAccessChannel(req.user, message.channelId)) {
      return res.status(403).json({ error: 'Não tem acesso a este canal.' });
    }
    const channel = queryOne('SELECT spaceId FROM channels WHERE id = ?', [message.channelId]);
    if (!canModerateSpace(req.user, channel?.spaceId)) {
      return res.status(403).json({ error: 'Só a equipa de moderação pode fixar mensagens.' });
    }
    const newPinned = message.isPinned === 1 ? 0 : 1;
    execute('UPDATE messages SET isPinned = ? WHERE id = ?', [newPinned, messageId]);
    return res.json({
      success: true,
      messageId,
      isPinned: newPinned === 1,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao fixar/desafixar mensagem.' });
  }
});

router.post('/messages/:messageId/resolve', authenticate, (req, res) => {
  const message = queryOne(
    'SELECT m.id,c.spaceId FROM messages m JOIN channels c ON c.id=m.channelId WHERE m.id=?',
    [req.params.messageId],
  );
  if (!message) return res.status(404).json({ error: 'Mensagem não encontrada.' });
  if (!canModerateSpace(req.user, message.spaceId))
    return res.status(403).json({ error: 'Só a equipa do curso pode resolver dúvidas.' });
  const existing = queryOne('SELECT id_mensagem FROM resolucoes_mensagens WHERE id_mensagem=?', [
    message.id,
  ]);
  if (existing) execute('DELETE FROM resolucoes_mensagens WHERE id_mensagem=?', [message.id]);
  else
    execute(
      'INSERT INTO resolucoes_mensagens(id_mensagem,id_utilizador,resolvido_em) VALUES(?,?,?)',
      [message.id, req.user.id, new Date().toISOString()],
    );
  return res.json({ isResolved: !existing });
});
export default router;
