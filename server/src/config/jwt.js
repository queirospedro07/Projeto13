import jwt from 'jsonwebtoken';
const DEV_FALLBACK_SECRET = 'learnspace-default-dev-secret-key-32-chars-minimum';
const secretFromEnv = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!secretFromEnv || secretFromEnv === DEV_FALLBACK_SECRET)) {
  throw new Error('[FATAL SECURITY ERROR]: JWT_SECRET must be configured with a secure string in production! Server refused to start with fallback secret.');
}
export const JWT_SECRET = secretFromEnv || DEV_FALLBACK_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export function signJwtToken(payload) {
  return jwt.sign({
    id: payload.id,
    email: payload.email,
    username: payload.username,
    role: payload.role
  }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN
  });
}
export function verifyJwtToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256']
  });
}