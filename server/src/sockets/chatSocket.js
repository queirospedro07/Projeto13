const onlineUsers = new Map();
const voiceRooms = new Map();
export function setupSocketIO(io) {
  io.on('connection', socket => {
    socket.on('user-connected', userData => {
      if (userData?.userId) {
        onlineUsers.set(userData.userId, {
          userId: userData.userId,
          username: userData.username,
          status: 'online',
          socketId: socket.id
        });
        socket.join(`user_${userData.userId}`);
        io.emit('presence-update', Array.from(onlineUsers.values()));
      }
    });
    socket.on('join-channel', channelId => {
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
        username
      });
    });
    socket.on('stop-typing', ({
      channelId,
      username
    }) => {
      socket.to(`channel_${channelId}`).emit('user-stop-typing', {
        channelId,
        username
      });
    });
    socket.on('send-message', messageData => {
      if (messageData.channelId) {
        io.to(`channel_${messageData.channelId}`).emit('new-message', messageData);
      } else {
        const targetId = messageData.recipientId || messageData.receiverId;
        if (targetId) {
          io.to(`user_${targetId}`).emit('direct-message', messageData);
          io.to(`user_${targetId}`).emit('new-direct-message', messageData);
        }
        if (messageData.senderId) {
          io.to(`user_${messageData.senderId}`).emit('direct-message', messageData);
          io.to(`user_${messageData.senderId}`).emit('new-direct-message', messageData);
        }
      }
    });
    socket.on('direct-message', messageData => {
      const targetId = messageData.recipientId || messageData.receiverId;
      if (targetId) {
        io.to(`user_${targetId}`).emit('direct-message', messageData);
        io.to(`user_${targetId}`).emit('new-direct-message', messageData);
      }
      if (messageData.senderId) {
        io.to(`user_${messageData.senderId}`).emit('direct-message', messageData);
        io.to(`user_${messageData.senderId}`).emit('new-direct-message', messageData);
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
      user
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
        isCameraOn: p.isCameraOn,
        isScreenSharing: p.isScreenSharing,
        bannerUrl: p.user?.bannerUrl
      }));
      socket.emit('voice-room-existing-users', existingParticipants);
      roomMap.set(socket.id, {
        socketId: socket.id,
        user,
        roomId,
        isMuted: false,
        isCameraOn: false,
        isScreenSharing: false,
        bannerUrl: user?.bannerUrl
      });
      socket.to(`voice_${roomId}`).emit('user-joined-voice', {
        user,
        socketId: socket.id
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
      isCameraOn,
      isScreenSharing
    }) => {
      const room = voiceRooms.get(roomId);
      if (room && room.has(socket.id)) {
        const current = room.get(socket.id);
        if (isMuted !== undefined) current.isMuted = isMuted;
        if (isCameraOn !== undefined) current.isCameraOn = isCameraOn;
        if (isScreenSharing !== undefined) current.isScreenSharing = isScreenSharing;
      }
      socket.to(`voice_${roomId}`).emit('user-voice-state-changed', {
        userId,
        socketId: socket.id,
        isMuted,
        isCameraOn,
        isScreenSharing
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
    socket.on('voice-signal-offer', ({
      targetSocketId,
      offer,
      callerUser
    }) => {
      io.to(targetSocketId).emit('voice-signal-offer', {
        callerSocketId: socket.id,
        offer,
        callerUser
      });
    });
    socket.on('voice-signal-answer', ({
      targetSocketId,
      answer
    }) => {
      io.to(targetSocketId).emit('voice-signal-answer', {
        responderSocketId: socket.id,
        answer
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
      io.to(`voice_${roomId}`).emit('voice-chat-message', message);
    });
    socket.on('voice-set-room-mode', ({
      roomId,
      mode
    }) => {
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
      io.to(`voice_${roomId}`).emit('voice-speaker-decision', {
        targetUserId,
        approved
      });
    });
    socket.on('voice-kick-user', ({
      roomId,
      targetUserId
    }) => {
      io.to(`voice_${roomId}`).emit('voice-user-kicked', {
        targetUserId
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