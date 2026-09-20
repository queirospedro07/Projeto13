import { Server, Socket } from 'socket.io';

interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'dnd';
  socketId: string;
}

interface VoiceUser {
  socketId: string;
  user: any;
  roomId: string;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isScreenSharing?: boolean;
}

const onlineUsers = new Map<string, UserPresence>();
const voiceRooms = new Map<string, Map<string, VoiceUser>>();

export function setupSocketIO(io: Server) {
  io.on('connection', (socket: Socket) => {
    // User presence registration
    socket.on('user-connected', (userData: { userId: string; username: string }) => {
      if (userData?.userId) {
        onlineUsers.set(userData.userId, {
          userId: userData.userId,
          username: userData.username,
          status: 'online',
          socketId: socket.id,
        });

        // Join personal user notification room
        socket.join(`user_${userData.userId}`);

        // Broadcast updated online presence to everyone
        io.emit('presence-update', Array.from(onlineUsers.values()));
      }
    });

    // Channel Rooms
    socket.on('join-channel', (channelId: string) => {
      socket.join(`channel_${channelId}`);
    });

    socket.on('leave-channel', (channelId: string) => {
      socket.leave(`channel_${channelId}`);
    });

    // Typing Indicators
    socket.on('typing', ({ channelId, username }: { channelId: string; username: string }) => {
      socket.to(`channel_${channelId}`).emit('user-typing', { channelId, username });
    });

    socket.on('stop-typing', ({ channelId, username }: { channelId: string; username: string }) => {
      socket.to(`channel_${channelId}`).emit('user-stop-typing', { channelId, username });
    });

    // Real-time Chat message broadcast
    socket.on('send-message', (messageData: any) => {
      if (messageData.channelId) {
        // Broadcast to channel room
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

    socket.on('direct-message', (messageData: any) => {
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

    // Reaction updates
    socket.on('reaction-updated', ({ channelId, reactionData }: any) => {
      if (channelId) {
        io.to(`channel_${channelId}`).emit('reaction-changed', reactionData);
      }
    });

    // Voice & Video Room events
    socket.on('join-voice-room', ({ roomId, user }: { roomId: string; user: any }) => {
      if (!roomId || !user) return;
      socket.join(`voice_${roomId}`);

      if (!voiceRooms.has(roomId)) {
        voiceRooms.set(roomId, new Map());
      }
      const roomMap = voiceRooms.get(roomId)!;

      // 1. Send existing participants in the room to the newly joined user
      const existingParticipants = Array.from(roomMap.values()).map(p => ({
        user: p.user,
        socketId: p.socketId,
        isMuted: p.isMuted,
        isCameraOn: p.isCameraOn,
        isScreenSharing: p.isScreenSharing
      }));
      socket.emit('voice-room-existing-users', existingParticipants);

      // 2. Register current user in voice room map
      roomMap.set(socket.id, {
        socketId: socket.id,
        user,
        roomId,
        isMuted: false,
        isCameraOn: false,
        isScreenSharing: false
      });

      // 3. Notify other participants in the room
      socket.to(`voice_${roomId}`).emit('user-joined-voice', { user, socketId: socket.id });
    });

    socket.on('leave-voice-room', ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.leave(`voice_${roomId}`);
      const room = voiceRooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) voiceRooms.delete(roomId);
      }
      socket.to(`voice_${roomId}`).emit('user-left-voice', { userId, socketId: socket.id });
    });

    socket.on('voice-state-update', ({ roomId, userId, isMuted, isCameraOn, isScreenSharing }: any) => {
      const room = voiceRooms.get(roomId);
      if (room && room.has(socket.id)) {
        const current = room.get(socket.id)!;
        if (isMuted !== undefined) current.isMuted = isMuted;
        if (isCameraOn !== undefined) current.isCameraOn = isCameraOn;
        if (isScreenSharing !== undefined) current.isScreenSharing = isScreenSharing;
      }

      socket.to(`voice_${roomId}`).emit('user-voice-state-changed', {
        userId,
        socketId: socket.id,
        isMuted,
        isCameraOn,
        isScreenSharing,
      });
    });

    socket.on('voice-speaking-state', ({ roomId, userId, isSpeaking }: any) => {
      socket.to(`voice_${roomId}`).emit('user-voice-speaking-changed', {
        userId,
        socketId: socket.id,
        isSpeaking
      });
    });

    // WebRTC Peer-to-Peer Signaling
    socket.on('voice-signal-offer', ({ targetSocketId, offer, callerUser }: any) => {
      io.to(targetSocketId).emit('voice-signal-offer', {
        callerSocketId: socket.id,
        offer,
        callerUser
      });
    });

    socket.on('voice-signal-answer', ({ targetSocketId, answer }: any) => {
      io.to(targetSocketId).emit('voice-signal-answer', {
        responderSocketId: socket.id,
        answer
      });
    });

    socket.on('voice-signal-ice', ({ targetSocketId, candidate }: any) => {
      io.to(targetSocketId).emit('voice-signal-ice', {
        candidate,
        fromSocketId: socket.id
      });
    });

    // In-room voice chat messaging
    socket.on('voice-chat-message', ({ roomId, message }: any) => {
      io.to(`voice_${roomId}`).emit('voice-chat-message', message);
    });

    // Voice Room Mode Management (Stage vs Open Discussion vs Q&A)
    socket.on('voice-set-room-mode', ({ roomId, mode }: { roomId: string; mode: 'stage' | 'open' | 'qa' }) => {
      io.to(`voice_${roomId}`).emit('voice-room-mode-changed', { roomId, mode });
    });

    // Granular Participant Permissions
    socket.on('voice-update-permissions', ({ roomId, targetUserId, canSpeak, canShareScreen }: any) => {
      io.to(`voice_${roomId}`).emit('voice-permissions-updated', {
        targetUserId,
        canSpeak,
        canShareScreen
      });
    });

    // Speaker Request in Stage Mode
    socket.on('voice-speaker-request', ({ roomId, user }: any) => {
      socket.to(`voice_${roomId}`).emit('voice-speaker-request', { user });
    });

    socket.on('voice-speaker-decision', ({ roomId, targetUserId, approved }: any) => {
      io.to(`voice_${roomId}`).emit('voice-speaker-decision', { targetUserId, approved });
    });

    // Kick user from voice room
    socket.on('voice-kick-user', ({ roomId, targetUserId }: any) => {
      io.to(`voice_${roomId}`).emit('voice-user-kicked', { targetUserId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      // Clean up voice rooms
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
