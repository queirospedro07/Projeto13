const Social = require('../models/social.js');
const { assincronoMap } = require('../utils/asyncCollections.js');
const { transacao } = require('../database/connection.js');
const obterSocialAmigos = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const aceiteAmizades = await Social.listarAceiteAmizadesPorRequesterIdAndAddresseeId([
      utilizadorId,
      utilizadorId,
      utilizadorId,
    ]);
    const amigos = (
      await assincronoMap(aceiteAmizades, async (f) => {
        const u = await Social.procurarUPorId([f.friendId]);

        return {
          friendshipId: f.friendshipId,
          friendsSince: f.friendsSince,
          user: u,
        };
      })
    ).filter((f) => f.user);
    const recebida = await Social.listarRecebidaPorAddresseeId([utilizadorId]);
    const enviada = await Social.listarEnviadaPorRequesterId([utilizadorId]);

    return resposta.json({
      friends: amigos,
      incoming: recebida.map((r) => ({
        friendshipId: r.friendshipId,
        criadoEm: r.criadoEm,
        user: {
          id: r.user_id,
          name: r.name,
          username: r.username,
          urlAvatar: r.urlAvatar,
          role: r.role,
        },
      })),
      outgoing: enviada.map((r) => ({
        friendshipId: r.friendshipId,
        criadoEm: r.criadoEm,
        user: {
          id: r.user_id,
          name: r.name,
          username: r.username,
          urlAvatar: r.urlAvatar,
          role: r.role,
        },
      })),
    });
  } catch (erro) {
    console.error('Friends fetch error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao obter lista de amigos',
    });
  }
};

const enviarSocialAmigosRequestPorDestinoUtilizadorId = async (pedido, resposta) => {
  try {
    const idSolicitante = pedido.user.id;
    const { targetUserId: destinoUtilizadorId } = pedido.params;
    const agora = new Date().toISOString();
    if (idSolicitante === destinoUtilizadorId) {
      return resposta.status(400).json({
        error: 'Não pode enviar pedido de amizade para si próprio',
      });
    }

    const destinoUtilizador = await Social.procurarDestinoUtilizadorPorId([destinoUtilizadorId]);
    if (!destinoUtilizador) {
      return resposta.status(404).json({
        error: 'Utilizador não encontrado',
      });
    }

    const existente = await Social.procurarExistentePorRequesterIdAndAddresseeId([
      idSolicitante,
      destinoUtilizadorId,
      destinoUtilizadorId,
      idSolicitante,
    ]);
    if (existente) {
      if (existente.status === 'ACCEPTED') {
        return resposta.json({
          message: 'Já são amigos!',
          status: 'ACCEPTED',
        });
      }

      if (existente.status === 'PENDING') {
        if (existente.idSolicitante === destinoUtilizadorId) {
          await Social.atualizarAmizadesPorAtualizadoAtAndId([agora, existente.id]);

          return resposta.json({
            message: 'Pedido de amizade aceite com sucesso!',
            status: 'ACCEPTED',
          });
        }

        return resposta.json({
          message: 'Pedido de amizade já se encontra pendente',
          status: 'PENDING',
        });
      }
    }

    const amizadeId = `fr-${Date.now()}`;

    await transacao(async () => {
      await Social.inserirAmizades([amizadeId, idSolicitante, destinoUtilizadorId, agora, agora]);
      await Social.inserirNotificacoes([
        `notif-${Date.now()}`,
        destinoUtilizadorId,
        'Novo Pedido de Amizade',
        `${pedido.user.username} enviou-lhe um pedido de amizade.`,
        agora,
      ]);
    });

    return resposta.status(201).json({
      message: 'Pedido de amizade enviado com sucesso!',
      friendshipId: amizadeId,
      status: 'PENDING',
    });
  } catch (erro) {
    console.error('Friend request error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao enviar pedido de amizade',
    });
  }
};

