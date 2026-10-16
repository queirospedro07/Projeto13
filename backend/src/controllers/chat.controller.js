const Chat = require('../models/Chat.js');
const { asyncMap } = require('../utils/asyncCollections.js');
const { canAccessChannel } = require('../middleware/channelAccess.js');
const { canModerateSpace } = require('../services/courseAccess.js');
const { randomUUID } = require('node:crypto');
const getChatChannelsByChannelIdMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!(await canAccessChannel(req.user, channelId))) {
      return res.status(403).json({
        error: 'Não tem acesso a este canal.',
      });
    }
    const messages = await Chat.listMessagesByChannelId([channelId]);
    const formatted = await asyncMap(messages, async (m) => {
      let replyTo = null;
      if (m.parentId) {
        const parent = await Chat.findParentByIdAndChannelId([m.parentId, channelId]);
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
        isResolved: Boolean(await Chat.findResolucoesMensagensByIdMensagem([m.id])),
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
};
const postChatChannelsByChannelIdMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, replyToId, attachments } = req.body;
    const userId = req.user.id;
    if (!(await canAccessChannel(req.user, channelId))) {
      return res.status(403).json({
        error: 'Não tem acesso a este canal.',
      });
    }
    const channelInfo = await Chat.findChannelInfoById([channelId]);
    if (!channelInfo) {
      return res.status(404).json({
        error: 'Canal não encontrado.',
      });
    }
    if (
      channelInfo.isLocked === 1 ||
      channelInfo.accessMode === 'announcement' ||
      channelInfo.type === 'announcement'
    ) {
      const isGlobalMod = req.user.role === 'ADMIN';
      const isSpaceOwner = channelInfo.ownerId === userId;
      const isCourseCreatorOrCollab = Boolean(
        await Chat.findCoursesBySpaceIdAndCreatorIdAndUserId([channelInfo.spaceId, userId, userId]),
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
        !(await Chat.findMessagesByIdAndChannelId([replyToId, channelId])))
    ) {
      return res.status(400).json({
        error: 'A resposta deve referir uma mensagem deste canal.',
      });
    }
    // File uploads need a dedicated storage service; never accept arbitrary inline files.
    if (attachments != null && (!Array.isArray(attachments) || attachments.length > 0)) {
      return res.status(400).json({
        error: 'Os anexos ainda não estão disponíveis. Partilhe uma ligação na mensagem.',
      });
    }
    const messageId = randomUUID();
    const attachStr = attachments ? JSON.stringify(attachments) : null;
    await Chat.insertMessages([
      messageId,
      channelId,
      userId,
      content.trim(),
      replyToId || null,
      attachStr,
      now,
      now,
    ]);
    const user = await Chat.findUserById([userId]);
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
};
const postChatMessagesByMessageIdPin = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Chat.findMessageById([messageId]);
    if (!message) {
      return res.status(404).json({
        error: 'Mensagem não encontrada.',
      });
    }
    if (!(await canAccessChannel(req.user, message.channelId))) {
      return res.status(403).json({
        error: 'Não tem acesso a este canal.',
      });
    }
    const channel = await Chat.findChannelById([message.channelId]);
    if (!(await canModerateSpace(req.user, channel?.spaceId))) {
      return res.status(403).json({
        error: 'Só a equipa de moderação pode fixar mensagens.',
      });
    }
    const newPinned = message.isPinned === 1 ? 0 : 1;
    await Chat.updateMessagesByIsPinnedAndId([newPinned, messageId]);
    return res.json({
      success: true,
      messageId,
      isPinned: newPinned === 1,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao fixar/desafixar mensagem.',
    });
  }
};
const postChatMessagesByMessageIdResolve = async (req, res) => {
  const message = await Chat.findMessageByIdForPostChatMessagesByMessageIdResolve([
    req.params.messageId,
  ]);
  if (!message)
    return res.status(404).json({
      error: 'Mensagem não encontrada.',
    });
  if (!(await canModerateSpace(req.user, message.spaceId)))
    return res.status(403).json({
      error: 'Só a equipa do curso pode resolver dúvidas.',
    });
  const existing = await Chat.findResolucoesMensagensByIdMensagem([message.id]);
  if (existing) await Chat.deleteResolucoesMensagensByIdMensagem([message.id]);
  else await Chat.insertResolucoesMensagens([message.id, req.user.id, new Date().toISOString()]);
  return res.json({
    isResolved: !existing,
  });
};
exports.getChatChannelsByChannelIdMessages = getChatChannelsByChannelIdMessages;
exports.postChatChannelsByChannelIdMessages = postChatChannelsByChannelIdMessages;
exports.postChatMessagesByMessageIdPin = postChatMessagesByMessageIdPin;
exports.postChatMessagesByMessageIdResolve = postChatMessagesByMessageIdResolve;
