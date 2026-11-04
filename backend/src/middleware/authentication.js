const { obterSegredoSessao } = require('../config/sessionSecret.js');
const jwt = require('jsonwebtoken');
const { consultarUm } = require('../database/connection.js');
const configuredJwtSegredo = obterSegredoSessao();
if (
  process.env.NODE_ENV === 'production' &&
  (!configuredJwtSegredo ||
    configuredJwtSegredo.length < 32 ||
    /YOUR[_-]|alterar|chave_secreta|super-secret|change[-_ ]?(this|me)/i.test(configuredJwtSegredo))
) {
  throw new Error('JWT_SECRET tem de estar configurado com pelo menos 32 caracteres em produção.');
}

const JWT_SECRET = configuredJwtSegredo;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function assinarJwtToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      version: Number(payload.versaoSessao || 0),
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

function verificarJwtToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
  });
}

const proteger = async (pedido, resposta, seguinte) => {
  try {
    const autenticacaoHeader = pedido.headers.authorization;
    if (!autenticacaoHeader || !autenticacaoHeader.startsWith('Bearer ')) {
      return resposta.status(401).json({
        message: 'Não autorizado. Token em falta.',
        error: 'Não autorizado. Token em falta.',
      });
    }

    const token = autenticacaoHeader.split(' ')[1];
    let payload;
    try {
      payload = verificarJwtToken(token);
    } catch (erro) {
      if (erro.name === 'TokenExpiredError') {
        return resposta.status(401).json({
          message: 'Token expirado. Por favor, inicie sessão novamente.',
          error: 'Token expirado. Por favor, inicie sessão novamente.',
        });
      }

      return resposta.status(401).json({
        message: 'Token inválido.',
        error: 'Token inválido.',
      });
    }

    const utilizador = await consultarUm(
      `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role, (papel = 'CREATOR' OR (papel = 'ADMIN' AND admin_formador = 1)) AS "eFormador", esta_suspenso AS "estaSuspenso", versao_sessao AS "versaoSessao" FROM utilizadores WHERE id = $1`,
      [payload.id],
    );
    if (!utilizador || Number(payload.version || 0) !== Number(utilizador.versaoSessao || 0)) {
      return resposta.status(401).json({
        message: 'Utilizador não encontrado.',
        error: 'Utilizador não encontrado.',
      });
    }

    if (Number(utilizador.estaSuspenso) === 1) {
      return resposta.status(403).json({
        message: 'Conta suspensa. Contacte a administração.',
        error: 'Conta suspensa. Contacte a administração.',
      });
    }

    pedido.user = {
      id: utilizador.id,
      email: utilizador.email,
      username: utilizador.username,
      name: utilizador.name,
      role: utilizador.role,
      eFormador: utilizador.eFormador,
      eAdministrador: utilizador.role === 'ADMIN',
    };
    seguinte();
  } catch (erro) {
    seguinte(erro);
  }
};

const autenticar = proteger;
const opcionalAutenticacao = async (pedido, resposta, seguinte) => {
  const autenticacaoHeader = pedido.headers.authorization;
  if (!autenticacaoHeader || !autenticacaoHeader.startsWith('Bearer ')) {
    return seguinte();
  }

  const token = autenticacaoHeader.split(' ')[1];
  let payload;
  try {
    payload = verificarJwtToken(token);
  } catch {
    return seguinte();
  }

  try {
    const utilizador = await consultarUm(
      `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role, (papel = 'CREATOR' OR (papel = 'ADMIN' AND admin_formador = 1)) AS "eFormador", esta_suspenso AS "estaSuspenso", versao_sessao AS "versaoSessao" FROM utilizadores WHERE id = $1`,
      [payload.id],
    );
    if (
      utilizador &&
      Number(payload.version || 0) === Number(utilizador.versaoSessao || 0) &&
      Number(utilizador.estaSuspenso) !== 1
    ) {
      pedido.user = {
        id: utilizador.id,
        email: utilizador.email,
        username: utilizador.username,
        name: utilizador.name,
        role: utilizador.role,
        eFormador: utilizador.eFormador,
        eAdministrador: utilizador.role === 'ADMIN',
      };
    }
  } catch (erro) {
    return seguinte(erro);
  }

  seguinte();
};

const exigirCargo = (...cargos) => {
  return (pedido, resposta, seguinte) => {
    if (!pedido.user) {
      return resposta.status(401).json({
        message: 'Autenticação necessária.',
        error: 'Autenticação necessária.',
      });
    }

    if (!cargos.includes(pedido.user.role) && pedido.user.role !== 'ADMIN') {
      return resposta.status(403).json({
        message: 'Permissões insuficientes para esta ação.',
        error: 'Permissões insuficientes para esta ação.',
      });
    }

    seguinte();
  };
};

exports.assinarJwtToken = assinarJwtToken;
exports.verificarJwtToken = verificarJwtToken;
exports.proteger = proteger;
exports.autenticar = autenticar;
exports.autenticacaoOpcional = opcionalAutenticacao;
exports.exigirCargo = exigirCargo;

const exigirFormacao = (pedido, resposta, seguinte) => {
  if (
    pedido.user?.role === 'CREATOR' ||
    (pedido.user?.role === 'ADMIN' && pedido.user.eFormador !== false)
  )
    return seguinte();

  return resposta.status(403).json({
    error: 'É necessário ter acesso de formador.',
  });
};

exports.exigirFormacao = exigirFormacao;
