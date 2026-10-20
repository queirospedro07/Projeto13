const { asyncHandler } = require('../middleware/asyncHandler.js');
const { isSafeImage } = require('../validation/content.js');
const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getMe, demoLogin } = require('../controllers/auth.controller.js');
const { protect } = require('../middleware/auth.js');
const profileRoutes = require('./profile.routes.js');
const router = Router();

// Validation chains (express-validator)
const registerValidation = [
  body('acceptedTerms')
    .custom((value) => value === true)
    .withMessage('É necessário aceitar os termos para criar a conta.'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({
      min: 2,
      max: 80,
    })
    .withMessage('Nome deve ter entre 2 e 80 caracteres'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Nome de utilizador é obrigatório')
    .matches(/^[a-zA-Z0-9_]{3,30}$/)
    .withMessage('Nome de utilizador deve ter 3–30 caracteres (letras, números ou _)'),
  body('email').isEmail().withMessage('Endereço de email inválido').normalizeEmail(),
  body('password')
    .isString()
    .bail()
    .isLength({
      min: 12,
    })
    .withMessage('A palavra-passe deve ter pelo menos 12 caracteres')
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('A palavra-passe não pode exceder 72 bytes'),
  body('avatarUrl')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .custom((val) => {
      if (!isSafeImage(val)) throw new Error('Escolha uma imagem JPG, PNG ou WebP válida');

      return true;
    }),
];
const loginValidation = [
  body(['login', 'email']).custom((val, { req }) => {
    if (
      (typeof req.body.login !== 'string' || !req.body.login.trim()) &&
      (typeof req.body.email !== 'string' || !req.body.email.trim())
    ) {
      throw new Error('Email ou nome de utilizador é obrigatório');
    }

    return true;
  }),
  body('password')
    .isString()
    .bail()
    .isLength({
      max: 128,
    })
    .bail()
    .notEmpty()
    .withMessage('Palavra-passe é obrigatória'),
];

// Endpoints
router.post('/register', registerValidation, asyncHandler(register));
router.post('/login', loginValidation, asyncHandler(login));
router.get('/me', protect, asyncHandler(getMe));
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEMO_LOGIN === 'true') {
  router.get('/demo/:role?', asyncHandler(demoLogin));
}

// Mount remaining profile/social endpoints from profileRoutes seamlessly
router.use('/', profileRoutes);
exports.registerValidation = registerValidation;
exports.loginValidation = loginValidation;
module.exports = router;
module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
