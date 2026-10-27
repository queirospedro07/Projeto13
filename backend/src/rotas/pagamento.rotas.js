const { Router } = require('express');
const { autenticar: autenticar } = require('../intermediarios/autenticacao.js');
const {
  obterPagamento,
  enviarPagamentoSimularPorCursoId,
} = require('../controladores/pagamento.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.use(autenticar);
router.get('/', assincronoTratador(obterPagamento));
router.post(
  ['/simular/:idCurso', '/simulate/:idCurso'],
  assincronoTratador(enviarPagamentoSimularPorCursoId),
);
module.exports = router;
