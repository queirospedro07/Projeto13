import { queryOne } from '../database/connection.js';
import { canAccessChannel } from '../middleware/channelAccess.js';

const onlineUsers = new Map();
const voiceRooms = new Map();

function canModerateVoiceRoom(user, roomId) {
  if (!user?.id || !roomId) return false;
  if (user.role === 'ADMIN') return true;

  const channel = queryOne(
    `SELECT c.id_espaco AS spaceId, s.id_proprietario AS ownerId
     FROM canais c
     JOIN espacos s ON s.id = c.id_espaco
     WHERE c.id = ?`,
    [roomId]
  );
  const spaceId = channel?.spaceId || roomId;
  if (channel?.ownerId === user.id) return true;

  const spaceOwner = queryOne('SELECT id FROM espacos WHERE id = ? AND id_proprietario = ?', [spaceId, user.id]);
  if (spaceOwner) return true;

  const courseOwnerOrCollab = queryOne(
    `SELECT c.id FROM cursos c
     LEFT JOIN colaboradores_curso cc ON cc.id_curso = c.id
     WHERE (c.id_espaco = ? OR c.id = ?) AND (c.id_criador = ? OR cc.id_utilizador = ?)
     LIMIT 1`,
    [spaceId, roomId, user.id, user.id]
  );
  return Boolean(courseOwnerOrCollab);
}

