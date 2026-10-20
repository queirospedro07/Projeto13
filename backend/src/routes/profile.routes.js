const rateLimit = require('express-rate-limit');
const { Router } = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.js');
const {
  getProfileUserByIdentifier,
  putProfileProfile,
  postProfileProfileClearField,
  postProfileForgotPassword,
  postProfileResetPassword,
} = require('../controllers/profile.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiados pedidos de recuperação. Tente novamente mais tarde.',
  },
});
const router = Router();

// GET /auth/user/:identifier — Perfil público de um utilizador
router.get('/user/:identifier', optionalAuth, asyncHandler(getProfileUserByIdentifier));

// PUT /auth/profile — Atualizar perfil do utilizador autenticado
router.put('/profile', authenticate, asyncHandler(putProfileProfile));

// POST /auth/profile/clear-field — Remover avatar ou banner
router.post('/profile/clear-field', authenticate, asyncHandler(postProfileProfileClearField));

// POST /auth/forgot-password — Enviar ligação segura de recuperação
router.post('/forgot-password', passwordResetLimiter, asyncHandler(postProfileForgotPassword));

// POST /auth/reset-password — Validar e consumir o token de utilização única
router.post('/reset-password', passwordResetLimiter, asyncHandler(postProfileResetPassword));
module.exports = router;
