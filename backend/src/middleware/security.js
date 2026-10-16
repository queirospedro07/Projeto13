const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/\/$/, '');
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return trimmed;
  }
};
const allowedOrigins = [
  ...new Set(
    [process.env.CLIENT_URL, process.env.FRONTEND_URL]
      .filter(Boolean)
      .flatMap((value) => value.split(','))
      .map(normalizeOrigin)
      .filter(Boolean)
      .filter((url) => url !== '*'),
  ),
];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  );
}
function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.includes(normalizedOrigin);
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
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      const error = new Error('Origem não autorizada.');
      error.status = 403;
      callback(error);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
});
const socketCorsConfig = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Ligação WebSocket bloqueada pela política CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitos pedidos realizados a partir deste endereço. Tente novamente mais tarde.',
  },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas tentativas de autenticação. Por favor, aguarde alguns minutos.',
  },
});
function sanitizeInputs(req, res, next) {
  if (
    Object.keys(req.query || {}).length > 20 ||
    Object.values(req.query || {}).some((value) => typeof value !== 'string' || value.length > 500)
  ) {
    return res.status(400).json({ error: 'Os filtros devem ser textos com até 500 caracteres.' });
  }
  const noTrimKeys = new Set(['password', 'currentPassword', 'newPassword', 'content', 'code']);
  if (Array.isArray(req.body))
    return res.status(400).json({
      error: 'O corpo do pedido deve ser um objeto.',
    });
  let visited = 0;
  const clean = (obj, depth = 0) => {
    if (depth > 20 || ++visited > 10000) {
      const error = new Error('O pedido é demasiado complexo.');
      error.status = 400;
      throw error;
    }
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete obj[key];
        continue;
      }
      if (typeof obj[key] === 'string') {
        const withoutNulls = obj[key].replace(/\0/g, '');
        obj[key] = noTrimKeys.has(key) ? withoutNulls : withoutNulls.trim();
      } else if (typeof obj[key] === 'object') {
        clean(obj[key], depth + 1);
      }
    }
    return obj;
  };
  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);
  next();
}
exports.allowedOrigins = allowedOrigins;
exports.isOriginAllowed = isOriginAllowed;
exports.helmetMiddleware = helmetMiddleware;
exports.corsMiddleware = corsMiddleware;
exports.socketCorsConfig = socketCorsConfig;
exports.apiLimiter = apiLimiter;
exports.authLimiter = authLimiter;
exports.sanitizeInputs = sanitizeInputs;