export function setupSocketIO(io) {
  io.on('connection', socket => {
    const authUser = socket.data?.user || null;
    if (authUser?.id) {
      onlineUsers.set(authUser.id, {
        userId: authUser.id,
        username: authUser.username,
        status: 'online',
        socketId: socket.id
      });
      socket.join(`user_${authUser.id}`);
      io.emit('presence-update', Array.from(onlineUsers.values()));
    }

    socket.on('user-connected', userData => {
      const effectiveUserId = socket.data?.user?.id || userData?.userId;
      const effectiveUsername = socket.data?.user?.username || userData?.username;
      if (effectiveUserId) {
        onlineUsers.set(effectiveUserId, {
          userId: effectiveUserId,
          username: effectiveUsername,
          status: 'online',
          socketId: socket.id
        });
        socket.join(`user_${effectiveUserId}`);
        io.emit('presence-update', Array.from(onlineUsers.values()));
      }
    });
    socket.on('join-channel', channelId => {
      if (socket.data?.user && !canAccessChannel(socket.data.user, channelId)) {
        return;
      }
      socket.join(`channel_${channelId}`);
    });
    socket.on('leave-channel', channelId => {
      socket.leave(`channel_${channelId}`);
    });
    socket.on('typing', ({
      channelId,
      username
    }) => {
      socket.to(`channel_${channelId}`).emit('user-typing', {
        channelId,
        username: socket.data?.user?.username || username
      });
    });
    socket.on('stop-typing', ({
      channelId,
      username
    }) => {
      socket.to(`channel_${channelId}`).emit('user-stop-typing', {
        channelId,
        username: socket.data?.user?.username || username
      });
    });
    socket.on('send-message', messageData => {
      if (messageData.channelId) {
        if (socket.data?.user && !canAccessChannel(socket.data.user, messageData.channelId)) {
          return;
        }
        io.to(`channel_${messageData.channelId}`).emit('new-message', messageData);
      } else {
        const targetId = messageData.recipientId || messageData.receiverId;
        const senderId = socket.data?.user?.id || messageData.senderId;
        if (targetId) {
          io.to(`user_${targetId}`).emit('direct-message', messageData);
          io.to(`user_${targetId}`).emit('new-direct-message', messageData);
        }
        if (senderId) {
          io.to(`user_${senderId}`).emit('direct-message', messageData);
          io.to(`user_${senderId}`).emit('new-direct-message', messageData);
        }
      }
    });
    socket.on('direct-message', messageData => {
      const targetId = messageData.recipientId || messageData.receiverId;
      const senderId = socket.data?.user?.id || messageData.senderId;
      if (targetId) {
        io.to(`user_${targetId}`).emit('direct-message', messageData);
        io.to(`user_${targetId}`).emit('new-direct-message', messageData);
      }
      if (senderId) {
        io.to(`user_${senderId}`).emit('direct-message', messageData);
        io.to(`user_${senderId}`).emit('new-direct-message', messageData);
      }
    });
    socket.on('reaction-updated', ({
      channelId,
      reactionData
    }) => {
      if (channelId) {
        io.to(`channel_${channelId}`).emit('reaction-changed', reactionData);
      }
    });
    socket.on('join-voice-room', ({
      roomId,
      user,
      isMuted,
      isDeafened,
      isCameraOn
    }) => {
      if (!roomId || !user) return;
      for (const [prevRoomId, prevRoom] of voiceRooms.entries()) {
        if (prevRoom.has(socket.id)) {
          const prevUser = prevRoom.get(socket.id);
          prevRoom.delete(socket.id);
          socket.leave(`voice_${prevRoomId}`);
          socket.to(`voice_${prevRoomId}`).emit('user-left-voice', {
            userId: prevUser?.user?.id || user.id,
            socketId: socket.id
          });
          if (prevRoom.size === 0) {
            voiceRooms.delete(prevRoomId);
          }
        }
      }
      socket.join(`voice_${roomId}`);
      if (!voiceRooms.has(roomId)) {
        voiceRooms.set(roomId, new Map());
      }
      const roomMap = voiceRooms.get(roomId);
      const existingParticipants = Array.from(roomMap.values()).map(p => ({
        user: p.user,
        socketId: p.socketId,
        isMuted: p.isMuted,
        isDeafened: p.isDeafened !== undefined ? Boolean(p.isDeafened) : false,
        isCameraOn: p.isCameraOn,
        isScreenSharing: p.isScreenSharing,
        cameraTrackId: p.cameraTrackId,
        screenTrackId: p.screenTrackId,
        cameraStreamId: p.cameraStreamId,
        screenStreamId: p.screenStreamId,
        bannerUrl: p.user?.bannerUrl
      }));
      socket.emit('voice-room-existing-users', existingParticipants);
      roomMap.set(socket.id, {
        socketId: socket.id,
        user,
        roomId,
        isMuted: isMuted !== undefined ? Boolean(isMuted) : false,
        isDeafened: isDeafened !== undefined ? Boolean(isDeafened) : false,
        isCameraOn: isCameraOn !== undefined ? Boolean(isCameraOn) : false,
        isScreenSharing: false,
        cameraTrackId: null,
        screenTrackId: null,
        cameraStreamId: null,
        screenStreamId: null,
        bannerUrl: user?.bannerUrl
      });
      socket.to(`voice_${roomId}`).emit('user-joined-voice', {
        user,
        socketId: socket.id,
        isMuted: isMuted !== undefined ? Boolean(isMuted) : false,
        isDeafened: isDeafened !== undefined ? Boolean(isDeafened) : false,
        isCameraOn: isCameraOn !== undefined ? Boolean(isCameraOn) : false
      });
    });
    socket.on('leave-voice-room', ({
      roomId,
      userId
    }) => {
      socket.leave(`voice_${roomId}`);
      const room = voiceRooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) voiceRooms.delete(roomId);
      }
      socket.to(`voice_${roomId}`).emit('user-left-voice', {
        userId,
        socketId: socket.id
      });
    });
    socket.on('voice-state-update', ({
      roomId,
      userId,
      isMuted,
      isDeafened,
      isCameraOn,
      isScreenSharing,
      cameraTrackId,
      screenTrackId,
      cameraStreamId,
      screenStreamId
    }) => {
      const room = voiceRooms.get(roomId);
      if (room && room.has(socket.id)) {
        const current = room.get(socket.id);
        if (isMuted !== undefined) current.isMuted = isMuted;
        if (isDeafened !== undefined) current.isDeafened = isDeafened;
        if (isCameraOn !== undefined) current.isCameraOn = isCameraOn;
        if (isScreenSharing !== undefined) current.isScreenSharing = isScreenSharing;
        if (cameraTrackId !== undefined) current.cameraTrackId = cameraTrackId;
        if (screenTrackId !== undefined) current.screenTrackId = screenTrackId;
        if (cameraStreamId !== undefined) current.cameraStreamId = cameraStreamId;
        if (screenStreamId !== undefined) current.screenStreamId = screenStreamId;
      }
      socket.to(`voice_${roomId}`).emit('user-voice-state-changed', {
        userId,
        socketId: socket.id,
        isMuted,
        isDeafened,
        isCameraOn,
        isScreenSharing,
        cameraTrackId,
        screenTrackId,
        cameraStreamId,
        screenStreamId
      });
    });
    socket.on('voice-speaking-state', ({
      roomId,
      userId,
      isSpeaking
    }) => {
      socket.to(`voice_${roomId}`).emit('user-voice-speaking-changed', {
        userId,
        socketId: socket.id,
        isSpeaking
      });
    });
    socket.on('voice-signal-offer', payload => {
      io.to(payload.targetSocketId).emit('voice-signal-offer', {
        ...payload,
        callerSocketId: socket.id
      });
    });
    socket.on('voice-signal-answer', payload => {
      io.to(payload.targetSocketId).emit('voice-signal-answer', {
        ...payload,
        responderSocketId: socket.id
      });
    });
    socket.on('voice-signal-ice', ({
      targetSocketId,
      candidate
    }) => {
      io.to(targetSocketId).emit('voice-signal-ice', {
        candidate,
        fromSocketId: socket.id
      });
    });

    socket.on('voice-chat-message', ({
      roomId,
      message
    }) => {
      socket.to(`voice_${roomId}`).emit('voice-chat-message', message);
    });
    socket.on('voice-set-room-mode', ({
      roomId,
      mode
    }) => {
      if (socket.data?.user && !canModerateVoiceRoom(socket.data.user, roomId)) return;
      io.to(`voice_${roomId}`).emit('voice-room-mode-changed', {
        roomId,
        mode
      });
    });
    socket.on('voice-update-permissions', ({
      roomId,
      targetUserId,
      canSpeak,
      canShareScreen
    }) => {
      if (socket.data?.user && !canModerateVoiceRoom(socket.data.user, roomId)) return;
      io.to(`voice_${roomId}`).emit('voice-permissions-updated', {
        targetUserId,
        canSpeak,
        canShareScreen
      });
    });
    socket.on('voice-speaker-request', ({
      roomId,
      user
    }) => {
      socket.to(`voice_${roomId}`).emit('voice-speaker-request', {
        user
      });
    });
    socket.on('voice-speaker-decision', ({
      roomId,
      targetUserId,
      approved
    }) => {
      if (socket.data?.user && !canModerateVoiceRoom(socket.data.user, roomId)) return;
      io.to(`voice_${roomId}`).emit('voice-speaker-decision', {
        targetUserId,
        approved
      });
    });
    socket.on('voice-kick-user', ({
      roomId,
      targetUserId
    }) => {
      if (socket.data?.user && !canModerateVoiceRoom(socket.data.user, roomId)) return;
      io.to(`voice_${roomId}`).emit('voice-user-kicked', {
        targetUserId
      });
    });

    // Chamadas Diretas (DMs)
    socket.on('direct-call-start', ({ targetUserId, caller, roomId }) => {
      if (!targetUserId || !caller) return;
      io.to(`user_${targetUserId}`).emit('direct-call-incoming', {
        caller,
        roomId
      });
    });

    socket.on('direct-call-accepted', ({ callerId, roomId, acceptor }) => {
      if (!callerId) return;
      io.to(`user_${callerId}`).emit('direct-call-accepted', {
        roomId,
        acceptor
      });
    });

    socket.on('direct-call-rejected', ({ callerId, roomId, rejector }) => {
      if (!callerId) return;
      io.to(`user_${callerId}`).emit('direct-call-rejected', {
        roomId,
        rejector
      });
    });

    socket.on('direct-call-ended', ({ targetUserId, roomId }) => {
      if (!targetUserId) return;
      io.to(`user_${targetUserId}`).emit('direct-call-ended', {
        roomId
      });
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of voiceRooms.entries()) {
        const participant = room.get(socket.id);
        if (participant) {
          room.delete(socket.id);
          socket.to(`voice_${roomId}`).emit('user-left-voice', {
            userId: participant.user?.id,
            socketId: socket.id
          });
          if (room.size === 0) voiceRooms.delete(roomId);
        }
      }
      for (const [userId, user] of onlineUsers.entries()) {
        if (user.socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('presence-update', Array.from(onlineUsers.values()));
    });
  });
}