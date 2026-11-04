const { Router } = require('express');
const {
  autenticar: autenticar,
  autenticacaoOpcional: opcionalAutenticacao,
} = require('../middleware/authentication.js');
const {
  obterPerfilUtilizadorPorIdentificador,
  atualizarPerfilPerfil,
  enviarPerfilPerfilClearCampo,
} = require('../controllers/profile.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
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

module.exports = router;
