const { socketUtilizador, difundirPresenca } = require('./security.js');
const { podeAcessoEspaco } = require('../services/courseAccess.js');
const { consultarUm } = require('../database/connection.js');
const { podeAcessoCanal } = require('../middleware/channelAccess.js');
const onlineUtilizadores = new Map();
const vozRooms = new Map();
const diretaChamadas = new Map();

async function podeModerateVozSala(utilizador, salaId) {
  if (!utilizador?.id || !salaId) return false;
  if (utilizador.role === 'ADMIN') return true;
  const canal = await consultarUm(
    `SELECT c.id_espaco AS "idEspaco", s.id_proprietario AS "idProprietario"
     FROM canais c
     JOIN espacos s ON s.id = c.id_espaco
     WHERE c.id = $1`,
    [salaId],
  );
  const espacoId = canal?.idEspaco || salaId;
  if (canal?.idProprietario === utilizador.id) return true;
  const espacoProprietario = await consultarUm(
    'SELECT id FROM espacos WHERE id = $1 AND id_proprietario = $2',
    [espacoId, utilizador.id],
  );
  if (espacoProprietario) return true;
  const cursoProprietarioOrCollab = await consultarUm(
    `SELECT c.id FROM cursos c
     LEFT JOIN colaboradores_curso cc ON cc.id_curso = c.id
     WHERE (c.id_espaco = $1 OR c.id = $2) AND (c.id_criador = $3 OR cc.id_utilizador = $4)
     LIMIT 1`,
    [espacoId, salaId, utilizador.id, utilizador.id],
  );

  return Boolean(cursoProprietarioOrCollab);
}

