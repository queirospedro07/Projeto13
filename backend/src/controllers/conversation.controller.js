const { lerJsonCompativel } = require('../utils/fieldCompatibility.js');
const Conversa = require('../models/conversation.js');
const { assincronoMap } = require('../utils/asyncCollections.js');
const { podeAcessoCanal } = require('../middleware/channelAccess.js');
const { podeModerateEspaco } = require('../services/courseAccess.js');
const { randomUUID } = require('node:crypto');
const obterConversaCanaisPorCanalIdMensagens = async (pedido, resposta) => {
  try {
    const { idCanal: canalId } = pedido.params;
    if (!(await podeAcessoCanal(pedido.user, canalId))) {
      return resposta.status(403).json({
        error: 'Não tem acesso a este canal.',
      });
    }

    const mensagens = await Conversa.listarMensagensPorCanalId([canalId]);
    const formatted = await assincronoMap(mensagens, async (m) => {
      let replyTo = null;
      if (m.idPai) {
        const parent = await Conversa.procurarParentPorIdAndCanalId([m.idPai, canalId]);
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
        idCanal: m.idCanal,
        idRemetente: m.idUtilizador,
        content: m.content,
        idPai: m.idPai,
        attachments: (() => {
          try {
            return m.attachments ? lerJsonCompativel(m.attachments) : [];
          } catch (_) {
            return [];
          }
        })(),
        isResolved: Boolean(await Conversa.procurarResolucoesMensagensPorIdMensagem([m.id])),
        estaAfixada: m.estaAfixada === 1,
        criadoEm: m.criadoEm,
        atualizadoEm: m.atualizadoEm,
        sender: {
          id: m.user_id,
          name: m.user_name,
          username: m.user_username,
          urlAvatar: m.user_avatarUrl,
          role: m.user_role,
        },
        reactions: [],
        replyTo,
      };
    });

    return resposta.json(formatted);
  } catch (erro) {
    console.error('Messages error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao obter mensagens',
    });
  }
};

const enviarConversaCanaisPorCanalIdMensagens = async (pedido, resposta) => {
  try {
    const { idCanal: canalId } = pedido.params;
    const { content: conteudo, replyToId, attachments } = pedido.body;
    const utilizadorId = pedido.user.id;
    if (!(await podeAcessoCanal(pedido.user, canalId))) {
      return resposta.status(403).json({
        error: 'Não tem acesso a este canal.',
      });
    }

    const canalInfo = await Conversa.procurarCanalInfoPorId([canalId]);
    if (!canalInfo) {
      return resposta.status(404).json({
        error: 'Canal não encontrado.',
      });
    }

    if (
      canalInfo.estaBloqueado === 1 ||
      canalInfo.modoAcesso === 'announcement' ||
      canalInfo.type === 'announcement'
    ) {
      const isGlobalMod = pedido.user.role === 'ADMIN';
      const isEspacoProprietario = canalInfo.idProprietario === utilizadorId;
      const isCursoFormadorOrCollab = Boolean(
        await Conversa.procurarCursosPorEspacoIdAndFormadorIdAndUtilizadorId([
          canalInfo.idEspaco,
          utilizadorId,
          utilizadorId,
        ]),
      );
      if (!isGlobalMod && !isEspacoProprietario && !isCursoFormadorOrCollab) {
        return resposta.status(403).json({
          error: 'Apenas formadores, colaboradores e administradores podem publicar neste canal.',
        });
      }
    }

    const agora = new Date().toISOString();
    if (typeof conteudo !== 'string' || !conteudo.trim() || conteudo.length > 4000) {
      return resposta.status(400).json({
        error: 'O conteúdo da mensagem não pode estar vazio',
      });
    }

    if (
      replyToId != null &&
      (typeof replyToId !== 'string' ||
        !(await Conversa.procurarMensagensPorIdAndCanalId([replyToId, canalId])))
    ) {
      return resposta.status(400).json({
        error: 'A resposta deve referir uma mensagem deste canal.',
      });
    }

    // File uploads need a dedicated storage service; never accept arbitrary inline files.
    if (attachments != null && (!Array.isArray(attachments) || attachments.length > 0)) {
      return resposta.status(400).json({
        error: 'Os anexos ainda não estão disponíveis. Partilhe uma ligação na mensagem.',
      });
    }

    const mensagemId = randomUUID();
    const attachStr = attachments ? JSON.stringify(attachments) : null;

    await Conversa.inserirMensagens([
      mensagemId,
      canalId,
      utilizadorId,
      conteudo.trim(),
      replyToId || null,
      attachStr,
      agora,
      agora,
    ]);

    const utilizador = await Conversa.procurarUtilizadorPorId([utilizadorId]);
    const novoMsgObj = {
      id: mensagemId,
      idCanal: canalId,
      idRemetente: utilizadorId,
      content: conteudo.trim(),
      idPai: replyToId || null,
      attachments: attachments || [],
      estaAfixada: false,
      criadoEm: agora,
      atualizadoEm: agora,
      sender: utilizador,
      reactions: [],
    };
    const io = pedido.app.get('io');
    if (io) {
      io.to(`channel_${canalId}`).emit('new-message', novoMsgObj);
    }

    return resposta.status(201).json(novoMsgObj);
  } catch (erro) {
    console.error('Post message error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao enviar mensagem',
    });
  }
};

