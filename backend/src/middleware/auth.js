import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { queryOne } from '../database/connection.js';

const DEV_FALLBACK_SECRET = randomBytes(32).toString('hex');
const configuredJwtSecret = process.env.JWT_SECRET?.trim();
if (
  process.env.NODE_ENV === 'production' &&
  (!configuredJwtSecret ||
    configuredJwtSecret.length < 32 ||
    /YOUR[_-]|alterar|chave_secreta|super-secret|change[-_ ]?(this|me)/i.test(configuredJwtSecret))
) {
  throw new Error('JWT_SECRET tem de estar configurado com pelo menos 32 caracteres em produção.');
}
const JWT_SECRET = configuredJwtSecret || DEV_FALLBACK_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export function signJwtToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      version: Number(payload.authVersion || 0),
    },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN },
  );
}

export function verifyJwtToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Não autorizado. Token em falta.',
        error: 'Não autorizado. Token em falta.',
      });
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = verifyJwtToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token expirado. Por favor, inicie sessão novamente.',
          error: 'Token expirado. Por favor, inicie sessão novamente.',
        });
      }
      return res.status(401).json({
        message: 'Token inválido.',
        error: 'Token inválido.',
      });
    }

    const user = queryOne(
      'SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role, esta_suspenso AS isSuspended, versao_sessao AS authVersion FROM utilizadores WHERE id = ?',
      [payload.id],
    );
    if (!user || Number(payload.version || 0) !== Number(user.authVersion || 0)) {
      return res.status(401).json({
        message: 'Utilizador não encontrado.',
        error: 'Utilizador não encontrado.',
      });
    }

    if (Number(user.isSuspended) === 1) {
      return res.status(403).json({
        message: 'Conta suspensa. Contacte a administração.',
        error: 'Conta suspensa. Contacte a administração.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      isAdmin: user.role === 'ADMIN',
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Não autorizado.',
      error: 'Não autorizado.',
    });
  }
};

// Alias for compatibility
export const authenticate = protect;

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyJwtToken(token);
    const user = queryOne(
      'SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role, esta_suspenso AS isSuspended, versao_sessao AS authVersion FROM utilizadores WHERE id = ?',
      [payload.id],
    );
    if (
      user &&
      Number(payload.version || 0) === Number(user.authVersion || 0) &&
      Number(user.isSuspended) !== 1
    ) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'ADMIN',
      };
    }
  } catch (_) {}
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Autenticação necessária.',
        error: 'Autenticação necessária.',
      });
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Permissões insuficientes para esta ação.',
        error: 'Permissões insuficientes para esta ação.',
      });
    }
    next();
  };
};
