const { queryOne } = require('../database/connection.js');
const { verifyJwtToken } = require('../middleware/auth.js');
async function socketUser(socket) {
  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string') throw new Error('Autenticação necessária.');
  const payload = verifyJwtToken(token);
  socket.data.tokenExpiresAt = Number(payload.exp) * 1000;
  const user = await queryOne(
    `SELECT u.id, u.nome AS name, u.nome_utilizador AS username, u.papel AS role,
    u.url_avatar AS "avatarUrl", u.esta_suspenso AS "isSuspended", u.versao_sessao AS "authVersion", p.url_banner AS "bannerUrl"
    FROM utilizadores u LEFT JOIN perfis p ON p.id_utilizador = u.id WHERE u.id = $1`,
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
async function authenticateSocket(socket, next) {
  try {
    socket.data.user = await socketUser(socket);
    const remaining = socket.data.tokenExpiresAt - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) throw new Error('Sessão expirada.');
    const expiryTimer = setTimeout(() => socket.disconnect(true), Math.min(remaining, 2147483647));
    expiryTimer.unref();
    socket.once('disconnect', () => clearTimeout(expiryTimer));
    next();
  } catch {
    next(new Error('Autenticação necessária ou sessão expirada.'));
  }
}
function broadcastPresence(io) {
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
exports.socketUser = socketUser;
exports.authenticateSocket = authenticateSocket;
exports.broadcastPresence = broadcastPresence;
