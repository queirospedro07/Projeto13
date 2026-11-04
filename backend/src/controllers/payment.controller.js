const { simularPagamento, obterPagamentoHistorico } = require('../services/payments.js');
const obterPagamento = async (pedido, resposta) =>
  resposta.json(await obterPagamentoHistorico(pedido.user.id));
const enviarPagamentoSimularPorCursoId = async (pedido, resposta, seguinte) => {
  try {
    resposta.json(await simularPagamento(pedido.user, pedido.params.idCurso, pedido.body));
  } catch (erro) {
    if (erro.status)
      return resposta.status(erro.status).json({
        error: erro.message,
      });
    seguinte(erro);
  }
};

exports.obterPagamento = obterPagamento;
exports.enviarPagamentoSimularPorCursoId = enviarPagamentoSimularPorCursoId;
