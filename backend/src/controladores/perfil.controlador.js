const Perfil = require('../modelos/Perfil.js');
const { isSeguroImagem, isSeguroCapa } = require('../validacao/conteudo.js');
const {
  obterPerfilSocialLigacoes,
  guardarPerfilSocialLigacoes,
  validarSocialLigacoes,
} = require('../modelos/RedesSociaisPerfil.js');
const { createHash: criarResumo, randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { transacao } = require('../base-dados/ligacao.js');
const {
  temEmailTransporte,
  enviarPalavraPasseReporEmail,
  verificarEmailTransporte,
} = require('../configuracao/email.js');
const recoveryMensagem =
  'Se existir uma conta associada a este email, receberá instruções para redefinir a palavra-passe.';

function obterFrontendUrl() {
  const configuredUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || '')
    .split(',')[0]
    .trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  return process.env.NODE_ENV === 'production' ? null : 'http://localhost:5173';
}

const resumoReporToken = (token) => criarResumo('sha256').update(token).digest('hex');

// GET /autenticacao/user/:identifier — Perfil público de um utilizador
const obterPerfilUtilizadorPorIdentificador = async (pedido, resposta) => {
  try {
    const cleanId = (pedido.params.identifier || '').trim();
    if (!cleanId)
      return resposta.status(400).json({
        error: 'Identificador obrigatório',
      });
    const cleanLower = cleanId.toLowerCase();
    const utilizador = await Perfil.procurarUtilizadorPorId([cleanLower, cleanId]);
    if (!utilizador)
      return resposta.status(404).json({
        error: 'Utilizador não encontrado',
      });
    const isSelf = pedido.user && pedido.user.id === utilizador.id;
    const isPublico = utilizador.ePublico !== 0;
    const mostrarBiografia = utilizador.mostrarBiografia !== 0;
    const mostrarLocalizacao = utilizador.mostrarLocalizacao !== 0;
    const mostrarRedesSociais = utilizador.mostrarRedesSociais !== 0;
    const mostrarEstatisticas = utilizador.mostrarEstatisticas !== 0;
    if (!isSelf && !isPublico) {
      return resposta.json({
        id: utilizador.id,
        name: utilizador.name,
        username: utilizador.username,
        role: utilizador.role,
        urlAvatar: utilizador.urlAvatar,
        isPrivateProfile: true,
        profile: {
          urlCapa: utilizador.urlCapa,
          ePublico: 0,
        },
        criadoEm: utilizador.criadoEm,
      });
    }

    return resposta.json({
      id: utilizador.id,
      name: utilizador.name,
      username: utilizador.username,
      role: utilizador.role,
      urlAvatar: utilizador.urlAvatar,
      bio: !isSelf && !mostrarBiografia ? null : utilizador.bio,
      location: !isSelf && !mostrarLocalizacao ? null : utilizador.location,
      objetivoDiarioMinutos: !isSelf && !mostrarEstatisticas ? 0 : utilizador.objetivoDiarioMinutos,
      minutosHoje: !isSelf && !mostrarEstatisticas ? 0 : utilizador.minutosHoje,
      minutosTotais: !isSelf && !mostrarEstatisticas ? 0 : utilizador.minutosTotais,
      profile: {
        headline: !isSelf && !mostrarBiografia ? null : utilizador.headline,
        ligacoesRedesSociais:
          !isSelf && !mostrarRedesSociais ? {} : await obterPerfilSocialLigacoes(utilizador.id),
        website: !isSelf && !mostrarRedesSociais ? null : utilizador.website,
        github: !isSelf && !mostrarRedesSociais ? null : utilizador.github,
        linkedin: !isSelf && !mostrarRedesSociais ? null : utilizador.linkedin,
        urlCapa: utilizador.urlCapa,
        preferenciaTema: utilizador.preferenciaTema,
        ePublico: utilizador.ePublico !== 0 ? 1 : 0,
        mostrarBiografia: utilizador.mostrarBiografia !== 0 ? 1 : 0,
        mostrarLocalizacao: utilizador.mostrarLocalizacao !== 0 ? 1 : 0,
        mostrarRedesSociais: utilizador.mostrarRedesSociais !== 0 ? 1 : 0,
        mostrarEstatisticas: utilizador.mostrarEstatisticas !== 0 ? 1 : 0,
        mostrarCursos: utilizador.mostrarCursos !== 0 ? 1 : 0,
      },
      courses: await (async () => {
        const mostrarCursos = utilizador.mostrarCursos !== 0;
        if (!isSelf && !mostrarCursos) return [];
        const inscricaoRegistos = await Perfil.listarInscricaoRegistosPorUtilizadorId([
          utilizador.id,
        ]);

        return inscricaoRegistos
          .filter((r) => isSelf || r.estaOculto !== 1)
          .map((r) => ({
            id: r.idInscricao,
            idCurso: r.id,
            percentagemProgresso: r.percentagemProgresso || 0,
            concluidoEm: r.concluidoEm,
            estaOculto: r.estaOculto === 1,
            course: {
              id: r.id,
              title: r.title,
              slug: r.slug,
              description: r.description,
              category: r.category,
              urlMiniatura: r.urlMiniatura,
              urlCapa: r.urlCapa,
              duracaoHoras: r.duracaoHoras,
            },
          }));
      })(),
      criadoEm: utilizador.criadoEm,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao carregar perfil do utilizador',
    });
  }
};

