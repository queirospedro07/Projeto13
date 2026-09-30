import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, demoLogin } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import legacyAuthRoutes from './auth.js';

const router = Router();

// Validation chains (express-validator)
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 80 }).withMessage('Nome deve ter entre 2 e 80 caracteres'),
  body('username')
    .trim()
    .notEmpty().withMessage('Nome de utilizador é obrigatório')
    .matches(/^[a-zA-Z0-9_]{3,30}$/).withMessage('Nome de utilizador deve ter 3–30 caracteres (letras, números ou _)'),
  body('email')
    .isEmail().withMessage('Endereço de email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('A palavra-passe deve ter pelo menos 6 caracteres')
    .isLength({ max: 128 }).withMessage('A palavra-passe não pode exceder 128 caracteres')
];

export const loginValidation = [
  body(['login', 'email'])
    .custom((val, { req }) => {
      if (!req.body.login && !req.body.email) {
        throw new Error('Email ou nome de utilizador é obrigatório');
      }
      return true;
    }),
  body('password')
    .notEmpty().withMessage('Palavra-passe é obrigatória')
];

// Endpoints
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.get('/demo/:role?', demoLogin);

// Mount remaining profile/social endpoints from legacyAuthRoutes seamlessly
router.use('/', legacyAuthRoutes);

export default router;
