const { normalizarCampos } = require('../utilitarios/compatibilidadeCampos');
const helmet = require('helmet');
const cors = require('cors');
const rateLimite = require('express-rate-limit');
const normalizarOrigem = (valor) => {
  if (!valor || typeof valor !== 'string') return '';
  const trimmed = valor.trim().replace(/\/$/, '');
  try {
    const url = new URL(trimmed);

    return `${url.protocol}//${url.host}`;
  } catch {
    return trimmed;
  }
};

const permitidoOrigins = [
  ...new Set(
    [process.env.CLIENT_URL, process.env.FRONTEND_URL]
      .filter(Boolean)
      .flatMap((valor) => valor.split(','))
      .map(normalizarOrigem)
      .filter(Boolean)
      .filter((url) => url !== '*'),
  ),
];
if (process.env.NODE_ENV !== 'production') {
  permitidoOrigins.push(
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  );
}

function isOrigemPermitido(origem) {
  if (!origem) return true;
  const normalizedOrigem = normalizarOrigem(origem);

  return permitidoOrigins.includes(normalizedOrigem);
}

const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
  dnsPrefetchControl: {
    allow: false,
  },
  frameguard: {
    action: 'deny',
  },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  permissionsPolicy: {
    camera: ['self'],
    microphone: ['self'],
    fullscreen: ['self'],
    geolocation: [],
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  xssFilter: true,
});
const corsMiddleware = cors({
  origin: (origem, funcaoRetorno) => {
    if (isOrigemPermitido(origem)) {
      funcaoRetorno(null, true);
    } else {
      const erro = new Error('Origem não autorizada.');

      erro.status = 403;
      funcaoRetorno(erro);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
});
const socketCorsConfig = {
  origin: (origem, funcaoRetorno) => {
    if (isOrigemPermitido(origem)) {
      funcaoRetorno(null, true);
    } else {
      funcaoRetorno(new Error('Ligação WebSocket bloqueada pela política CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
const apiLimiter = rateLimite({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitos pedidos realizados a partir deste endereço. Tente novamente mais tarde.',
  },
});
const autenticacaoLimiter = rateLimite({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas tentativas de autenticação. Por favor, aguarde alguns minutos.',
  },
});

function higienizarInputs(pedido, resposta, seguinte) {
  if (
    Object.keys(pedido.query || {}).length > 20 ||
    Object.values(pedido.query || {}).some(
      (valor) => typeof valor !== 'string' || valor.length > 500,
    )
  ) {
    return resposta.status(400).json({
      error: 'Os filtros devem ser textos com até 500 caracteres.',
    });
  }

  const noTrimKeys = new Set(['password', 'currentPassword', 'newPassword', 'content', 'code']);
  if (Array.isArray(pedido.body))
    return resposta.status(400).json({
      error: 'O corpo do pedido deve ser um objeto.',
    });
  let visited = 0;
  const clean = (obj, depth = 0) => {
    if (depth > 20 || ++visited > 10000) {
      const erro = new Error('O pedido é demasiado complexo.');

      erro.status = 400;
      throw erro;
    }

    if (!obj || typeof obj !== 'object') return obj;
    for (const chave of Object.keys(obj)) {
      if (chave === '__proto__' || chave === 'constructor' || chave === 'prototype') {
        delete obj[chave];
        continue;
      }

      if (typeof obj[chave] === 'string') {
        const withoutNulls = obj[chave].replace(/\0/g, '');

        obj[chave] = noTrimKeys.has(chave) ? withoutNulls : withoutNulls.trim();
      } else if (typeof obj[chave] === 'object') {
        clean(obj[chave], depth + 1);
      }
    }

    return obj;
  };

  if (pedido.body) clean(pedido.body);
  if (pedido.query) clean(pedido.query);
  if (pedido.params) clean(pedido.params);
  if (pedido.body) pedido.body = normalizarCampos(pedido.body);
  if (pedido.query) pedido.query = normalizarCampos(pedido.query);
  seguinte();
}

exports.allowedOrigins = permitidoOrigins;
exports.isOrigemPermitido = isOrigemPermitido;
exports.helmetMiddleware = helmetMiddleware;
exports.corsMiddleware = corsMiddleware;
exports.socketCorsConfig = socketCorsConfig;
exports.apiLimiter = apiLimiter;
exports.authLimiter = autenticacaoLimiter;
exports.higienizarInputs = higienizarInputs;
