import { queryOne } from '../database/connection.js';
import { verifyJwtToken } from '../middleware/auth.js';

export function socketUser(socket) {
  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string') throw new Error('Autenticação necessária.');
  const payload = verifyJwtToken(token);
  const user = queryOne(
    `SELECT u.id, u.nome AS name, u.nome_utilizador AS username, u.papel AS role,
    u.url_avatar AS avatarUrl, u.esta_suspenso AS isSuspended, u.versao_sessao AS authVersion, p.url_banner AS bannerUrl
    FROM utilizadores u LEFT JOIN perfis p ON p.id_utilizador = u.id WHERE u.id = ?`,
    [payload.id],
  );
  if (
    !user ||
    Number(user.isSuspended) === 1 ||
    Number(payload.version || 0) !== Number(user.authVersion || 0)
  )
    throw new Error('Sessão inválida.');
  const { isSuspended, authVersion, ...safe } = user;
  return safe;
}
export function authenticateSocket(socket, next) {
  try {
    socket.data.user = socketUser(socket);
    next();
  } catch {
    next(new Error('Autenticação necessária ou sessão expirada.'));
  }
}
export function broadcastPresence(io) {
  const users = new Map();
  for (const socket of io.sockets.sockets.values())
    if (socket.data?.user)
      users.set(socket.data.user.id, {
        userId: socket.data.user.id,
        username: socket.data.user.username,
        status: 'online',
      });
  io.emit('presence-update', [...users.values()]);
}
