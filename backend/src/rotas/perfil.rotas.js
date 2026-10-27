const rateLimite = require('express-rate-limit');
const { Router } = require('express');
const {
  autenticar: autenticar,
  autenticacaoOpcional: opcionalAutenticacao,
} = require('../intermediarios/autenticacao.js');
const {
  obterPerfilUtilizadorPorIdentificador,
  atualizarPerfilPerfil,
  enviarPerfilPerfilClearCampo,
  enviarPerfilRecuperarPalavraPasse,
  enviarPerfilReporPalavraPasse,
} = require('../controladores/perfil.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const palavraPasseReporLimiter = rateLimite({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiados pedidos de recuperação. Tente novamente mais tarde.',
  },
});
const router = Router();

// GET /autenticacao/user/:identifier — Perfil público de um utilizador
router.get(
  '/user/:identifier',
  opcionalAutenticacao,
  assincronoTratador(obterPerfilUtilizadorPorIdentificador),
);

// PUT /autenticacao/profile — Atualizar perfil do utilizador autenticado
router.put('/perfil', autenticar, assincronoTratador(atualizarPerfilPerfil));

// POST /autenticacao/perfil/clear-field — Remover avatar ou banner
router.post(
  ['/perfil/limpar-campo', '/perfil/clear-field'],
  autenticar,
  assincronoTratador(enviarPerfilPerfilClearCampo),
);

// POST /autenticacao/forgot-password — Enviar ligação segura de recuperação
router.post(
  ['/recuperar-palavra-passe', '/forgot-password'],
  palavraPasseReporLimiter,
  assincronoTratador(enviarPerfilRecuperarPalavraPasse),
);

// POST /autenticacao/reset-password — Validar e consumir o token de utilização única
router.post(
  ['/repor-palavra-passe', '/reset-password'],
  palavraPasseReporLimiter,
  assincronoTratador(enviarPerfilReporPalavraPasse),
);
module.exports = router;
