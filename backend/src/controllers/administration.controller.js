const { reverCurso } = require('../services/coursePublishing');
const Administracao = require('../models/administration.js');
const { alterarUtilizadorCargo } = require('../services/userRoles');
const { transacao, bloquearTransacao } = require('../database/connection.js');
const obterAdministracaoEstatisticas = async (pedido, resposta) => {
  try {
    const totalUtilizadores = ((await Administracao.contarUtilizadores()) || {}).c || 0;
    const ativoUtilizadores = (await Administracao.contarAtivoUtilizadores()).c;
    const totalCursos = ((await Administracao.contarCursos()) || {}).c || 0;
    const totalEspacos = ((await Administracao.contarEspacos()) || {}).c || 0;
    const totalInscricoes = ((await Administracao.contarInscricoes()) || {}).c || 0;
    const pendenteCandidaturas = ((await Administracao.contarFormadorCandidaturas()) || {}).c || 0;
    const pendenteCursos =
      ((await Administracao.contarCursosParaObterAdministracaoEstatisticas()) || {}).c || 0;

    return resposta.json({
      totalUsers: totalUtilizadores,
      activeUsers: ativoUtilizadores,
      totalCourses: totalCursos,
      totalSpaces: totalEspacos,
      totalEnrollments: totalInscricoes,
      pendingApplications: pendenteCandidaturas,
      pendingCourses: pendenteCursos,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao carregar estatísticas de administração',
    });
  }
};

const obterAdministracaoUtilizadores = async (pedido, resposta) => {
  try {
    const utilizadores = await Administracao.contarUtilizadoresParaObterAdministracaoUtilizadores();

    return resposta.json(
      utilizadores.map((u) => ({
        ...u,
        estaSuspenso: u.role !== 'ADMIN' && Number(u.estaSuspenso) === 1,
        _count: {
          enrollments: u.enrollmentsCount,
          createdCourses: u.createdCoursesCount,
        },
      })),
    );
  } catch (erro) {
    console.error('Error fetching admin users:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar lista de utilizadores',
    });
  }
};

const atualizarAdministracaoUtilizadorCargo = async (pedido, resposta) => {
  const utilizador = await alterarUtilizadorCargo(pedido.user.id, pedido.params.id, pedido.body);

  pedido.app
    .get('io')
    ?.in('user_' + utilizador.id)
    .disconnectSockets(true);
  resposta.json({
    user: utilizador,
    message: 'Cargo atualizado. O utilizador deve iniciar sessão novamente.',
  });
};

exports.atualizarAdministracaoUtilizadorCargo = atualizarAdministracaoUtilizadorCargo;

const atualizarAdministracaoUtilizadoresPorIdSuspender = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    if (id === pedido.user.id) {
      return resposta.status(400).json({
        error: 'Não pode suspender a sua própria conta.',
      });
    }

    const destinoUtilizador = await Administracao.procurarDestinoUtilizadorPorId([id]);
    if (!destinoUtilizador)
      return resposta.status(404).json({
        error: 'Utilizador não encontrado',
      });
    if (destinoUtilizador.role === 'ADMIN') {
      return resposta.status(403).json({
        error: 'Não é permitido suspender contas de administrador.',
      });
    }

    const novoSuspended = Number(destinoUtilizador.estaSuspenso) === 1 ? 0 : 1;

    await Administracao.atualizarUtilizadoresPorEstaSuspensoAndId([novoSuspended, id]);
    pedido.app
      .get('io')
      ?.in('user_' + id)
      .disconnectSockets(true);

    return resposta.json({
      estaSuspenso: novoSuspended === 1,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao alterar estado de suspensão',
    });
  }
};

const obterAdministracaoFormadorCandidaturas = async (pedido, resposta) => {
  try {
    const candidaturas = await Administracao.listarCandidaturas();

    return resposta.json(
      candidaturas.map((aplicacao) => ({
        id: aplicacao.id,
        idUtilizador: aplicacao.idUtilizador,
        nomeCompleto: aplicacao.nomeCompleto,
        bio: aplicacao.bio,
        expertise: aplicacao.expertise,
        anosExperiencia: aplicacao.anosExperiencia,
        urlPortefolio: aplicacao.urlPortefolio,
        motivation: aplicacao.motivation,
        cursosPropostos: aplicacao.cursosPropostos,
        urlVideoExemplo: aplicacao.urlVideoExemplo,
        status: aplicacao.status,
        parecerAdministracao: aplicacao.parecerAdministracao,
        revistoEm: aplicacao.revistoEm,
        criadoEm: aplicacao.criadoEm,
        user: {
          id: aplicacao.idUtilizador,
          name: aplicacao.user_name,
          email: aplicacao.user_email,
          username: aplicacao.user_username,
          urlAvatar: aplicacao.user_avatarUrl,
          role: aplicacao.user_role,
        },
      })),
    );
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao listar candidaturas a criador',
    });
  }
};

