import { queryOne } from '../db/index.js';
import { verifyJwtToken } from '../config/jwt.js';
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyJwtToken(token);
    const user = queryOne('SELECT id, email, username, role, isSuspended FROM users WHERE id = ?', [payload.id]);
    if (!user) {
      return res.status(401).json({
        error: 'User no longer exists'
      });
    }
    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Account has been suspended by administration'
      });
    }
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token'
    });
  }
}
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyJwtToken(token);
    req.user = payload;
  } catch (err) {}
  next();
}
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Insufficient permissions for this action'
      });
    }
    next();
  };
}