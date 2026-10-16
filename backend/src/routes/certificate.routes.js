const { Router } = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.js');
const {
  getCertificateVerifyByCertificateId,
  getCertificateMy,
  postCertificateGenerateByCourseId,
} = require('../controllers/certificate.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();
router.get(
  '/verify/:certificateId',
  optionalAuth,
  asyncHandler(getCertificateVerifyByCertificateId),
);
router.get('/my', authenticate, asyncHandler(getCertificateMy));

// Gerar certificado manualmente para um curso já concluído
router.post('/generate/:courseId', authenticate, asyncHandler(postCertificateGenerateByCourseId));
module.exports = router;
