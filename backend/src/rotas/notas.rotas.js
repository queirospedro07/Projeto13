const { Router } = require('express');
const { autenticar: autenticar } = require('../intermediarios/autenticacao.js');
const {
  obterNotasPorAulaId,
  enviarNotasPorAulaId,
  obterNotas,
} = require('../controladores/notas.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.get('/:idAula', autenticar, assincronoTratador(obterNotasPorAulaId));
router.post('/:idAula', autenticar, assincronoTratador(enviarNotasPorAulaId));
router.get('/', autenticar, assincronoTratador(obterNotas));
module.exports = router;
