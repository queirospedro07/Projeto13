const { asyncHandler } = require('../middleware/asyncHandler.js');
const { createReport } = require('../controllers/report.controller.js');
const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth.js');
const router = Router();
router.post(
  '/',
  authenticate,
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  asyncHandler(createReport),
);
module.exports = router;