const atualizarAdministracaoFormadorCandidaturasPorIdAprovar = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    const candidatura = await Administracao.procurarCandidaturaPorId([id]);
    if (!candidatura)
      return resposta.status(404).json({
        error: 'Candidatura não encontrada',
      });
    const agora = new Date().toISOString();

    await transacao(async () => {
      await bloquearTransacao(`creator-application:${id}`);

      const atual = await Administracao.procurarCandidaturaPorId([id]);
      if (!atual || atual.status !== 'PENDING')
        throw Object.assign(new Error('Esta candidatura já foi revista. Atualize a lista.'), {
          status: 409,
        });
      await Administracao.atualizarFormadorCandidaturasPorRevistoPorAndRevistoAtAndAtualizadoAtAndId(
        [pedido.user.id, agora, agora, id],
      );
      await Administracao.atualizarUtilizadoresPorAtualizadoAtAndId([
        agora,
        candidatura.idUtilizador,
      ]);
      await Administracao.inserirNotificacoes([
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        candidatura.idUtilizador,
        agora,
      ]);
    });

    return resposta.json({
      success: true,
      message: 'Candidatura aprovada com sucesso!',
      status: 'APPROVED',
    });
  } catch (erro) {
    return resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Falha ao aprovar candidatura',
    });
  }
};

const atualizarAdministracaoFormadorCandidaturasPorIdRejeitar = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    const { feedback: parecer } = pedido.body;
    if (typeof parecer !== 'string' || !parecer.trim() || parecer.length > 2000)
      return resposta.status(400).json({
        error: 'Escreva um feedback entre 1 e 2000 caracteres.',
      });
    const candidatura = await Administracao.procurarCandidaturaPorId([id]);
    if (!candidatura)
      return resposta.status(404).json({
        error: 'Candidatura não encontrada',
      });
    const agora = new Date().toISOString();
    const administracaoParecer =
      parecer || 'A sua candidatura não cumpre todos os critérios necessários neste momento.';

    await transacao(async () => {
      await bloquearTransacao(`creator-application:${id}`);

      const atual = await Administracao.procurarCandidaturaPorId([id]);
      if (!atual || atual.status !== 'PENDING')
        throw Object.assign(new Error('Esta candidatura já foi revista. Atualize a lista.'), {
          status: 409,
        });
      await Administracao.rejeitarFormadorCandidatura([
        administracaoParecer,
        pedido.user.id,
        agora,
        agora,
        id,
      ]);
      await Administracao.inserirNotificacoesParaLookup([
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        candidatura.idUtilizador,
        `A sua candidatura foi revista: ${administracaoParecer}`,
        agora,
      ]);
    });

    return resposta.json({
      success: true,
      message: 'Candidatura rejeitada.',
      status: 'REJECTED',
    });
  } catch (erro) {
    return resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Falha ao rejeitar candidatura',
    });
  }
};

const obterAdministracaoCursos = async (pedido, resposta) => {
  try {
    const cursos = await Administracao.pesquisar(pedido.query);

    return resposta.json(
      cursos.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        urlMiniatura: c.urlMiniatura,
        urlCapa: c.urlCapa,
        price: c.price,
        eGratuito: c.eGratuito === 1,
        estaPublicado: c.estaPublicado === 1,
        estadoAprovacao: c.estadoAprovacao || 'APPROVED',
        notasAdministracao: c.notasAdministracao,
        submetidoParaRevisaoEm: c.submetidoParaRevisaoEm,
        revistoEm: c.revistoEm,
        duracaoHoras: c.duracaoHoras,
        language: c.language,
        criadoEm: c.criadoEm,
        atualizadoEm: c.atualizadoEm,
        modulesCount: c.modulesCount || 0,
        studentsCount: c.studentsCount || 0,
        creator: {
          id: c.creator_id,
          name: c.creator_name,
          email: c.creator_email,
          urlAvatar: c.creator_avatarUrl,
        },
      })),
    );
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao listar cursos para moderação',
    });
  }
};

const atualizarAdministracaoCursosPorIdAprovar = async (pedido, resposta) => {
  try {
    resposta.json(await reverCurso(pedido.params.id, 'APPROVED', pedido.body));
  } catch (erro) {
    resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Falha ao aprovar curso.',
    });
  }
};

const atualizarAdministracaoCursosPorIdRejeitar = async (pedido, resposta) => {
  try {
    resposta.json(await reverCurso(pedido.params.id, 'REJECTED', pedido.body));
  } catch (erro) {
    resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Falha ao pedir alterações.',
    });
  }
};

exports.obterAdministracaoEstatisticas = obterAdministracaoEstatisticas;
exports.obterAdministracaoUtilizadores = obterAdministracaoUtilizadores;
exports.atualizarAdministracaoUtilizadoresPorIdSuspender =
  atualizarAdministracaoUtilizadoresPorIdSuspender;
exports.obterAdministracaoFormadorCandidaturas = obterAdministracaoFormadorCandidaturas;
exports.atualizarAdministracaoFormadorCandidaturasPorIdAprovar =
  atualizarAdministracaoFormadorCandidaturasPorIdAprovar;
exports.atualizarAdministracaoFormadorCandidaturasPorIdRejeitar =
  atualizarAdministracaoFormadorCandidaturasPorIdRejeitar;
exports.obterAdministracaoCursos = obterAdministracaoCursos;
exports.atualizarAdministracaoCursosPorIdAprovar = atualizarAdministracaoCursosPorIdAprovar;
exports.atualizarAdministracaoCursosPorIdRejeitar = atualizarAdministracaoCursosPorIdRejeitar;