const atualizarPerfilPerfil = async (pedido, resposta) => {
  try {
    const {
      name: nome,
      bio: biografia,
      location: localizacao,
      urlAvatar,
      headline: tituloPerfil,
      github,
      linkedin,
      website,
      urlCapa: capaUrl,
      ligacoesRedesSociais: socialLigacoes,
      preferenciaTema: temaPreferencia,
      ePublico: isPublico,
      mostrarBiografia: mostrarBiografia,
      mostrarLocalizacao: mostrarLocalizacao,
      mostrarRedesSociais: mostrarRedesSociais,
      mostrarEstatisticas: mostrarEstatisticas,
      mostrarCursos: mostrarCursos,
    } = pedido.body;
    let cleanSocialLigacoes;
    if (socialLigacoes !== undefined) {
      try {
        cleanSocialLigacoes = validarSocialLigacoes(socialLigacoes);
      } catch (erro) {
        return resposta.status(400).json({
          error: erro.message,
        });
      }
    }

    if (
      nome !== undefined &&
      (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 100)
    ) {
      return resposta.status(400).json({
        error: 'O nome deve ter entre 1 e 100 caracteres.',
      });
    }

    for (const [label, valor, limite] of [
      ['Biografia', biografia, 500],
      ['Título', tituloPerfil, 120],
      ['Localização', localizacao, 100],
    ]) {
      if (valor !== undefined && (typeof valor !== 'string' || valor.length > limite))
        return resposta.status(400).json({
          error: label + ': limite de ' + limite + ' caracteres.',
        });
    }

    const agora = new Date().toISOString();
    if (urlAvatar !== undefined && !isSeguroImagem(urlAvatar))
      return resposta.status(400).json({
        error: 'Imagem de perfil inválida. Use JPG, PNG ou WebP, ou um link http/https.',
      });
    if (capaUrl !== undefined && !isSeguroCapa(capaUrl))
      return resposta.status(400).json({
        error: 'Capa inválida. Use uma imagem, uma cor ou um dos gradientes disponíveis.',
      });
    for (const valor of [
      isPublico,
      mostrarBiografia,
      mostrarLocalizacao,
      mostrarRedesSociais,
      mostrarEstatisticas,
      mostrarCursos,
    ])
      if (valor !== undefined && ![true, false, 0, 1].includes(valor))
        return resposta.status(400).json({
          error: 'Opção de privacidade inválida.',
        });
    await transacao(async () => {
      await Perfil.atualizarUtilizadoresPorAtualizadoEmAndId([
        nome || null,
        biografia !== undefined ? 1 : 0,
        biografia ?? null,
        localizacao !== undefined ? 1 : 0,
        localizacao ?? null,
        urlAvatar !== undefined ? 1 : 0,
        urlAvatar || null,
        agora,
        pedido.user.id,
      ]);

      const perfilExists = await Perfil.procurarPerfilExistsPorIdUtilizador([pedido.user.id]);
      if (perfilExists) {
        await Perfil.atualizarPerfisPorIdUtilizador([
          tituloPerfil !== undefined ? 1 : 0,
          tituloPerfil ?? null,
          github !== undefined ? 1 : 0,
          github ?? null,
          linkedin !== undefined ? 1 : 0,
          linkedin ?? null,
          website !== undefined ? 1 : 0,
          website ?? null,
          capaUrl !== undefined ? 1 : 0,
          capaUrl || null,
          temaPreferencia || null,
          isPublico !== undefined ? (isPublico ? 1 : 0) : null,
          mostrarBiografia !== undefined ? (mostrarBiografia ? 1 : 0) : null,
          mostrarLocalizacao !== undefined ? (mostrarLocalizacao ? 1 : 0) : null,
          mostrarRedesSociais !== undefined ? (mostrarRedesSociais ? 1 : 0) : null,
          mostrarEstatisticas !== undefined ? (mostrarEstatisticas ? 1 : 0) : null,
          mostrarCursos !== undefined ? (mostrarCursos ? 1 : 0) : null,
          pedido.user.id,
        ]);
      } else {
        await Perfil.inserirPerfis([
          `prof-${pedido.user.id}`,
          pedido.user.id,
          tituloPerfil ?? null,
          github ?? null,
          linkedin ?? null,
          website ?? null,
          capaUrl ?? null,
          temaPreferencia || 'light',
          isPublico !== undefined ? (isPublico ? 1 : 0) : 1,
          mostrarBiografia !== undefined ? (mostrarBiografia ? 1 : 0) : 1,
          mostrarLocalizacao !== undefined ? (mostrarLocalizacao ? 1 : 0) : 1,
          mostrarRedesSociais !== undefined ? (mostrarRedesSociais ? 1 : 0) : 1,
          mostrarEstatisticas !== undefined ? (mostrarEstatisticas ? 1 : 0) : 1,
          mostrarCursos !== undefined ? (mostrarCursos ? 1 : 0) : 1,
        ]);
      }

      if (cleanSocialLigacoes !== undefined)
        await guardarPerfilSocialLigacoes(pedido.user.id, cleanSocialLigacoes);
    });

    const atualizado = await Perfil.procurarAtualizadoPorId([pedido.user.id]);

    return resposta.json({
      user: {
        ...atualizado,
        profile: {
          ligacoesRedesSociais: await obterPerfilSocialLigacoes(pedido.user.id),
          headline: atualizado?.headline,
          website: atualizado?.website,
          github: atualizado?.github,
          linkedin: atualizado?.linkedin,
          urlCapa: atualizado?.urlCapa,
          preferenciaTema: atualizado?.preferenciaTema,
          ePublico: atualizado?.ePublico !== 0 ? 1 : 0,
          mostrarBiografia: atualizado?.mostrarBiografia !== 0 ? 1 : 0,
          mostrarLocalizacao: atualizado?.mostrarLocalizacao !== 0 ? 1 : 0,
          mostrarRedesSociais: atualizado?.mostrarRedesSociais !== 0 ? 1 : 0,
          mostrarEstatisticas: atualizado?.mostrarEstatisticas !== 0 ? 1 : 0,
          mostrarCursos: atualizado?.mostrarCursos !== 0 ? 1 : 0,
        },
      },
    });
  } catch (erro) {
    console.error('Falha ao atualizar perfil:', erro.message);

    return resposta.status(500).json({
      error: 'Falha ao atualizar perfil',
    });
  }
};

