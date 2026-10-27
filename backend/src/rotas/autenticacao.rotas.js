const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const { isSeguroImagem } = require('../validacao/conteudo.js');
const { Router } = require('express');
const { body } = require('express-validator');
const {
  registar: registar,
  iniciarSessao: iniciarSessao,
  obterUtilizadorAtual: obterMe,
  demonstracaoIniciarSessao,
} = require('../controladores/autenticacao.controlador.js');
const { proteger: proteger } = require('../intermediarios/autenticacao.js');
const perfilRotas = require('./perfil.rotas.js');
const router = Router();

// Validação dos dados de registo.
const registarValidation = [
  body('termosAceites')
    .custom((valor) => valor === true)
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
    .custom((valor) => Buffer.byteLength(valor, 'utf8') <= 72)
    .withMessage('A palavra-passe não pode exceder 72 bytes'),
  body('urlAvatar')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .custom((val) => {
      if (!isSeguroImagem(val)) throw new Error('Escolha uma imagem JPG, PNG ou WebP válida');

      return true;
    }),
];
const iniciarSessaoValidation = [
  body(['iniciarSessao', 'email']).custom((val, { req: pedido }) => {
    if (
      (typeof pedido.body.iniciarSessao !== 'string' || !pedido.body.iniciarSessao.trim()) &&
      (typeof pedido.body.email !== 'string' || !pedido.body.email.trim())
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
router.post(['/registar', '/register'], registarValidation, assincronoTratador(registar));
router.post(['/entrar', '/login'], iniciarSessaoValidation, assincronoTratador(iniciarSessao));
router.get(['/eu', '/me'], proteger, assincronoTratador(obterMe));
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEMO_LOGIN === 'true') {
  router.get('/demo/:role?', assincronoTratador(demonstracaoIniciarSessao));
}

// Rotas de perfil e relações entre utilizadores.
router.use('/', perfilRotas);
exports.registerValidation = registarValidation;
exports.loginValidation = iniciarSessaoValidation;
module.exports = router;
module.exports.registerValidation = registarValidation;
module.exports.loginValidation = iniciarSessaoValidation;
