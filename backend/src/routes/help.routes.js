const { Router } = require('express');
const { obterAjudaPerguntasFrequentes } = require('../controllers/help.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
const router = Router();

router.get('/faq', assincronoTratador(obterAjudaPerguntasFrequentes));
module.exports = router;