const enviarPerfilPerfilClearCampo = async (pedido, resposta) => {
  try {
    const { field: campo } = pedido.body;
    if (!['urlAvatar', 'urlCapa'].includes(campo))
      return resposta.status(400).json({
        error: 'Campo inválido',
      });
    const agora = new Date().toISOString();
    if (campo === 'urlAvatar') {
      await Perfil.atualizarUtilizadoresPorAtualizadoEmAndIdParaEnviarPerfilPerfilClearCampo([
        agora,
        pedido.user.id,
      ]);
    } else {
      await Perfil.atualizarPerfisPorIdUtilizadorParaEnviarPerfilPerfilClearCampo([pedido.user.id]);
    }

    return resposta.json({
      success: true,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao limpar campo',
    });
  }
};

const enviarPerfilRecuperarPalavraPasse = async (pedido, resposta) => {
  const email = typeof pedido.body.email === 'string' ? pedido.body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return resposta.status(400).json({
      message: 'Introduza um endereço de email válido.',
    });
  }

  const frontendUrl = obterFrontendUrl();
  const smtpConfigured = temEmailTransporte();
  const localDevelopmentRepor =
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_DEV_PASSWORD_RESET === 'true' &&
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(pedido.ip);
  if (!frontendUrl || (!smtpConfigured && !localDevelopmentRepor)) {
    return resposta.status(503).json({
      message: 'A recuperação de palavra-passe está temporariamente indisponível.',
    });
  }

  if (smtpConfigured) {
    try {
      await verificarEmailTransporte();
    } catch (erro) {
      console.error('SMTP transport verification failed:', erro.message);

      return resposta.status(503).json({
        message: 'O serviço de email está indisponível. Verifique a configuração SMTP.',
      });
    }
  }

  try {
    const utilizadorResultado = await Perfil.procurarUtilizadorResultado([email]);
    const utilizador = utilizadorResultado.rows?.[0];
    if (!utilizador)
      return resposta.json({
        message: recoveryMensagem,
      });
    const token = randomBytes(32).toString('hex');
    const tokenResumo = resumoReporToken(token);
    const agora = new Date();
    const expiresAt = new Date(agora.getTime() + 30 * 60 * 1000).toISOString();
    const reporUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await Perfil.procurarPalavraPasseReporTokensPorUtilizadorId([utilizador.id]);
    await Perfil.procurarPalavraPasseReporTokens([
      `reset-${randomBytes(12).toString('hex')}`,
      utilizador.id,
      tokenResumo,
      expiresAt,
      agora.toISOString(),
    ]);
    if (!smtpConfigured && process.env.NODE_ENV !== 'production') {
      return resposta.json({
        message: recoveryMensagem,
        devResetUrl: reporUrl,
      });
    }

    try {
      await enviarPalavraPasseReporEmail({
        to: utilizador.email,
        name: utilizador.name,
        resetUrl: reporUrl,
      });
    } catch (erro) {
      console.error('Password reset email failed:', erro.message);
      await Perfil.procurarPalavraPasseReporTokensPorTokenResumo([tokenResumo]);

      return resposta.status(503).json({
        message: 'Não foi possível enviar o email de recuperação. Tente novamente mais tarde.',
      });
    }

    return resposta.json({
      message: recoveryMensagem,
    });
  } catch (erro) {
    console.error('Password reset request failed:', erro.message);

    return resposta.status(500).json({
      message: 'Não foi possível processar o pedido. Tente novamente mais tarde.',
    });
  }
};

