const { Router } = require('express');
const { authenticate } = require('../middleware/auth.js');
const {
  getPayment,
  postPaymentSimulateByCourseId,
} = require('../controllers/payment.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(getPayment));
router.post('/simulate/:courseId', asyncHandler(postPaymentSimulateByCourseId));
module.exports = router;
