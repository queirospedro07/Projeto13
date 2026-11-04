const { Router } = require('express');
const {
  autenticar: autenticar,
  exigirCargo: exigirCargo,
} = require('../middleware/authentication.js');
const {
  obterAdministracaoEstatisticas,
  obterAdministracaoUtilizadores,
  atualizarAdministracaoUtilizadorCargo,
  atualizarAdministracaoUtilizadoresPorIdSuspender,
  obterAdministracaoFormadorCandidaturas,
  atualizarAdministracaoFormadorCandidaturasPorIdAprovar,
  atualizarAdministracaoFormadorCandidaturasPorIdRejeitar,
  obterAdministracaoCursos,
  atualizarAdministracaoCursosPorIdAprovar,
  atualizarAdministracaoCursosPorIdRejeitar,
} = require('../controllers/administration.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
const router = Router();

// ==============================================================
// ROTAS DE GESTÃO EXCLUSIVAS DE ADMINISTRADORES
// ==============================================================
// ROTAS DE GESTÃO EXCLUSIVAS DE ADMINISTRADORES

router.use(autenticar, exigirCargo('ADMIN'));
router.get(['/estatisticas', '/stats'], assincronoTratador(obterAdministracaoEstatisticas));
router.get(['/utilizadores', '/users'], assincronoTratador(obterAdministracaoUtilizadores));
router.put(
  ['/utilizadores/:id/cargo', '/users/:id/role'],
  assincronoTratador(atualizarAdministracaoUtilizadorCargo),
);
router.put(
  ['/utilizadores/:id/suspender', '/users/:id/suspend'],
  assincronoTratador(atualizarAdministracaoUtilizadoresPorIdSuspender),
);

// Candidaturas a Criador
router.get('/creator-applications', assincronoTratador(obterAdministracaoFormadorCandidaturas));
router.put(
  '/creator-applications/:id/aprovar',
  assincronoTratador(atualizarAdministracaoFormadorCandidaturasPorIdAprovar),
);
router.put(
  ['/creator-applications/:id/rejeitar', '/creator-applications/:id/reject'],
  assincronoTratador(atualizarAdministracaoFormadorCandidaturasPorIdRejeitar),
);

// Moderação de Cursos
router.get(['/cursos', '/courses'], assincronoTratador(obterAdministracaoCursos));
router.put(
  ['/cursos/:id/aprovar', '/courses/:id/aprovar'],
  assincronoTratador(atualizarAdministracaoCursosPorIdAprovar),
);
router.put(
  ['/cursos/:id/rejeitar', '/courses/:id/reject'],
  assincronoTratador(atualizarAdministracaoCursosPorIdRejeitar),
);
module.exports = router;