const enviarSocialAmigosAceitarPorAmizadeId = async (pedido, resposta) => {
  try {
    const { friendshipId: amizadeId } = pedido.params;
    const utilizadorId = pedido.user.id;
    const agora = new Date().toISOString();
    const amizade = await Social.procurarAmizadePorId([amizadeId]);
    if (!amizade) {
      return resposta.status(404).json({
        error: 'Pedido de amizade não encontrado',
      });
    }

    if (amizade.idDestinatario !== utilizadorId) {
      return resposta.status(403).json({
        error: 'Não tem permissão para responder a este pedido',
      });
    }

    await Social.atualizarAmizadesPorAtualizadoAtAndId([agora, amizadeId]);

    const outroUtilizadorId =
      amizade.idSolicitante === utilizadorId ? amizade.idDestinatario : amizade.idSolicitante;

    await Social.inserirNotificacoes([
      `notif-${Date.now()}`,
      outroUtilizadorId,
      'Pedido de Amizade Aceite!',
      `${pedido.user.username} aceitou o seu pedido de amizade. Agora podem trocar mensagens diretas.`,
      agora,
    ]);

    return resposta.json({
      message: 'Amizade aceite com sucesso!',
      status: 'ACCEPTED',
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao aceitar amizade',
    });
  }
};

const enviarSocialAmigosRejeitarPorAmizadeId = async (pedido, resposta) => {
  try {
    const { friendshipId: amizadeId } = pedido.params;
    const utilizadorId = pedido.user.id;
    const amizade = await Social.procurarAmizadePorId([amizadeId]);
    if (!amizade) {
      return resposta.status(404).json({
        error: 'Pedido não encontrado',
      });
    }

    if (amizade.idDestinatario !== utilizadorId && amizade.idSolicitante !== utilizadorId) {
      return resposta.status(403).json({
        error: 'Sem permissão',
      });
    }

    await Social.eliminarAmizadesPorId([amizadeId]);

    return resposta.json({
      message: 'Pedido removido com sucesso.',
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao rejeitar pedido',
    });
  }
};

const eliminarSocialAmigosRemoverPorDestinoUtilizadorId = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const { targetUserId: destinoUtilizadorId } = pedido.params;

    await Social.eliminarAmizadesPorRequesterIdAndAddresseeId([
      utilizadorId,
      destinoUtilizadorId,
      destinoUtilizadorId,
      utilizadorId,
    ]);

    return resposta.json({
      message: 'Amigo removido com sucesso.',
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao remover amigo',
    });
  }
};

const enviarSocialFollowPorDestinoUtilizadorId = async (pedido, resposta) => {
  try {
    const seguidorId = pedido.user.id;
    const { targetUserId: destinoUtilizadorId } = pedido.params;
    const agora = new Date().toISOString();
    if (seguidorId === destinoUtilizadorId) {
      return resposta.status(400).json({
        error: 'Não pode seguir o seu próprio perfil',
      });
    }

    const destinoUtilizador =
      await Social.procurarDestinoUtilizadorPorIdParaEnviarSocialFollowPorDestinoUtilizadorId([
        destinoUtilizadorId,
      ]);
    if (!destinoUtilizador) {
      return resposta.status(404).json({
        error: 'Utilizador não encontrado',
      });
    }

    const existente = await Social.procurarExistentePorSeguidorIdAndSeguidosId([
      seguidorId,
      destinoUtilizadorId,
    ]);
    if (existente) {
      return resposta.json({
        message: 'Já está a seguir este utilizador',
        isFollowing: true,
      });
    }

    const followId = `fol-${Date.now()}`;

    await transacao(async () => {
      await Social.inserirSeguidores([followId, seguidorId, destinoUtilizadorId, agora]);
      await Social.inserirNotificacoesParaLookup([
        `notif-${Date.now()}`,
        destinoUtilizadorId,
        'Novo Seguidor',
        `${pedido.user.username} começou a seguir o seu perfil.`,
        `/perfil/${pedido.user.username}`,
        agora,
      ]);
    });

    return resposta.status(201).json({
      message: 'A seguir utilizador!',
      isFollowing: true,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao seguir utilizador',
    });
  }
};

const enviarSocialUnfollowPorDestinoUtilizadorId = async (pedido, resposta) => {
  try {
    const seguidorId = pedido.user.id;
    const { targetUserId: destinoUtilizadorId } = pedido.params;

    await Social.eliminarSeguidoresPorSeguidorIdAndSeguidosId([seguidorId, destinoUtilizadorId]);

    return resposta.json({
      message: 'Deixou de seguir o utilizador.',
      isFollowing: false,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao deixar de seguir',
    });
  }
};

const obterSocialSeguidoresPorUtilizadorId = async (pedido, resposta) => {
  try {
    const { idUtilizador: utilizadorId } = pedido.params;
    const seguidores = await Social.listarSeguidoresPorSeguidosId([utilizadorId]);

    return resposta.json({
      followers: seguidores,
      count: seguidores.length,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao obter seguidores',
    });
  }
};

