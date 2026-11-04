const Autenticacao = require('../models/authentication.js');
const { obterPerfilSocialLigacoes } = require('../models/profileSocialLinks.js');
const { validationResult: validationResultado } = require('express-validator');
const Utilizador = require('../models/user.js');
const { assinarJwtToken } = require('../middleware/authentication.js');
const gerarToken = (utilizador) => assinarJwtToken(utilizador);
const registar = async (pedido, resposta) => {
  const erros = validationResultado(pedido);
  if (!erros.isEmpty()) {
    return resposta.status(400).json({
      errors: erros.array(),
      message: erros.array()[0]?.msg || 'Dados de registo inválidos.',
      error: erros.array()[0]?.msg || 'Dados de registo inválidos.',
    });
  }

  try {
    const { name: nome, username: nomeUtilizador, email, password: palavraPasse } = pedido.body;
    const existenteEmail = await Utilizador.procurarPorEmail(email);
    if (existenteEmail) {
      return resposta.status(409).json({
        message: 'Email já registado no sistema.',
        error: 'Email já registado no sistema.',
      });
    }

    const existenteUtilizador = await Utilizador.procurarPorNomeUtilizador(nomeUtilizador);
    if (existenteUtilizador) {
      return resposta.status(409).json({
        message: 'Nome de utilizador já se encontra em uso.',
        error: 'Nome de utilizador já se encontra em uso.',
      });
    }

    // Registo de conta é sempre como aluno
    const novoUtilizador = await Utilizador.criar({
      name: nome,
      username: nomeUtilizador,
      email,
      password: palavraPasse,
      role: 'STUDENT',
      termosAceites: true,
    });
    const token = gerarToken(novoUtilizador);

    return resposta.status(201).json({
      message: 'Utilizador registado com sucesso.',
      token,
      user: novoUtilizador,
    });
  } catch (erro) {
    console.error('Registration error:', erro);

    return resposta.status(500).json({
      message: 'Falha ao registar utilizador no servidor.',
      error: 'Falha ao registar utilizador no servidor.',
    });
  }
};

const iniciarSessao = async (pedido, resposta) => {
  const erros = validationResultado(pedido);
  if (!erros.isEmpty()) {
    return resposta.status(400).json({
      errors: erros.array(),
      message: erros.array()[0]?.msg || 'Preencha os dados de início de sessão.',
      error: erros.array()[0]?.msg || 'Preencha os dados de início de sessão.',
    });
  }

  try {
    const iniciarSessaoIdentificador = (
      typeof pedido.body.iniciarSessao === 'string' ? pedido.body.iniciarSessao : pedido.body.email
    )
      .trim()
      .toLowerCase();
    if (iniciarSessaoIdentificador.length > 254)
      return resposta.status(400).json({
        error: 'Email ou nome de utilizador inválido.',
      });
    const { password: palavraPasse } = pedido.body;
    const utilizador = await Autenticacao.procurarUtilizador([
      iniciarSessaoIdentificador,
      iniciarSessaoIdentificador,
    ]);
    if (!utilizador) {
      return resposta.status(401).json({
        message: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
        error: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
      });
    }

    if (Number(utilizador.estaSuspenso) === 1) {
      return resposta.status(403).json({
        message: 'Esta conta encontra-se suspensa pela administração.',
        error: 'Esta conta encontra-se suspensa pela administração.',
      });
    }

    const isMatch = await Utilizador.compararPalavraPasse(
      palavraPasse,
      utilizador.hashPalavraPasse,
    );
    if (!isMatch) {
      return resposta.status(401).json({
        message: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
        error: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
      });
    }

    const tokenUtilizador = {
      id: utilizador.id,
      name: utilizador.name,
      username: utilizador.username,
      email: utilizador.email,
      role: utilizador.role,
      eFormador: utilizador.eFormador,
      eAdministrador: utilizador.role === 'ADMIN',
      urlAvatar: utilizador.urlAvatar,
    };
    const token = gerarToken({
      ...tokenUtilizador,
      versaoSessao: utilizador.versaoSessao,
    });

    return resposta.json({
      message: 'Sessão iniciada com sucesso.',
      token,
      user: tokenUtilizador,
    });
  } catch (erro) {
    console.error('Login error:', erro);

    return resposta.status(500).json({
      message: 'Erro interno ao autenticar utilizador.',
      error: 'Erro interno ao autenticar utilizador.',
    });
  }
};