const enviarConversaMensagensPorMensagemIdAfixar = async (pedido, resposta) => {
  try {
    const { messageId: mensagemId } = pedido.params;
    const mensagem = await Conversa.procurarMensagemPorId([mensagemId]);
    if (!mensagem) {
      return resposta.status(404).json({
        error: 'Mensagem não encontrada.',
      });
    }

    if (!(await podeAcessoCanal(pedido.user, mensagem.idCanal))) {
      return resposta.status(403).json({
        error: 'Não tem acesso a este canal.',
      });
    }

    const canal = await Conversa.procurarCanalPorId([mensagem.idCanal]);
    if (!(await podeModerateEspaco(pedido.user, canal?.idEspaco))) {
      return resposta.status(403).json({
        error: 'Só a equipa de moderação pode fixar mensagens.',
      });
    }

    const novoAfixado = mensagem.estaAfixada === 1 ? 0 : 1;

    await Conversa.atualizarMensagensPorIsAfixadoAndId([novoAfixado, mensagemId]);

    return resposta.json({
      success: true,
      messageId: mensagemId,
      estaAfixada: novoAfixado === 1,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao fixar/desafixar mensagem.',
    });
  }
};

const enviarConversaMensagensPorMensagemIdResolver = async (pedido, resposta) => {
  const mensagem =
    await Conversa.procurarMensagemPorIdParaEnviarConversaMensagensPorMensagemIdResolver([
      pedido.params.messageId,
    ]);
  if (!mensagem)
    return resposta.status(404).json({
      error: 'Mensagem não encontrada.',
    });
  if (!(await podeModerateEspaco(pedido.user, mensagem.idEspaco)))
    return resposta.status(403).json({
      error: 'Só a equipa do curso pode resolver dúvidas.',
    });
  const existente = await Conversa.procurarResolucoesMensagensPorIdMensagem([mensagem.id]);
  if (existente) await Conversa.eliminarResolucoesMensagensPorIdMensagem([mensagem.id]);
  else
    await Conversa.inserirResolucoesMensagens([
      mensagem.id,
      pedido.user.id,
      new Date().toISOString(),
    ]);

  return resposta.json({
    isResolved: !existente,
  });
};

exports.obterConversaCanaisPorCanalIdMensagens = obterConversaCanaisPorCanalIdMensagens;
exports.enviarConversaCanaisPorCanalIdMensagens = enviarConversaCanaisPorCanalIdMensagens;
exports.enviarConversaMensagensPorMensagemIdAfixar = enviarConversaMensagensPorMensagemIdAfixar;
exports.enviarConversaMensagensPorMensagemIdResolver = enviarConversaMensagensPorMensagemIdResolver;