function configurarSocketIO(io) {
  io.on('connection', (socket) => {
    if (!socket.data?.user) return socket.disconnect(true);
    let packetContar = 0;
    let packetWindow = Date.now();
    const aderiuVoz = (salaId) => Boolean(vozRooms.get(salaId)?.has(socket.id));
    const salaIdentificador = (valor) =>
      typeof valor === 'string' && valor.length <= 180 && /^[a-zA-Z0-9_-]+$/.test(valor);

    socket.use(async (packet, seguinte) => {
      try {
        if (Date.now() - packetWindow > 10000) {
          packetContar = 0;
          packetWindow = Date.now();
        }

        if (++packetContar > 250)
          return seguinte(new Error('Demasiados eventos. Aguarde alguns segundos.'));
        for (const [id, chamada] of diretaChamadas)
          if (Date.now() - chamada.created > 600000 && !vozRooms.has(id)) diretaChamadas.delete(id);
        const actor = await socketUtilizador(socket);

        socket.data.user = actor;

        const [evento, dados] = packet;
        if (['send-message', 'direct-message', 'reaction-updated'].includes(evento))
          return seguinte(new Error('Envie mensagens pela API autenticada.'));
        if (['join-channel', 'leave-channel'].includes(evento)) {
          if (!salaIdentificador(dados) || !(await podeAcessoCanal(actor, dados)))
            return seguinte(new Error('Sem acesso ao canal.'));

          return seguinte();
        }

        if (!dados || typeof dados !== 'object' || Array.isArray(dados))
          return seguinte(new Error('Evento inválido.'));
        if (
          ['typing', 'stop-typing'].includes(evento) &&
          (!socket.rooms.has('channel_' + dados.idCanal) ||
            !(await podeAcessoCanal(actor, dados.idCanal)))
        )
          return seguinte(new Error('Sem acesso ao canal.'));
        if (evento === 'direct-call-start') {
          if (
            !salaIdentificador(dados.roomId) ||
            typeof dados.targetUserId !== 'string' ||
            dados.targetUserId === actor.id
          )
            return seguinte(new Error('Chamada inválida.'));
          const destinatario = await consultarUm(
            'SELECT id FROM consulta_utilizadores WHERE id = $1 AND "estaSuspenso" = 0',
            [dados.targetUserId],
          );
          if (!destinatario) return seguinte(new Error('Destinatário indisponível.'));
          const anterior = diretaChamadas.get(dados.roomId);
          if (anterior && (anterior.caller !== actor.id || anterior.receiver !== destinatario.id))
            return seguinte(new Error('Sala indisponível.'));
          if (
            [...diretaChamadas.values()].filter(
              (chamada) => chamada.caller === actor.id && Date.now() - chamada.created < 600000,
            ).length >= 3
          )
            return seguinte(new Error('Já existem chamadas em curso.'));
          diretaChamadas.set(dados.roomId, {
            caller: actor.id,
            receiver: destinatario.id,
            created: Date.now(),
          });
        } else if (evento.startsWith('direct-call-')) {
          const chamada = diretaChamadas.get(dados.roomId);
          if (
            !chamada ||
            ![chamada.caller, chamada.receiver].includes(actor.id) ||
            (evento !== 'direct-call-ended' && actor.id !== chamada.receiver)
          )
            return seguinte(new Error('Sem acesso à chamada.'));
          dados.callerId = chamada.caller;
          dados.targetUserId = actor.id === chamada.caller ? chamada.receiver : chamada.caller;
          if (['direct-call-rejeitado', 'direct-call-ended'].includes(evento)) {
            diretaChamadas.delete(dados.roomId);
            io.in('voice_' + dados.roomId).socketsLeave('voice_' + dados.roomId);
            vozRooms.delete(dados.roomId);
          }
        }

        if (evento === 'join-voice-room') {
          if (!salaIdentificador(dados.roomId)) return seguinte(new Error('Sala inválida.'));
          const chamada = diretaChamadas.get(dados.roomId);
          const diretaAcesso =
            chamada &&
            Date.now() - chamada.created < 600000 &&
            [chamada.caller, chamada.receiver].includes(actor.id);
          if (
            !diretaAcesso &&
            !(await podeAcessoCanal(actor, dados.roomId)) &&
            !(await podeAcessoEspaco(actor, dados.roomId))
          )
            return seguinte(new Error('Sem acesso à sala.'));
        } else if (evento.startsWith('voice-signal-')) {
          const sharesSala = [...vozRooms.values()].some(
            (sala) => sala.has(socket.id) && sala.has(dados.targetSocketId),
          );
          if (!sharesSala) return seguinte(new Error('O destinatário não pertence à sua sala.'));
        } else if (
          (evento.startsWith('voice-') || evento === 'leave-voice-room') &&
          !aderiuVoz(dados.roomId)
        )
          return seguinte(new Error('Entre na sala antes de enviar eventos.'));
        if (evento === 'voice-chat-message') {
          if (
            typeof dados.message?.content !== 'string' ||
            !dados.message.content.trim() ||
            dados.message.content.length > 4000
          )
            return seguinte(new Error('Mensagem inválida.'));
          dados.message = {
            id: dados.message.id,
            sender: actor.name,
            content: dados.message.content.trim(),
            time: new Date().toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        }

        Object.assign(dados, {
          idUtilizador: actor.id,
          username: actor.username,
          user: actor,
          caller: actor,
          callerUser: actor,
          responderUser: actor,
          acceptor: actor,
          rejector: actor,
        });
        seguinte();
      } catch {
        seguinte(new Error('Evento não autorizado.'));
      }
    });
    socket.on('error', () =>
      socket.emit('operation-error', {
        message: 'Operação não autorizada ou temporariamente limitada.',
      }),
    );

    const autenticacaoUtilizador = socket.data.user;
    if (autenticacaoUtilizador?.id) {
      onlineUtilizadores.set(autenticacaoUtilizador.id, {
        idUtilizador: autenticacaoUtilizador.id,
        username: autenticacaoUtilizador.username,
        status: 'online',
        socketId: socket.id,
      });
      socket.join(`user_${autenticacaoUtilizador.id}`);
      difundirPresenca(io);
    }

    socket.on('user-connected', (utilizadorDados) => {
      const effectiveUtilizadorId = socket.data?.user?.id || utilizadorDados?.idUtilizador;
      const effectiveNomeUtilizador = socket.data?.user?.username || utilizadorDados?.username;
      if (effectiveUtilizadorId) {
        onlineUtilizadores.set(effectiveUtilizadorId, {
          idUtilizador: effectiveUtilizadorId,
          username: effectiveNomeUtilizador,
          status: 'online',
          socketId: socket.id,
        });
        socket.join(`user_${effectiveUtilizadorId}`);
        difundirPresenca(io);
      }
    });
    socket.on('join-channel', async (canalId) => {
      if (socket.data?.user && !(await podeAcessoCanal(socket.data.user, canalId))) {
        return;
      }

      socket.join(`channel_${canalId}`);
    });
    socket.on('leave-channel', (canalId) => {
      socket.leave(`channel_${canalId}`);
    });
    socket.on('typing', ({ idCanal: canalId, username: nomeUtilizador }) => {
      socket.to(`channel_${canalId}`).emit('user-typing', {
        idCanal: canalId,
        username: socket.data?.user?.username || nomeUtilizador,
      });
    });
    socket.on('stop-typing', ({ idCanal: canalId, username: nomeUtilizador }) => {
      socket.to(`channel_${canalId}`).emit('user-stop-typing', {
        idCanal: canalId,
        username: socket.data?.user?.username || nomeUtilizador,
      });
    });
    socket.on(
      'join-voice-room',
      ({ roomId: salaId, user: utilizador, isMuted, isDeafened, isCameraOn: isCamaraOn }) => {
        if (!salaId || !utilizador) return;
        for (const [anteriorSalaId, anteriorSala] of vozRooms.entries()) {
          if (anteriorSala.has(socket.id)) {
            const anteriorUtilizador = anteriorSala.get(socket.id);

            anteriorSala.delete(socket.id);
            socket.leave(`voice_${anteriorSalaId}`);
            socket.to(`voice_${anteriorSalaId}`).emit('user-left-voice', {
              idUtilizador: anteriorUtilizador?.user?.id || utilizador.id,
              socketId: socket.id,
            });
            if (anteriorSala.size === 0) {
              vozRooms.delete(anteriorSalaId);
            }
          }
        }

        socket.join(`voice_${salaId}`);
        if (!vozRooms.has(salaId)) {
          vozRooms.set(salaId, new Map());
        }

        const salaMap = vozRooms.get(salaId);
        const existenteParticipants = Array.from(salaMap.values()).map((p) => ({
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
          urlCapa: p.user?.urlCapa,
        }));

        socket.emit('voice-room-existing-users', existenteParticipants);
        salaMap.set(socket.id, {
          socketId: socket.id,
          user: utilizador,
          roomId: salaId,
          isMuted: isMuted !== undefined ? Boolean(isMuted) : false,
          isDeafened: isDeafened !== undefined ? Boolean(isDeafened) : false,
          isCameraOn: isCamaraOn !== undefined ? Boolean(isCamaraOn) : false,
          isScreenSharing: false,
          cameraTrackId: null,
          screenTrackId: null,
          cameraStreamId: null,
          screenStreamId: null,
          urlCapa: utilizador?.urlCapa,
        });
        socket.to(`voice_${salaId}`).emit('user-joined-voice', {
          user: utilizador,
          socketId: socket.id,
          isMuted: isMuted !== undefined ? Boolean(isMuted) : false,
          isDeafened: isDeafened !== undefined ? Boolean(isDeafened) : false,
          isCameraOn: isCamaraOn !== undefined ? Boolean(isCamaraOn) : false,
        });
      },
    );
    socket.on('leave-voice-room', ({ roomId: salaId, idUtilizador: utilizadorId }) => {
      socket.leave(`voice_${salaId}`);

      const sala = vozRooms.get(salaId);
      if (sala) {
        sala.delete(socket.id);
        if (sala.size === 0) vozRooms.delete(salaId);
      }

      socket.to(`voice_${salaId}`).emit('user-left-voice', {
        idUtilizador: utilizadorId,
        socketId: socket.id,
      });
    });
    socket.on(
      'voice-state-update',
      ({
        roomId: salaId,
        idUtilizador: utilizadorId,
        isMuted,
        isDeafened,
        isCameraOn: isCamaraOn,
        isScreenSharing: isEcraSharing,
        cameraTrackId: camaraRegistarId,
        screenTrackId: ecraRegistarId,
        cameraStreamId: camaraStreamId,
        screenStreamId: ecraStreamId,
      }) => {
        const sala = vozRooms.get(salaId);
        if (sala && sala.has(socket.id)) {
          const atual = sala.get(socket.id);
          if (isMuted !== undefined) atual.isMuted = isMuted;
          if (isDeafened !== undefined) atual.isDeafened = isDeafened;
          if (isCamaraOn !== undefined) atual.isCameraOn = isCamaraOn;
          if (isEcraSharing !== undefined) atual.isScreenSharing = isEcraSharing;
          if (camaraRegistarId !== undefined) atual.cameraTrackId = camaraRegistarId;
          if (ecraRegistarId !== undefined) atual.screenTrackId = ecraRegistarId;
          if (camaraStreamId !== undefined) atual.cameraStreamId = camaraStreamId;
          if (ecraStreamId !== undefined) atual.screenStreamId = ecraStreamId;
        }

        socket.to(`voice_${salaId}`).emit('user-voice-state-changed', {
          idUtilizador: utilizadorId,
          socketId: socket.id,
          isMuted,
          isDeafened,
          isCameraOn: isCamaraOn,
          isScreenSharing: isEcraSharing,
          cameraTrackId: camaraRegistarId,
          screenTrackId: ecraRegistarId,
          cameraStreamId: camaraStreamId,
          screenStreamId: ecraStreamId,
        });
      },
    );
    socket.on(
      'voice-speaking-state',
      ({ roomId: salaId, idUtilizador: utilizadorId, isSpeaking }) => {
        socket.to(`voice_${salaId}`).emit('user-voice-speaking-changed', {
          idUtilizador: utilizadorId,
          socketId: socket.id,
          isSpeaking,
        });
      },
    );
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
    socket.on('voice-signal-ice', ({ targetSocketId: destinoSocketId, candidate }) => {
      io.to(destinoSocketId).emit('voice-signal-ice', {
        candidate,
        fromSocketId: socket.id,
      });
    });
    socket.on('voice-chat-message', ({ roomId: salaId, message: mensagem }) => {
      socket.to(`voice_${salaId}`).emit('voice-chat-message', mensagem);
    });
    socket.on('voice-set-room-mode', async ({ roomId: salaId, mode: modo }) => {
      if (socket.data?.user && !(await podeModerateVozSala(socket.data.user, salaId))) return;
      io.to(`voice_${salaId}`).emit('voice-room-mode-changed', {
        roomId: salaId,
        mode: modo,
      });
    });
    socket.on(
      'voice-update-permissions',
      async ({
        roomId: salaId,
        targetUserId: destinoUtilizadorId,
        canSpeak: podeSpeak,
        canShareScreen: podePartilharEcra,
      }) => {
        if (socket.data?.user && !(await podeModerateVozSala(socket.data.user, salaId))) return;
        io.to(`voice_${salaId}`).emit('voice-permissions-updated', {
          targetUserId: destinoUtilizadorId,
          canSpeak: podeSpeak,
          canShareScreen: podePartilharEcra,
        });
      },
    );
    socket.on('voice-speaker-request', ({ roomId: salaId, user: utilizador }) => {
      socket.to(`voice_${salaId}`).emit('voice-speaker-request', {
        user: utilizador,
      });
    });
    socket.on(
      'voice-speaker-decision',
      async ({ roomId: salaId, targetUserId: destinoUtilizadorId, approved: aprovado }) => {
        if (socket.data?.user && !(await podeModerateVozSala(socket.data.user, salaId))) return;
        io.to(`voice_${salaId}`).emit('voice-speaker-decision', {
          targetUserId: destinoUtilizadorId,
          approved: aprovado,
        });
      },
    );
    socket.on('voice-kick-user', async ({ roomId: salaId, targetUserId: destinoUtilizadorId }) => {
      if (socket.data?.user && !(await podeModerateVozSala(socket.data.user, salaId))) return;
      const participants = vozRooms.get(salaId);
      if (participants)
        for (const [destinoSocketId, participant] of participants) {
          if (participant.user.id === destinoUtilizadorId) {
            participants.delete(destinoSocketId);
            io.sockets.sockets.get(destinoSocketId)?.leave('voice_' + salaId);
          }
        }

      io.to(`voice_${salaId}`).emit('voice-user-kicked', {
        targetUserId: destinoUtilizadorId,
      });
    });

    // Chamadas Diretas (DMs)
    socket.on(
      'direct-call-start',
      ({ targetUserId: destinoUtilizadorId, caller: autorChamada, roomId: salaId }) => {
        if (!destinoUtilizadorId || !autorChamada) return;
        io.to(`user_${destinoUtilizadorId}`).emit('direct-call-incoming', {
          caller: autorChamada,
          roomId: salaId,
        });
      },
    );
    socket.on('direct-call-accepted', ({ callerId: autorChamadaId, roomId: salaId, acceptor }) => {
      if (!autorChamadaId) return;
      io.to(`user_${autorChamadaId}`).emit('direct-call-accepted', {
        roomId: salaId,
        acceptor,
      });
    });
    socket.on('direct-call-rejeitado', ({ callerId: autorChamadaId, roomId: salaId, rejector }) => {
      if (!autorChamadaId) return;
      io.to(`user_${autorChamadaId}`).emit('direct-call-rejeitado', {
        roomId: salaId,
        rejector,
      });
    });
    socket.on('direct-call-ended', ({ targetUserId: destinoUtilizadorId, roomId: salaId }) => {
      if (!destinoUtilizadorId) return;
      io.to(`user_${destinoUtilizadorId}`).emit('direct-call-ended', {
        roomId: salaId,
      });
    });
    socket.on('disconnect', () => {
      for (const [salaId, chamada] of diretaChamadas)
        if (Date.now() - chamada.created > 600000) diretaChamadas.delete(salaId);
      for (const [salaId, sala] of vozRooms.entries()) {
        const participant = sala.get(socket.id);
        if (participant) {
          sala.delete(socket.id);
          socket.to(`voice_${salaId}`).emit('user-left-voice', {
            idUtilizador: participant.user?.id,
            socketId: socket.id,
          });
          if (sala.size === 0) vozRooms.delete(salaId);
        }
      }

      for (const [utilizadorId, utilizador] of onlineUtilizadores.entries()) {
        if (utilizador.socketId === socket.id) {
          onlineUtilizadores.delete(utilizadorId);
          break;
        }
      }

      difundirPresenca(io);
    });
  });
}

exports.configurarSocketIO = configurarSocketIO;
