const { consultarUm } = require('../base-dados/ligacao.js');
const { verificarJwtToken } = require('../intermediarios/autenticacao.js');

async function socketUtilizador(socket) {
  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string') throw new Error('Autenticação necessária.');
  const payload = verificarJwtToken(token);

  socket.data.tokenExpiresAt = Number(payload.exp) * 1000;

  const utilizador = await consultarUm(
    `SELECT u.id, u.nome AS name, u.nome_utilizador AS username, u.papel AS role,
    u.url_avatar AS "urlAvatar", u.esta_suspenso AS "estaSuspenso", u.versao_sessao AS "versaoSessao", p.url_banner AS "urlCapa"
    FROM utilizadores u LEFT JOIN perfis p ON p.id_utilizador = u.id WHERE u.id = $1`,
    [payload.id],
  );
  if (
    !utilizador ||
    Number(utilizador.estaSuspenso) === 1 ||
    Number(payload.version || 0) !== Number(utilizador.versaoSessao || 0)
  )
    throw new Error('Sessão inválida.');
  const { estaSuspenso: _estaSuspenso, versaoSessao: _versaoSessao, ...seguro } = utilizador;

  return seguro;
}

async function autenticarSocket(socket, seguinte) {
  try {
    socket.data.user = await socketUtilizador(socket);

    const remaining = socket.data.tokenExpiresAt - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) throw new Error('Sessão expirada.');
    const expiryTimer = setTimeout(() => socket.disconnect(true), Math.min(remaining, 2147483647));

    expiryTimer.unref();
    socket.once('disconnect', () => clearTimeout(expiryTimer));
    seguinte();
  } catch {
    seguinte(new Error('Autenticação necessária ou sessão expirada.'));
  }
}

function difundirPresenca(io) {
  const utilizadores = new Map();
  for (const socket of io.sockets.sockets.values())
    if (socket.data?.user)
      utilizadores.set(socket.data.user.id, {
        idUtilizador: socket.data.user.id,
        username: socket.data.user.username,
        status: 'online',
      });
  io.emit('presence-update', [...utilizadores.values()]);
}

exports.socketUtilizador = socketUtilizador;
exports.autenticarSocket = autenticarSocket;
exports.difundirPresenca = difundirPresenca;
