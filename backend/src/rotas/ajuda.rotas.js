const { Router } = require('express');
const { obterAjudaPerguntasFrequentes } = require('../controladores/ajuda.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.get('/faq', assincronoTratador(obterAjudaPerguntasFrequentes));
module.exports = router;