const obterMe = async (pedido, resposta) => {
  try {
    const utilizador = await Autenticacao.procurarUtilizadorPorId([pedido.user.id]);
    if (!utilizador) {
      return resposta.status(404).json({
        message: 'Utilizador não encontrado.',
        error: 'Utilizador não encontrado.',
      });
    }

    const perfil = (await Autenticacao.procurarPerfisPorIdUtilizador([utilizador.id])) || {};
    const seguroUtilizador = {
      id: utilizador.id,
      name: utilizador.name,
      username: utilizador.username,
      email: utilizador.email,
      role: utilizador.role,
      eFormador: utilizador.eFormador,
      eAdministrador: utilizador.role === 'ADMIN',
      urlAvatar: utilizador.urlAvatar,
      bio: utilizador.bio,
      location: utilizador.location,
      objetivoDiarioMinutos: utilizador.objetivoDiarioMinutos,
      minutosHoje: utilizador.minutosHoje,
      minutosTotais: utilizador.minutosTotais,
      profile: {
        ligacoesRedesSociais: await obterPerfilSocialLigacoes(utilizador.id),
        headline: perfil.headline || '',
        website: perfil.website || '',
        github: perfil.github || '',
        linkedin: perfil.linkedin || '',
        urlCapa: perfil.urlCapa || '',
        ePublico: Boolean(perfil.ePublico !== 0),
        mostrarBiografia: perfil.mostrarBiografia !== 0 ? 1 : 0,
        mostrarLocalizacao: perfil.mostrarLocalizacao !== 0 ? 1 : 0,
        mostrarRedesSociais: perfil.mostrarRedesSociais !== 0 ? 1 : 0,
        mostrarEstatisticas: perfil.mostrarEstatisticas !== 0 ? 1 : 0,
        mostrarCursos: perfil.mostrarCursos !== 0 ? 1 : 0,
        preferenciaTema: perfil.preferenciaTema || 'light',
      },
    };

    return resposta.json({
      user: seguroUtilizador,
      ...seguroUtilizador,
    });
  } catch (erro) {
    console.error('getMe error:', erro);

    return resposta.status(500).json({
      message: 'Erro ao carregar dados do utilizador.',
      error: 'Erro ao carregar dados do utilizador.',
    });
  }
};

const demonstracaoIniciarSessao = async (pedido, resposta) => {
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_DEMO_LOGIN !== 'true') {
    return resposta.status(403).json({
      message: 'Modo de demonstração desativado.',
      error: 'Modo de demonstração desativado.',
    });
  }

  const { role: cargo = 'student' } = pedido.params;
  const destinoCargo = String(cargo).toUpperCase();
  if (!['STUDENT', 'CREATOR'].includes(destinoCargo)) {
    return resposta.status(400).json({
      message: 'Perfil de demonstração inválido.',
      error: 'Perfil de demonstração inválido.',
    });
  }

  const utilizador = await Autenticacao.procurarUtilizadorPorPapelAndId([
    destinoCargo,
    destinoCargo === 'CREATOR' ? 'demo-creator-sofia' : 'demo-student-marta',
  ]);
  if (!utilizador) {
    return resposta.status(404).json({
      message: 'Conta de demonstração não encontrada.',
      error: 'Conta de demonstração não encontrada.',
    });
  }

  const tokenUtilizador = {
    id: utilizador.id,
    name: utilizador.name,
    username: utilizador.username,
    email: utilizador.email,
    role: utilizador.role,
    eAdministrador: utilizador.role === 'ADMIN',
    urlAvatar: utilizador.urlAvatar,
    versaoSessao: utilizador.versaoSessao,
  };
  const token = gerarToken(tokenUtilizador);

  return resposta.json({
    token,
    user: tokenUtilizador,
  });
};

exports.registar = registar;
exports.iniciarSessao = iniciarSessao;
exports.obterUtilizadorAtual = obterMe;
exports.demonstracaoIniciarSessao = demonstracaoIniciarSessao;
