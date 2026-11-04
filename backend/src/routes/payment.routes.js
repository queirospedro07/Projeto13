const { Router } = require('express');
const { autenticar: autenticar } = require('../middleware/authentication.js');
const {
  obterPagamento,
  enviarPagamentoSimularPorCursoId,
} = require('../controllers/payment.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
const router = Router();

router.use(autenticar);
router.get('/', assincronoTratador(obterPagamento));
router.post(
  ['/simular/:idCurso', '/simulate/:idCurso'],
  assincronoTratador(enviarPagamentoSimularPorCursoId),
);
module.exports = router;
