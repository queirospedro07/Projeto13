const { Router } = require('express');
const {
  autenticar: autenticar,
  autenticacaoOpcional: opcionalAutenticacao,
} = require('../intermediarios/autenticacao.js');
const {
  obterCertificadoVerificarPorCertificadoId,
  obterCertificadoMeus,
  enviarCertificadoGerarPorCursoId,
} = require('../controladores/certificado.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.get(
  ['/verificar/:certificateId', '/verify/:certificateId'],
  opcionalAutenticacao,
  assincronoTratador(obterCertificadoVerificarPorCertificadoId),
);
router.get(['/meus', '/my'], autenticar, assincronoTratador(obterCertificadoMeus));

// Gerar certificado manualmente para um curso já concluído
router.post(
  ['/gerar/:idCurso', '/generate/:idCurso'],
  autenticar,
  assincronoTratador(enviarCertificadoGerarPorCursoId),
);
module.exports = router;
