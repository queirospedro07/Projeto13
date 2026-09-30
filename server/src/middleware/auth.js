import jwt from 'jsonwebtoken';
import { queryOne } from '../database/connection.js';
import { verifyJwtToken } from '../config/jwt.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Não autorizado. Token em falta.',
        error: 'Não autorizado. Token em falta.'
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
          error: 'Token expirado. Por favor, inicie sessão novamente.'
        });
      }
      return res.status(401).json({
        message: 'Token inválido.',
        error: 'Token inválido.'
      });
    }

    const user = queryOne('SELECT id, email, username, name, role, isSuspended FROM users WHERE id = ?', [payload.id]);
    if (!user) {
      return res.status(401).json({
        message: 'Utilizador não encontrado.',
        error: 'Utilizador não encontrado.'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: 'Conta suspensa. Contacte a administração.',
        error: 'Conta suspensa. Contacte a administração.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      isAdmin: user.role === 'ADMIN'
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Não autorizado.',
      error: 'Não autorizado.'
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
    req.user = payload;
  } catch (_) {}
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Autenticação necessária.',
        error: 'Autenticação necessária.'
      });
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Permissões insuficientes para esta ação.',
        error: 'Permissões insuficientes para esta ação.'
      });
    }
    next();
  };
};