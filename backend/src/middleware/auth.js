const { getSessionSecret } = require('../config/sessionSecret.js');
const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/connection.js');
const configuredJwtSecret = getSessionSecret();
if (
  process.env.NODE_ENV === 'production' &&
  (!configuredJwtSecret ||
    configuredJwtSecret.length < 32 ||
    /YOUR[_-]|alterar|chave_secreta|super-secret|change[-_ ]?(this|me)/i.test(configuredJwtSecret))
) {
  throw new Error('JWT_SECRET tem de estar configurado com pelo menos 32 caracteres em produção.');
}
const JWT_SECRET = configuredJwtSecret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
function signJwtToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      version: Number(payload.authVersion || 0),
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}
function verifyJwtToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
  });
}
const protect = async (req, res, next) => {
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
    const user = await queryOne(
      'SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role, esta_suspenso AS "isSuspended", versao_sessao AS "authVersion" FROM utilizadores WHERE id = $1',
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
    next(err);
  }
};
const authenticate = protect;
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = verifyJwtToken(token);
  } catch {
    return next();
  }
  try {
    const user = await queryOne(
      'SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role, esta_suspenso AS "isSuspended", versao_sessao AS "authVersion" FROM utilizadores WHERE id = $1',
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
  } catch (error) {
    return next(error);
  }
  next();
};
const requireRole = (...roles) => {
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
exports.signJwtToken = signJwtToken;
exports.verifyJwtToken = verifyJwtToken;
exports.protect = protect;
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
