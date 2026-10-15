import { isSafeImage } from '../validation/content.js';
import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, demoLogin } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import legacyAuthRoutes from './auth.js';

const router = Router();

// Validation chains (express-validator)
export const registerValidation = [
  body('acceptedTerms')
    .custom((value) => value === true)
    .withMessage('É necessário aceitar os termos para criar a conta.'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 80 })
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
    .isLength({ min: 12 })
    .withMessage('A palavra-passe deve ter pelo menos 12 caracteres')
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('A palavra-passe não pode exceder 72 bytes'),
  body('avatarUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (!isSafeImage(val)) throw new Error('Escolha uma imagem JPG, PNG ou WebP válida');
      return true;
    }),
];

export const loginValidation = [
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
    .isLength({ max: 128 })
    .bail()
    .notEmpty()
    .withMessage('Palavra-passe é obrigatória'),
];

// Endpoints
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEMO_LOGIN === 'true') {
  router.get('/demo/:role?', demoLogin);
}

// Mount remaining profile/social endpoints from legacyAuthRoutes seamlessly
router.use('/', legacyAuthRoutes);

export default router;