const obterSocialSeguidosPorUtilizadorId = async (pedido, resposta) => {
  try {
    const { idUtilizador: utilizadorId } = pedido.params;
    const seguidos = await Social.listarSeguidosPorSeguidorId([utilizadorId]);

    return resposta.json({
      following: seguidos,
      count: seguidos.length,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao obter lista de a seguir',
    });
  }
};

const obterSocialEstadoPorDestinoUtilizadorId = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const { targetUserId: destinoUtilizadorId } = pedido.params;
    const follow = await Social.procurarExistentePorSeguidorIdAndSeguidosId([
      utilizadorId,
      destinoUtilizadorId,
    ]);
    const amizade = await Social.procurarExistentePorRequesterIdAndAddresseeId([
      utilizadorId,
      destinoUtilizadorId,
      destinoUtilizadorId,
      utilizadorId,
    ]);
    const seguidoresContar =
      ((await Social.contarSeguidoresPorSeguidosId([destinoUtilizadorId])) || {}).c || 0;
    const seguidosContar =
      ((await Social.contarSeguidoresPorSeguidorId([destinoUtilizadorId])) || {}).c || 0;
    const amigosContar =
      (
        (await Social.contarAmizadesPorRequesterIdAndAddresseeId([
          destinoUtilizadorId,
          destinoUtilizadorId,
        ])) || {}
      ).c || 0;

    return resposta.json({
      isFollowing: !!follow,
      friendshipStatus: amizade ? amizade.status : 'NONE',
      isRequester: amizade ? amizade.idSolicitante === utilizadorId : false,
      friendshipId: amizade ? amizade.id : null,
      followersCount: seguidoresContar,
      followingCount: seguidosContar,
      friendsCount: amigosContar,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao verificar estado social',
    });
  }
};

const obterSocialUtilizadoresPesquisar = async (pedido, resposta) => {
  try {
    const { query: consultar } = pedido.query;
    const utilizadorId = pedido.user?.id || null;
    if (!consultar || String(consultar).trim().length < 1) {
      const utilizadores2 = utilizadorId
        ? await Social.listarUtilizadores([utilizadorId])
        : await Social.listarUtilizadoresParaObterSocialUtilizadoresPesquisar();

      return resposta.json(utilizadores2);
    }

    const pesquisarTerm = `%${String(consultar).trim()}%`;
    const utilizadores = utilizadorId
      ? await Social.listarUtilizadoresPorNomeAndNomeUtilizador([
          utilizadorId,
          pesquisarTerm,
          pesquisarTerm,
        ])
      : await Social.listarUtilizadoresPorNomeAndNomeUtilizadorParaObterSocialUtilizadoresPesquisar(
          [pesquisarTerm, pesquisarTerm],
        );

    return resposta.json(utilizadores);
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao pesquisar utilizadores',
    });
  }
};

const obterSocialMensagemDiretaConversas = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const participantes = await Social.listarParticipantesPorRemetenteIdAndDestinatarioId([
      utilizadorId,
      utilizadorId,
      utilizadorId,
    ]);
    const conversas = (
      await assincronoMap(participantes, async (p) => {
        const participante = await Social.procurarUPorId([p.peerId]);
        const ultimaMensagem = await Social.procurarUltimaMensagemPorRemetenteIdAndDestinatarioId([
          utilizadorId,
          p.peerId,
          p.peerId,
          utilizadorId,
        ]);
        const naoLidasContar =
          (
            (await Social.contarDiretaMensagensPorRemetenteIdAndDestinatarioId([
              p.peerId,
              utilizadorId,
            ])) || {}
          ).c || 0;

        return {
          peer: participante,
          lastMessage: ultimaMensagem,
          unreadCount: naoLidasContar,
        };
      })
    ).filter((c) => c.peer);

    conversas.sort((a, b) => {
      const tA = new Date(a.lastMessage?.criadoEm || 0).getTime();
      const tB = new Date(b.lastMessage?.criadoEm || 0).getTime();

      return tB - tA;
    });

    return resposta.json(conversas);
  } catch (erro) {
    console.error('DM conversations error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao obter conversas',
    });
  }
};

