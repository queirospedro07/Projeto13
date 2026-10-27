const Certificado = require('../modelos/Certificado.js');
const { emitirCertificado } = require('../servicos/progresso.js');
const obterCertificadoVerificarPorCertificadoId = async (pedido, resposta) => {
  try {
    const { certificateId: certificadoId } = pedido.params;
    const certificado = await Certificado.procurarCertificadoPorIdAndCredencialId([
      certificadoId,
      certificadoId,
    ]);
    if (!certificado) {
      return resposta.status(404).json({
        error: 'Certificado não encontrado ou identificador inválido',
      });
    }

    return resposta.json({
      id: certificado.id,
      nomeDestinatario: certificado.nomeDestinatario,
      tituloCurso: certificado.tituloCurso,
      idCredencial: certificado.idCredencial,
      emitidoEm: certificado.emitidoEm,
      score: certificado.score,
      user: {
        id: certificado.user_id,
        name: certificado.user_name,
        username: certificado.user_username,
        urlAvatar: certificado.user_avatarUrl,
      },
      course: {
        id: certificado.course_id,
        title: certificado.course_title,
        slug: certificado.course_slug,
        duracaoHoras: certificado.course_durationHours,
      },
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao verificar credencial de certificado',
    });
  }
};

const obterCertificadoMeus = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const certificados = await Certificado.listarCertificadosPorUtilizadorId([utilizadorId]);

    return resposta.json(
      certificados.map((c) => ({
        ...c,
        course: {
          title: c.course_title,
          urlMiniatura: c.urlMiniatura,
        },
      })),
    );
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao carregar certificados',
    });
  }
};

const enviarCertificadoGerarPorCursoId = async (pedido, resposta) => {
  try {
    return resposta.json({
      message: 'Certificado disponível.',
      certificate: await emitirCertificado(pedido.user.id, pedido.params.idCurso),
    });
  } catch (erro) {
    return resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Não foi possível emitir o certificado.',
    });
  }
};

exports.obterCertificadoVerificarPorCertificadoId = obterCertificadoVerificarPorCertificadoId;
exports.obterCertificadoMeus = obterCertificadoMeus;
exports.enviarCertificadoGerarPorCursoId = enviarCertificadoGerarPorCursoId;
