const Perfil = require('../models/profile.js');
const { isSeguroImagem, isSeguroCapa } = require('../validation/content.js');
const {
  obterPerfilSocialLigacoes,
  guardarPerfilSocialLigacoes,
  validarSocialLigacoes,
} = require('../models/profileSocialLinks.js');
const { transacao } = require('../database/connection.js');

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

exports.obterPerfilUtilizadorPorIdentificador = obterPerfilUtilizadorPorIdentificador;
exports.atualizarPerfilPerfil = atualizarPerfilPerfil;
exports.enviarPerfilPerfilClearCampo = enviarPerfilPerfilClearCampo;
