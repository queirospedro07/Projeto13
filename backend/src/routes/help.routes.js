const { Router } = require('express');
const { getHelpFaq } = require('../controllers/help.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();

router.get('/faq', asyncHandler(getHelpFaq));
module.exports = router;
