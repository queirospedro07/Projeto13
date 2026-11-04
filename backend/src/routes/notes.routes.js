const { Router } = require('express');
const { autenticar: autenticar } = require('../middleware/authentication.js');
const {
  obterNotasPorAulaId,
  enviarNotasPorAulaId,
  obterNotas,
} = require('../controllers/notes.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
const router = Router();

router.get('/:idAula', autenticar, assincronoTratador(obterNotasPorAulaId));
router.post('/:idAula', autenticar, assincronoTratador(enviarNotasPorAulaId));
router.get('/', autenticar, assincronoTratador(obterNotas));
module.exports = router;