const enviarPerfilReporPalavraPasse = async (pedido, resposta) => {
  const { token, password: palavraPasse } = pedido.body || {};
  if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token)) {
    return resposta.status(400).json({
      message: 'A ligação é inválida ou expirou. Peça uma nova ligação.',
    });
  }

  if (
    typeof palavraPasse !== 'string' ||
    palavraPasse.length < 12 ||
    Buffer.byteLength(palavraPasse, 'utf8') > 72
  ) {
    return resposta.status(400).json({
      message: 'A palavra-passe deve ter pelo menos 12 caracteres e não exceder 72 bytes.',
    });
  }

  try {
    const tokenResumo = resumoReporToken(token);
    const tokenResultado = await Perfil.procurarTokenResultadoPorTokenResumo([tokenResumo]);
    const reporRegistar = tokenResultado.rows?.[0];
    if (
      !reporRegistar ||
      !Number.isFinite(Date.parse(reporRegistar.expires_at)) ||
      Date.parse(reporRegistar.expires_at) <= Date.now()
    ) {
      if (reporRegistar) await Perfil.procurarPalavraPasseReporTokensPorTokenResumo([tokenResumo]);

      return resposta.status(400).json({
        message: 'A ligação é inválida ou expirou. Peça uma nova ligação.',
      });
    }

    const palavraPasseResumo = await bcrypt.hash(palavraPasse, 10);
    const changed = await transacao(async () => {
      const consumed = await Perfil.eliminarConsumedPorResumoToken([
        tokenResumo,
        new Date().toISOString(),
      ]);
      if (Number(consumed.changes) !== 1) return false;
      await Perfil.atualizarUtilizadoresPorResumoPalavraPasseAndAtualizadoEmAndId([
        palavraPasseResumo,
        new Date().toISOString(),
        reporRegistar.user_id,
      ]);

      return true;
    });
    if (!changed)
      return resposta.status(400).json({
        message: 'A ligação é inválida ou expirou. Peça uma nova ligação.',
      });
    pedido.app
      .get('io')
      ?.in('user_' + reporRegistar.user_id)
      .disconnectSockets(true);

    return resposta.json({
      message: 'Palavra-passe atualizada. Já pode iniciar sessão.',
    });
  } catch (erro) {
    console.error('Password reset failed:', erro.message);

    return resposta.status(500).json({
      message: 'Não foi possível redefinir a palavra-passe. Tente novamente.',
    });
  }
};

exports.obterPerfilUtilizadorPorIdentificador = obterPerfilUtilizadorPorIdentificador;
exports.atualizarPerfilPerfil = atualizarPerfilPerfil;
exports.enviarPerfilPerfilClearCampo = enviarPerfilPerfilClearCampo;
exports.enviarPerfilRecuperarPalavraPasse = enviarPerfilRecuperarPalavraPasse;
exports.enviarPerfilReporPalavraPasse = enviarPerfilReporPalavraPasse;