const obterSocialMensagemDiretaMensagensPorDestinoUtilizadorId = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const { targetUserId: destinoUtilizadorId } = pedido.params;

    await Social.atualizarDiretaMensagensPorRemetenteIdAndDestinatarioId([
      destinoUtilizadorId,
      utilizadorId,
    ]);

    const mensagens = await Social.listarMensagensPorRemetenteIdAndDestinatarioId([
      utilizadorId,
      destinoUtilizadorId,
      destinoUtilizadorId,
      utilizadorId,
    ]);
    const participante = await Social.procurarUPorId([destinoUtilizadorId]);
    const formatted = mensagens.map((m) => ({
      id: m.id,
      idRemetente: m.idRemetente,
      idDestinatarioMensagem: m.idDestinatarioMensagem,
      content: m.content,
      estaLida: m.estaLida === 1,
      criadoEm: m.criadoEm,
      sender: {
        id: m.user_id,
        name: m.user_name,
        username: m.user_username,
        urlAvatar: m.user_avatarUrl,
        role: m.user_role,
      },
    }));

    return resposta.json({
      peer: participante,
      messages: formatted,
    });
  } catch (erro) {
    console.error('DM history error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao obter histórico de mensagens',
    });
  }
};

const enviarSocialMensagemDiretaEnviar = async (pedido, resposta) => {
  try {
    const remetenteId = pedido.user.id;
    const { idDestinatarioMensagem: destinatarioId, content: conteudo } = pedido.body;
    const agora = new Date().toISOString();
    if (
      typeof destinatarioId !== 'string' ||
      destinatarioId.length > 180 ||
      typeof conteudo !== 'string' ||
      !conteudo.trim() ||
      conteudo.length > 4000
    ) {
      return resposta.status(400).json({
        error: 'Destinatário e conteúdo são obrigatórios',
      });
    }

    if (remetenteId === destinatarioId) {
      return resposta.status(400).json({
        error: 'Não pode enviar mensagens diretas para si próprio',
      });
    }

    const destinatario =
      await Social.procurarDestinoUtilizadorPorIdParaEnviarSocialFollowPorDestinoUtilizadorId([
        destinatarioId,
      ]);
    if (!destinatario) {
      return resposta.status(404).json({
        error: 'Destinatário não encontrado',
      });
    }

    const mensagemDiretaId = `dm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    await Social.inserirDiretaMensagens([
      mensagemDiretaId,
      remetenteId,
      destinatarioId,
      conteudo.trim(),
      agora,
    ]);

    const remetente = await Social.procurarRemetentePorId([remetenteId]);
    const mensagemDiretaResponse = {
      id: mensagemDiretaId,
      idRemetente: remetenteId,
      idDestinatarioMensagem: destinatarioId,
      content: conteudo.trim(),
      estaLida: false,
      criadoEm: agora,
      sender: remetente,
    };
    const io = pedido.app.get('io');
    if (io) {
      io.to(`user_${destinatarioId}`).emit('direct-message', mensagemDiretaResponse);
      io.to(`user_${remetenteId}`).emit('direct-message', mensagemDiretaResponse);
    }

    return resposta.status(201).json(mensagemDiretaResponse);
  } catch (erro) {
    console.error('Send DM error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao enviar mensagem direta',
    });
  }
};

exports.obterSocialAmigos = obterSocialAmigos;
exports.enviarSocialAmigosRequestPorDestinoUtilizadorId =
  enviarSocialAmigosRequestPorDestinoUtilizadorId;
exports.enviarSocialAmigosAceitarPorAmizadeId = enviarSocialAmigosAceitarPorAmizadeId;
exports.enviarSocialAmigosRejeitarPorAmizadeId = enviarSocialAmigosRejeitarPorAmizadeId;
exports.eliminarSocialAmigosRemoverPorDestinoUtilizadorId =
  eliminarSocialAmigosRemoverPorDestinoUtilizadorId;
exports.enviarSocialFollowPorDestinoUtilizadorId = enviarSocialFollowPorDestinoUtilizadorId;
exports.enviarSocialUnfollowPorDestinoUtilizadorId = enviarSocialUnfollowPorDestinoUtilizadorId;
exports.obterSocialSeguidoresPorUtilizadorId = obterSocialSeguidoresPorUtilizadorId;
exports.obterSocialSeguidosPorUtilizadorId = obterSocialSeguidosPorUtilizadorId;
exports.obterSocialEstadoPorDestinoUtilizadorId = obterSocialEstadoPorDestinoUtilizadorId;
exports.obterSocialUtilizadoresPesquisar = obterSocialUtilizadoresPesquisar;
exports.obterSocialMensagemDiretaConversas = obterSocialMensagemDiretaConversas;
exports.obterSocialMensagemDiretaMensagensPorDestinoUtilizadorId =
  obterSocialMensagemDiretaMensagensPorDestinoUtilizadorId;
exports.enviarSocialMensagemDiretaEnviar = enviarSocialMensagemDiretaEnviar;
