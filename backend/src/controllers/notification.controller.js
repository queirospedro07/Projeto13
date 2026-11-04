const Notificacao = require('../models/notification.js');
const obterNotificacao = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const notificacoes = await Notificacao.listarNotificacoesPorUtilizadorId([utilizadorId]);

    return resposta.json(
      notificacoes.map((n) => ({
        ...n,
        estaLida: n.estaLida === 1,
      })),
    );
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao obter notificações',
    });
  }
};

const atualizarNotificacaoLerTodos = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;

    await Notificacao.atualizarNotificacoesPorUtilizadorId([utilizadorId]);

    return resposta.json({
      success: true,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao atualizar notificações',
    });
  }
};

const atualizarNotificacaoPorIdLer = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    const utilizadorId = pedido.user.id;

    await Notificacao.atualizarNotificacoesPorIdAndUtilizadorId([id, utilizadorId]);

    return resposta.json({
      success: true,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao marcar notificação como lida',
    });
  }
};

exports.obterNotificacao = obterNotificacao;
exports.atualizarNotificacaoLerTodos = atualizarNotificacaoLerTodos;
exports.atualizarNotificacaoPorIdLer = atualizarNotificacaoPorIdLer;
