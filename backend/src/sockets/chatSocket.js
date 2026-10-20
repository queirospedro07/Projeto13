const { socketUser, broadcastPresence } = require('./security.js');
const { canAccessSpace } = require('../services/courseAccess.js');
const { queryOne } = require('../database/connection.js');
const { canAccessChannel } = require('../middleware/channelAccess.js');
const onlineUsers = new Map();
const voiceRooms = new Map();
const directCalls = new Map();

async function canModerateVoiceRoom(user, roomId) {
  if (!user?.id || !roomId) return false;
  if (user.role === 'ADMIN') return true;
  const channel = await queryOne(
    `SELECT c.id_espaco AS "spaceId", s.id_proprietario AS "ownerId"
     FROM canais c
     JOIN espacos s ON s.id = c.id_espaco
     WHERE c.id = $1`,
    [roomId],
  );
  const spaceId = channel?.spaceId || roomId;
  if (channel?.ownerId === user.id) return true;
  const spaceOwner = await queryOne(
    'SELECT id FROM espacos WHERE id = $1 AND id_proprietario = $2',
    [spaceId, user.id],
  );
  if (spaceOwner) return true;
  const courseOwnerOrCollab = await queryOne(
    `SELECT c.id FROM cursos c
     LEFT JOIN colaboradores_curso cc ON cc.id_curso = c.id
     WHERE (c.id_espaco = $1 OR c.id = $2) AND (c.id_criador = $3 OR cc.id_utilizador = $4)
     LIMIT 1`,
    [spaceId, roomId, user.id, user.id],
  );

  return Boolean(courseOwnerOrCollab);
}

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    if (!socket.data?.user) return socket.disconnect(true);
    let packetCount = 0;
    let packetWindow = Date.now();
    const joinedVoice = (roomId) => Boolean(voiceRooms.get(roomId)?.has(socket.id));
    const roomIdentifier = (value) =>
      typeof value === 'string' && value.length <= 180 && /^[a-zA-Z0-9_-]+$/.test(value);

    socket.use(async (packet, next) => {
      try {
        if (Date.now() - packetWindow > 10000) {
          packetCount = 0;
          packetWindow = Date.now();
        }

        if (++packetCount > 250)
          return next(new Error('Demasiados eventos. Aguarde alguns segundos.'));
        for (const [id, call] of directCalls)
          if (Date.now() - call.created > 600000 && !voiceRooms.has(id)) directCalls.delete(id);
        const actor = await socketUser(socket);

        socket.data.user = actor;

        const [event, data] = packet;
        if (['send-message', 'direct-message', 'reaction-updated'].includes(event))
          return next(new Error('Envie mensagens pela API autenticada.'));
        if (['join-channel', 'leave-channel'].includes(event)) {
          if (!roomIdentifier(data) || !(await canAccessChannel(actor, data)))
            return next(new Error('Sem acesso ao canal.'));

          return next();
        }

        if (!data || typeof data !== 'object' || Array.isArray(data))
          return next(new Error('Evento inválido.'));
        if (
          ['typing', 'stop-typing'].includes(event) &&
          (!socket.rooms.has('channel_' + data.channelId) ||
            !(await canAccessChannel(actor, data.channelId)))
        )
          return next(new Error('Sem acesso ao canal.'));
        if (event === 'direct-call-start') {
          if (
            !roomIdentifier(data.roomId) ||
            typeof data.targetUserId !== 'string' ||
            data.targetUserId === actor.id
          )
            return next(new Error('Chamada inválida.'));
          const receiver = await queryOne(
            'SELECT id FROM users WHERE id = $1 AND "isSuspended" = 0',
            [data.targetUserId],
          );
          if (!receiver) return next(new Error('Destinatário indisponível.'));
          const previous = directCalls.get(data.roomId);
          if (previous && (previous.caller !== actor.id || previous.receiver !== receiver.id))
            return next(new Error('Sala indisponível.'));
          if (
            [...directCalls.values()].filter(
              (call) => call.caller === actor.id && Date.now() - call.created < 600000,
            ).length >= 3
          )
            return next(new Error('Já existem chamadas em curso.'));
          directCalls.set(data.roomId, {
            caller: actor.id,
            receiver: receiver.id,
            created: Date.now(),
          });
        } else if (event.startsWith('direct-call-')) {
          const call = directCalls.get(data.roomId);
          if (
            !call ||
            ![call.caller, call.receiver].includes(actor.id) ||
            (event !== 'direct-call-ended' && actor.id !== call.receiver)
          )
            return next(new Error('Sem acesso à chamada.'));
          data.callerId = call.caller;
          data.targetUserId = actor.id === call.caller ? call.receiver : call.caller;
          if (['direct-call-rejected', 'direct-call-ended'].includes(event)) {
            directCalls.delete(data.roomId);
            io.in('voice_' + data.roomId).socketsLeave('voice_' + data.roomId);
            voiceRooms.delete(data.roomId);
          }
        }

        if (event === 'join-voice-room') {
          if (!roomIdentifier(data.roomId)) return next(new Error('Sala inválida.'));
          const call = directCalls.get(data.roomId);
          const directAccess =
            call &&
            Date.now() - call.created < 600000 &&
            [call.caller, call.receiver].includes(actor.id);
          if (
            !directAccess &&
            !(await canAccessChannel(actor, data.roomId)) &&
            !(await canAccessSpace(actor, data.roomId))
          )
            return next(new Error('Sem acesso à sala.'));
        } else if (event.startsWith('voice-signal-')) {
          const sharesRoom = [...voiceRooms.values()].some(
            (room) => room.has(socket.id) && room.has(data.targetSocketId),
          );
          if (!sharesRoom) return next(new Error('O destinatário não pertence à sua sala.'));
        } else if (
          (event.startsWith('voice-') || event === 'leave-voice-room') &&
          !joinedVoice(data.roomId)
        )
          return next(new Error('Entre na sala antes de enviar eventos.'));
        if (event === 'voice-chat-message') {
          if (
            typeof data.message?.content !== 'string' ||
            !data.message.content.trim() ||
            data.message.content.length > 4000
          )
            return next(new Error('Mensagem inválida.'));
          data.message = {
            id: data.message.id,
            sender: actor.name,
            content: data.message.content.trim(),
            time: new Date().toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        }

        Object.assign(data, {
          userId: actor.id,
          username: actor.username,
          user: actor,
          caller: actor,
          callerUser: actor,
          responderUser: actor,
          acceptor: actor,
          rejector: actor,
        });
        next();
      } catch {
        next(new Error('Evento não autorizado.'));
      }
    });
    socket.on('error', () =>
      socket.emit('operation-error', {
        message: 'Operação não autorizada ou temporariamente limitada.',
      }),
    );

    const authUser = socket.data.user;
    if (authUser?.id) {
      onlineUsers.set(authUser.id, {
        userId: authUser.id,
        username: authUser.username,
        status: 'online',
        socketId: socket.id,
      });
      socket.join(`user_${authUser.id}`);
      broadcastPresence(io);
    }

    socket.on('user-connected', (userData) => {
      const effectiveUserId = socket.data?.user?.id || userData?.userId;
      const effectiveUsername = socket.data?.user?.username || userData?.username;
      if (effectiveUserId) {
        onlineUsers.set(effectiveUserId, {
          userId: effectiveUserId,
          username: effectiveUsername,
          status: 'online',
          socketId: socket.id,
        });
        socket.join(`user_${effectiveUserId}`);
        broadcastPresence(io);
      }
    });
    socket.on('join-channel', async (channelId) => {
      if (socket.data?.user && !(await canAccessChannel(socket.data.user, channelId))) {
        return;
      }

      socket.join(`channel_${channelId}`);
    });
    socket.on('leave-channel', (channelId) => {
      socket.leave(`channel_${channelId}`);
    });
    socket.on('typing', ({ channelId, username }) => {
      socket.to(`channel_${channelId}`).emit('user-typing', {
        channelId,
        username: socket.data?.user?.username || username,
      });
    });
    socket.on('stop-typing', ({ channelId, username }) => {
      socket.to(`channel_${channelId}`).emit('user-stop-typing', {
        channelId,
        username: socket.data?.user?.username || username,
      });
    });
    socket.on('join-voice-room', ({ roomId, user, isMuted, isDeafened, isCameraOn }) => {
      if (!roomId || !user) return;
      for (const [prevRoomId, prevRoom] of voiceRooms.entries()) {
        if (prevRoom.has(socket.id)) {
          const prevUser = prevRoom.get(socket.id);

          prevRoom.delete(socket.id);
          socket.leave(`voice_${prevRoomId}`);
          socket.to(`voice_${prevRoomId}`).emit('user-left-voice', {
            userId: prevUser?.user?.id || user.id,
            socketId: socket.id,
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
      const existingParticipants = Array.from(roomMap.values()).map((p) => ({
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
        bannerUrl: p.user?.bannerUrl,
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
        bannerUrl: user?.bannerUrl,
      });
      socket.to(`voice_${roomId}`).emit('user-joined-voice', {
        user,
        socketId: socket.id,
        isMuted: isMuted !== undefined ? Boolean(isMuted) : false,
        isDeafened: isDeafened !== undefined ? Boolean(isDeafened) : false,
        isCameraOn: isCameraOn !== undefined ? Boolean(isCameraOn) : false,
      });
    });
    socket.on('leave-voice-room', ({ roomId, userId }) => {
      socket.leave(`voice_${roomId}`);

      const room = voiceRooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) voiceRooms.delete(roomId);
      }

      socket.to(`voice_${roomId}`).emit('user-left-voice', {
        userId,
        socketId: socket.id,
      });
    });
    socket.on(
      'voice-state-update',
      ({
        roomId,
        userId,
        isMuted,
        isDeafened,
        isCameraOn,
        isScreenSharing,
        cameraTrackId,
        screenTrackId,
        cameraStreamId,
        screenStreamId,
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
          screenStreamId,
        });
      },
    );
    socket.on('voice-speaking-state', ({ roomId, userId, isSpeaking }) => {
      socket.to(`voice_${roomId}`).emit('user-voice-speaking-changed', {
        userId,
        socketId: socket.id,
        isSpeaking,
      });
    });
    socket.on('voice-signal-offer', (payload) => {
      io.to(payload.targetSocketId).emit('voice-signal-offer', {
        ...payload,
        callerSocketId: socket.id,
      });
    });
    socket.on('voice-signal-answer', (payload) => {
      io.to(payload.targetSocketId).emit('voice-signal-answer', {
        ...payload,
        responderSocketId: socket.id,
      });
    });
    socket.on('voice-signal-ice', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('voice-signal-ice', {
        candidate,
        fromSocketId: socket.id,
      });
    });
    socket.on('voice-chat-message', ({ roomId, message }) => {
      socket.to(`voice_${roomId}`).emit('voice-chat-message', message);
    });
    socket.on('voice-set-room-mode', async ({ roomId, mode }) => {
      if (socket.data?.user && !(await canModerateVoiceRoom(socket.data.user, roomId))) return;
      io.to(`voice_${roomId}`).emit('voice-room-mode-changed', {
        roomId,
        mode,
      });
    });
    socket.on(
      'voice-update-permissions',
      async ({ roomId, targetUserId, canSpeak, canShareScreen }) => {
        if (socket.data?.user && !(await canModerateVoiceRoom(socket.data.user, roomId))) return;
        io.to(`voice_${roomId}`).emit('voice-permissions-updated', {
          targetUserId,
          canSpeak,
          canShareScreen,
        });
      },
    );
    socket.on('voice-speaker-request', ({ roomId, user }) => {
      socket.to(`voice_${roomId}`).emit('voice-speaker-request', {
        user,
      });
    });
    socket.on('voice-speaker-decision', async ({ roomId, targetUserId, approved }) => {
      if (socket.data?.user && !(await canModerateVoiceRoom(socket.data.user, roomId))) return;
      io.to(`voice_${roomId}`).emit('voice-speaker-decision', {
        targetUserId,
        approved,
      });
    });
    socket.on('voice-kick-user', async ({ roomId, targetUserId }) => {
      if (socket.data?.user && !(await canModerateVoiceRoom(socket.data.user, roomId))) return;
      const participants = voiceRooms.get(roomId);
      if (participants)
        for (const [targetSocketId, participant] of participants) {
          if (participant.user.id === targetUserId) {
            participants.delete(targetSocketId);
            io.sockets.sockets.get(targetSocketId)?.leave('voice_' + roomId);
          }
        }

      io.to(`voice_${roomId}`).emit('voice-user-kicked', {
        targetUserId,
      });
    });

    // Chamadas Diretas (DMs)
    socket.on('direct-call-start', ({ targetUserId, caller, roomId }) => {
      if (!targetUserId || !caller) return;
      io.to(`user_${targetUserId}`).emit('direct-call-incoming', {
        caller,
        roomId,
      });
    });
    socket.on('direct-call-accepted', ({ callerId, roomId, acceptor }) => {
      if (!callerId) return;
      io.to(`user_${callerId}`).emit('direct-call-accepted', {
        roomId,
        acceptor,
      });
    });
    socket.on('direct-call-rejected', ({ callerId, roomId, rejector }) => {
      if (!callerId) return;
      io.to(`user_${callerId}`).emit('direct-call-rejected', {
        roomId,
        rejector,
      });
    });
    socket.on('direct-call-ended', ({ targetUserId, roomId }) => {
      if (!targetUserId) return;
      io.to(`user_${targetUserId}`).emit('direct-call-ended', {
        roomId,
      });
    });
    socket.on('disconnect', () => {
      for (const [roomId, call] of directCalls)
        if (Date.now() - call.created > 600000) directCalls.delete(roomId);
      for (const [roomId, room] of voiceRooms.entries()) {
        const participant = room.get(socket.id);
        if (participant) {
          room.delete(socket.id);
          socket.to(`voice_${roomId}`).emit('user-left-voice', {
            userId: participant.user?.id,
            socketId: socket.id,
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

      broadcastPresence(io);
    });
  });
}

exports.setupSocketIO = setupSocketIO;
