const { obterPrecoReferencia } = require('../services/coursePricing');
const { lerJsonCompativel } = require('../utils/fieldCompatibility.js');
const { randomUUID } = require('node:crypto');
const Curso = require('../models/course.js');
const { assincronoMap } = require('../utils/asyncCollections.js');
const { concluirAula } = require('../services/progress.js');
const { podeEstudarCurso } = require('../services/courseAccess.js');
const { carregarAvaliacao, publicoAvaliacao } = require('../services/reviews.js');
const { transacao, bloquearTransacao } = require('../database/connection.js');
const resolverCursoAcessoEstado = ({
  user: utilizador,
  course: curso,
  enrollmentRow: inscricaoRegisto,
  isCollaborator: isColaborador = false,
}) => {
  const isFormador = Boolean(
    utilizador &&
    curso &&
    (utilizador.role === 'ADMIN' ||
      utilizador.id === curso.idFormador ||
      utilizador.id === curso.creator_id ||
      isColaborador),
  );
  const utilizadorInscricao = inscricaoRegisto || null;

  return {
    isCreator: isFormador,
    isEnrolled: Boolean(utilizadorInscricao),
    canAccess: isFormador || Boolean(utilizadorInscricao),
    userEnrollment: utilizadorInscricao,
    userProgress: utilizadorInscricao ? (utilizadorInscricao.percentagemProgresso ?? 0) : 0,
  };
};

const obterCursoMeusAprendizagem = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const registos = await Curso.listarInscricoesPorUtilizadorId([utilizadorId]);
    const formatted = await assincronoMap(registos, async (r) => {
      const cursoId = r.course_id;
      const isFormador = r.idFormador === utilizadorId;
      const inscricaoId = r.enrollment_id;
      const progressoPercentagem =
        r.percentagemProgresso !== null && r.percentagemProgresso !== undefined
          ? r.percentagemProgresso
          : 0;
      const modulos = await Curso.listarModulosPorCursoId([cursoId]);
      const modulosComAulas = await assincronoMap(modulos, async (m) => {
        const aulas = await Curso.listarAulasPorModuloId([m.id]);

        return {
          ...m,
          lessons: aulas,
        };
      });
      const aulaProgresses = (await Curso.listarAulaProgressoPorInscricaoId([inscricaoId])).map(
        (lp) => ({
          ...lp,
          isCompleted: Boolean(lp.completed),
        }),
      );

      return {
        id: inscricaoId,
        idUtilizador: utilizadorId,
        idCurso: cursoId,
        inscritoEm: r.inscritoEm,
        concluidoEm: r.concluidoEm,
        percentagemProgresso: progressoPercentagem,
        idUltimaAula: r.idUltimaAula,
        estaOculto: r.estaOculto === 1,
        isCreator: isFormador,
        course: {
          id: r.course_id,
          title: r.title,
          slug: r.slug,
          description: r.description,
          category: r.category,
          difficulty: r.difficulty,
          urlMiniatura: r.urlMiniatura,
          urlCapa: r.urlCapa,
          price: r.price,
          eGratuito: r.eGratuito === 1,
          duracaoHoras: r.duracaoHoras,
          language: r.language,
          creator: {
            id: r.creator_id,
            name: r.creator_name,
            username: r.creator_username,
            urlAvatar: r.creator_avatarUrl,
          },
          modules: modulosComAulas,
        },
        lessonProgresses: aulaProgresses,
      };
    });

    return resposta.json(formatted);
  } catch (erro) {
    console.error('Failed to fetch my-learning:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar cursos inscritos',
    });
  }
};

const enviarCursoPorCursoIdAlternarOcultar = async (pedido, resposta) => {
  try {
    const { idCurso: cursoId } = pedido.params;
    const utilizadorId = pedido.user.id;
    const inscricao = await Curso.procurarInscricaoPorUtilizadorIdAndCursoIdAndSlug([
      utilizadorId,
      cursoId,
      cursoId,
    ]);
    if (!inscricao) {
      return resposta.status(404).json({
        error: 'Inscrição não encontrada',
      });
    }

    const seguinteOculto = inscricao.estaOculto === 1 ? 0 : 1;

    await Curso.atualizarInscricoesPorIsOcultoAndId([seguinteOculto, inscricao.id]);

    return resposta.json({
      success: true,
      estaOculto: seguinteOculto === 1,
      idCurso: inscricao.idCurso,
    });
  } catch (erro) {
    console.error('Failed to toggle hide course:', erro);

    return resposta.status(500).json({
      error: 'Falha ao alterar visibilidade do curso',
    });
  }
};

const obterCurso = async (pedido, resposta) => {
  try {
    const registos = await Curso.pesquisar(pedido.query);
    const cursosComEstatisticas = await assincronoMap(registos, async (curso) => {
      let utilizadorInscricao = null;
      let isFormador = false;
      if (pedido.user) {
        utilizadorInscricao = await Curso.procurarInscricoesPorUtilizadorIdAndCursoId([
          pedido.user.id,
          curso.id,
        ]);
        isFormador = curso.idFormador === pedido.user.id;
      }

      const isEnrolled = Boolean(utilizadorInscricao);
      const utilizadorProgresso = utilizadorInscricao
        ? utilizadorInscricao.percentagemProgresso
        : 0;

      return {
        id: curso.id,
        title: curso.title,
        name: curso.title,
        slug: curso.slug,
        description: curso.description,
        category: curso.category,
        difficulty: curso.difficulty,
        urlMiniatura: curso.urlMiniatura,
        urlCapa: curso.urlCapa || curso.urlMiniatura,
        thumbnailPosition: curso.thumbnailPosition,
        posicaoCapa: curso.posicaoCapa,
        price: curso.price,
        precoReferencia: await obterPrecoReferencia(curso.id),
        eGratuito: curso.eGratuito === 1 || curso.price === 0,
        featured: curso.featured === 1,
        duracaoHoras: curso.duracaoHoras,
        language: curso.language,
        creator: {
          id: curso.creator_id,
          name: curso.creator_name,
          username: curso.creator_username,
          urlAvatar: curso.creator_avatarUrl,
        },
        owner: {
          id: curso.creator_id,
          name: curso.creator_name,
          username: curso.creator_username,
          urlAvatar: curso.creator_avatarUrl,
        },
        studentsCount: curso.studentsCount,
        membersCount: curso.studentsCount,
        reviewsCount: curso.reviewsCount || 0,
        modulesCount: curso.modulesCount,
        channelsCount: curso.channelsCount || 0,
        hasCommunity: Boolean(curso.idEspaco),
        idEspaco: curso.idEspaco,
        averageRating: curso.averageRating > 0 ? curso.averageRating : null,
        isEnrolled,
        isMember: isEnrolled,
        isCreator: isFormador,
        userProgress: utilizadorProgresso,
      };
    });

    return resposta.json(cursosComEstatisticas);
  } catch (erro) {
    console.error('Failed to load courses:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar catálogo de cursos',
    });
  }
};

const obterCursoPorId = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    let curso = await Curso.contarCursoPorIdAndSlugAndEspacoId([id, id, id, id, id]);
    let resolvedEspacoRegisto = null;
    if (!curso) {
      resolvedEspacoRegisto = await Curso.procurarEspacosPorIdAndSlug([id, id, id, id]);
      if (resolvedEspacoRegisto) {
        const associadoCurso = await Curso.contarAssociadoCursoPorEspacoIdAndId([
          resolvedEspacoRegisto.id,
          resolvedEspacoRegisto.id,
        ]);
        if (associadoCurso) {
          curso = associadoCurso;
        } else {
          curso = {
            id: resolvedEspacoRegisto.id,
            title: resolvedEspacoRegisto.name,
            slug: resolvedEspacoRegisto.slug,
            description: resolvedEspacoRegisto.description,
            category: resolvedEspacoRegisto.category || 'Geral',
            difficulty: 'Iniciante',
            urlMiniatura: resolvedEspacoRegisto.urlIcone || resolvedEspacoRegisto.urlCapa,
            urlCapa: resolvedEspacoRegisto.urlCapa,
            price: 0,
            eGratuito: 1,
            duracaoHoras: 10,
            language: 'Português',
            idFormador: resolvedEspacoRegisto.owner_id,
            creator_id: resolvedEspacoRegisto.owner_id,
            creator_name: resolvedEspacoRegisto.owner_name,
            creator_username: resolvedEspacoRegisto.owner_username,
            creator_avatarUrl: resolvedEspacoRegisto.owner_avatarUrl,
            creator_bio: resolvedEspacoRegisto.owner_bio,
            studentsCount: resolvedEspacoRegisto.totalMembros || 1,
            idEspaco: resolvedEspacoRegisto.id,
          };
        }
      }
    }

    if (!curso) {
      return resposta.status(404).json({
        error: 'Curso não encontrado',
      });
    }

    const isCollab = Boolean(
      pedido.user &&
      (await Curso.procurarCursoColaboradoresPorCursoIdAndUtilizadorId([curso.id, pedido.user.id])),
    );
    const podeReverPendenteCurso =
      pedido.user &&
      (pedido.user.role === 'ADMIN' ||
        pedido.user.id === curso.idFormador ||
        pedido.user.id === curso.creator_id ||
        isCollab);
    if (
      curso.estadoAprovacao &&
      curso.estadoAprovacao !== 'APPROVED' &&
      !podeReverPendenteCurso &&
      !(await podeEstudarCurso(pedido.user, curso))
    ) {
      return resposta.status(403).json({
        error:
          'Este curso está atualmente a aguardar validação e aprovação pela administração NEXO.',
      });
    }

    const modulos = await Curso.listarModulosPorCursoIdParaObterCursoPorId([curso.id]);
    let modulosComAulas = await assincronoMap(modulos, async (m) => {
      const aulas = await Curso.listarAulasPorModuloIdParaAulas([m.id]);
      const formattedAulas = await assincronoMap(aulas, async (l) => {
        let questionarioObj = null;
        let cleanConteudo = l.content || '';
        let richArticleObj = null;
        if (l.type === 'quiz') {
          if (l.content) {
            try {
              const parsed = lerJsonCompativel(l.content);
              if (parsed && (Array.isArray(parsed.questions) || parsed.title)) {
                questionarioObj = parsed;
                cleanConteudo =
                  parsed.description ||
                  'Responda às questões para validar a sua compreensão da matéria.';
              }
            } catch (_) {}
          }

          if (!questionarioObj && l.quiz_id) {
            const perguntas = await Curso.listarPerguntasPorQuestionarioId([l.quiz_id]);

            questionarioObj = {
              id: l.quiz_id,
              title: l.quiz_title,
              recompensaExperiencia: l.quiz_xpReward,
              questions: perguntas.map((q) => {
                let parsedOpcoes;
                try {
                  parsedOpcoes =
                    typeof q.options === 'string' ? lerJsonCompativel(q.options) : q.options;
                } catch (_) {
                  parsedOpcoes = [];
                }

                const formattedOpcoes = Array.isArray(parsedOpcoes)
                  ? parsedOpcoes.map((opt, idx) => ({
                      id: `opt-${q.id}-${idx}`,
                      text: typeof opt === 'string' ? opt : opt.text,
                      isCorrect: idx === q.indiceOpcaoCorreta,
                    }))
                  : [];

                return {
                  id: q.id,
                  question: q.question,
                  options: formattedOpcoes,
                  explanation: q.explanation,
                  points: 10,
                  type: 'single',
                };
              }),
            };
            if (!cleanConteudo || cleanConteudo.trim().startsWith('{')) {
              cleanConteudo =
                'Responda às questões práticas para testar os seus conhecimentos desta aula.';
            }
          }
        } else if (l.type === 'text' || l.type === 'article') {
          if (l.content && l.content.trim().startsWith('{')) {
            try {
              const parsed = lerJsonCompativel(l.content);
              if (parsed && (parsed.markdown || parsed.checklist || parsed.calloutText)) {
                richArticleObj = parsed;
                cleanConteudo = parsed.markdown || '';
              }
            } catch (_) {}
          }
        }

        return {
          id: l.id,
          title: l.title,
          type: l.type,
          duracaoMinutos: l.duracaoMinutos,
          indiceOrdem: l.indiceOrdem,
          recompensaExperiencia: l.recompensaExperiencia,
          urlVideo: l.urlVideo,
          content: cleanConteudo,
          quiz: questionarioObj,
          richArticle: richArticleObj,
        };
      });

      return {
        ...m,
        lessons: formattedAulas,
      };
    });
    let espaco = null;
    let destinoEspacoId =
      curso.idEspaco || (resolvedEspacoRegisto ? resolvedEspacoRegisto.id : null);

    // Cada curso mantém uma comunidade própria, sem partilhar canais com outros cursos.
    let isSharedEspaco = false;
    if (destinoEspacoId) {
      const outroCursoComMesmoEspaco = await Curso.procurarOutroCursoComMesmoEspacoPorEspacoId([
        destinoEspacoId,
        curso.id,
      ]);
      if (outroCursoComMesmoEspaco) {
        isSharedEspaco = true;
      }
    }

    if (destinoEspacoId && !isSharedEspaco) {
      const espacoRegisto = await Curso.procurarEspacoRegistoPorId([destinoEspacoId]);
      if (espacoRegisto) {
        let canais = await Curso.listarCanaisPorEspacoId([espacoRegisto.id]);
        const membros = await Curso.listarMembrosPorEspacoId([espacoRegisto.id]);

        espaco = {
          ...espacoRegisto,
          channels: canais,
          members: membros.map((m) => ({
            ...m,
            user: {
              id: m.idUtilizador,
              name: m.name,
              username: m.username,
              urlAvatar: m.urlAvatar,
              role: m.role,
            },
          })),
        };
      }
    }

    let utilizadorInscricao = null;
    if (pedido.user) {
      let inscricaoRegisto = await Curso.procurarInscricaoRegistoPorUtilizadorIdAndCursoId([
        pedido.user.id,
        curso.id,
      ]);
      if (inscricaoRegisto) {
        const progresses = (
          await Curso.listarAulaProgressoPorInscricaoIdParaObterCursoPorId([inscricaoRegisto.id])
        ).map((lp) => ({
          ...lp,
          isCompleted: Boolean(lp.completed),
        }));

        utilizadorInscricao = {
          ...inscricaoRegisto,
          lessonProgresses: progresses,
        };
      }
    }

    const isColaborador = Boolean(
      pedido.user &&
      (await Curso.procurarCursoColaboradoresPorCursoIdAndUtilizadorId([curso.id, pedido.user.id])),
    );
    const acessoEstado = resolverCursoAcessoEstado({
      user: pedido.user,
      course: curso,
      enrollmentRow: utilizadorInscricao,
      isCollaborator: isColaborador,
    });
    const colegas = await Curso.listarColegasPorCursoIdAndEspacoId([
      curso.id,
      destinoEspacoId || '',
      curso.idFormador || '',
    ]);
    let avaliacoesListar = [];
    try {
      const avaliacoesRegistos = await Curso.listarAvaliacoesRegistosPorCursoId([curso.id]);

      avaliacoesListar = avaliacoesRegistos.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        criadoEm: r.criadoEm,
        user: {
          name: r.user_name,
          username: r.user_username,
          urlAvatar: r.user_avatarUrl,
        },
      }));
    } catch (_) {}

    const avgClassificacao =
      avaliacoesListar.length > 0
        ? (
            avaliacoesListar.reduce((acc, r) => acc + r.rating, 0) / avaliacoesListar.length
          ).toFixed(1)
        : null;
    let parsedOutcomes = [];
    try {
      parsedOutcomes = curso.learningOutcomes
        ? typeof curso.learningOutcomes === 'string'
          ? lerJsonCompativel(curso.learningOutcomes)
          : curso.learningOutcomes
        : [];
    } catch (_) {
      parsedOutcomes = curso.learningOutcomes ? [curso.learningOutcomes] : [];
    }

    let parsedRequisitos = [];
    try {
      parsedRequisitos = curso.requirements
        ? typeof curso.requirements === 'string'
          ? lerJsonCompativel(curso.requirements)
          : curso.requirements
        : [];
    } catch (_) {
      parsedRequisitos = curso.requirements ? [curso.requirements] : [];
    }

    let parsedDocumentos = [];
    try {
      parsedDocumentos = curso.documents
        ? typeof curso.documents === 'string'
          ? lerJsonCompativel(curso.documents)
          : curso.documents
        : [];
    } catch (_) {
      parsedDocumentos = [];
    }

    return resposta.json({
      id: curso.id,
      title: curso.title,
      slug: curso.slug,
      idEspaco: espaco?.id || null,
      hasCommunity: Boolean(espaco),
      atualizadoEm: podeReverPendenteCurso ? curso.atualizadoEm : undefined,
      estadoAprovacao: podeReverPendenteCurso ? curso.estadoAprovacao : undefined,
      description: curso.description,
      category: curso.category,
      difficulty: curso.difficulty,
      urlMiniatura: curso.urlMiniatura,
      urlCapa: curso.urlCapa,
      price: curso.price,
      precoReferencia: await obterPrecoReferencia(curso.id),
      eGratuito: curso.eGratuito === 1,
      duracaoHoras: curso.duracaoHoras,
      language: curso.language,
      learningOutcomes: parsedOutcomes,
      requirements: parsedRequisitos,
      documents: acessoEstado.canAccess ? parsedDocumentos : [],
      creator: {
        id: curso.creator_id,
        name: curso.creator_name,
        username: curso.creator_username,
        urlAvatar: curso.creator_avatarUrl,
        bio: curso.creator_bio,
      },
      space: acessoEstado.canAccess
        ? espaco
        : espaco
          ? {
              ...espaco,
              channels: [],
              members: [],
            }
          : null,
      modules: await assincronoMap(modulosComAulas, async (modulo) => ({
        ...modulo,
        lessons: await assincronoMap(modulo.lessons, async (aula) => {
          if (!(await podeEstudarCurso(pedido.user, curso)))
            return {
              id: aula.id,
              title: aula.title,
              type: aula.type,
              duracaoMinutos: aula.duracaoMinutos,
              indiceOrdem: aula.indiceOrdem,
            };
          if (aula.type === 'quiz') {
            const questionario = publicoAvaliacao(await carregarAvaliacao(aula.id));

            return {
              ...aula,
              content: questionario?.description || '',
              quiz: questionario,
            };
          }

          return aula;
        }),
      })),
      studentsCount: curso.studentsCount,
      reviews: avaliacoesListar,
      reviewsCount: avaliacoesListar.length,
      averageRating: avgClassificacao,
      userEnrollment: utilizadorInscricao,
      certificate: pedido.user
        ? (await Curso.procurarCertificadoPorUtilizadorAndCurso([pedido.user.id, curso.id])) || null
        : null,
      isEnrolled: acessoEstado.isEnrolled,
      isCreator: acessoEstado.isCreator,
      userProgress: acessoEstado.userProgress,
      classmates: acessoEstado.canAccess ? colegas : [],
    });
  } catch (erro) {
    console.error('Curso details error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar detalhes do curso',
    });
  }
};

const obterCursoPorIdColegas = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    const curso = await Curso.procurarCursoPorIdAndSlug([id, id]);
    if (!curso)
      return resposta.status(404).json({
        error: 'Curso não encontrado',
      });
    if (!(await podeEstudarCurso(pedido.user, curso)))
      return resposta.status(403).json({
        error: 'Sem acesso à turma.',
      });
    const colegas = await Curso.listarColegasPorCursoIdAndEspacoIdParaObterCursoPorIdColegas([
      curso.id,
      curso.idEspaco || '',
      curso.id,
      curso.idFormador || '',
    ]);

    return resposta.json(colegas);
  } catch (erro) {
    console.error('Failed to load classmates:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar colegas de turma',
    });
  }
};

const enviarCursoPorIdInscrever = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    const utilizadorId = pedido.user.id;
    const agora = new Date().toISOString();
    const curso = await Curso.procurarCursoPorIdAndSlugAndEspacoId([id, id, id, id, id]);
    if (!curso) {
      return resposta.status(404).json({
        error: 'Curso não encontrado',
      });
    }

    if (
      (curso.estaPublicado !== 1 ||
        (curso.estadoAprovacao && curso.estadoAprovacao !== 'APPROVED')) &&
      pedido.user.role !== 'ADMIN' &&
      pedido.user.id !== curso.idFormador
    ) {
      return resposta.status(403).json({
        error: 'Este curso não se encontra disponível para inscrição de momento.',
      });
    }

    if (
      curso.eGratuito !== 1 &&
      Number(curso.price) > 0 &&
      !(await podeEstudarCurso(pedido.user, curso))
    )
      return resposta.status(409).json({
        error: 'Confirme o pagamento para obter acesso a este curso.',
        code: 'PAYMENT_REQUIRED',
      });
    const existente = await Curso.procurarInscricaoRegistoPorUtilizadorIdAndCursoId([
      utilizadorId,
      curso.id,
    ]);
    if (existente) {
      return resposta.json({
        message: 'Já inscrito',
        enrollment: existente,
      });
    }

    const inscricaoId = `enr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const guardadoInscricaoId = await transacao(async () => {
      await bloquearTransacao(`enrollment:${utilizadorId}:${curso.id}`);

      const concurrent = await Curso.procurarInscricaoRegistoPorUtilizadorIdAndCursoId([
        utilizadorId,
        curso.id,
      ]);
      if (concurrent) return concurrent.id;
      await Curso.inserirInscricoes([inscricaoId, utilizadorId, curso.id, agora]);
      if (curso.idEspaco) {
        const memExists = await Curso.procurarMemExistsPorUtilizadorIdAndEspacoId([
          utilizadorId,
          curso.idEspaco,
        ]);
        if (!memExists) {
          await Curso.inserirAdesoes([`mem-${randomUUID()}`, utilizadorId, curso.idEspaco, agora]);
        }
      }

      await Curso.inserirNotificacoes([
        `notif-${randomUUID()}`,
        utilizadorId,
        `Inscrição Confirmada: ${curso.title}`,
        `A sua inscrição foi efetuada com sucesso! Aceda à sala de aula para iniciar o Módulo 1.`,
        `/aprender/${curso.id}`,
        agora,
      ]);

      return inscricaoId;
    });
    const novoInscricao = await Curso.procurarNovoInscricaoPorId([guardadoInscricaoId]);

    return resposta.status(guardadoInscricaoId === inscricaoId ? 201 : 200).json({
      message: 'Inscrição realizada com sucesso',
      enrollment: novoInscricao,
    });
  } catch (erro) {
    console.error('Enrollment error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao inscrever no curso',
    });
  }
};

const enviarCursoPorIdAulasPorAulaIdConcluir = async (pedido, resposta) => {
  try {
    return resposta.json(await concluirAula(pedido.user, pedido.params.id, pedido.params.idAula));
  } catch (erro) {
    return resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Não foi possível concluir a aula.',
    });
  }
};

const enviarCursoPorCursoIdAvaliacoes = async (pedido, resposta) => {
  try {
    const { idCurso: cursoId } = pedido.params;
    const { rating: classificacao, comment: comentario } = pedido.body;
    const utilizadorId = pedido.user.id;
    if (!Number.isInteger(classificacao) || classificacao < 1 || classificacao > 5) {
      return resposta.status(400).json({
        error: 'Classificação inválida (1 a 5 estrelas)',
      });
    }

    if (typeof comentario !== 'string' || !comentario.trim() || comentario.length > 2000) {
      return resposta.status(400).json({
        error: 'O comentário da avaliação é obrigatório',
      });
    }

    const curso = await Curso.procurarCursoPorIdAndSlugParaEnviarCursoPorCursoIdAvaliacoes([
      cursoId,
      cursoId,
    ]);
    if (!curso) {
      return resposta.status(404).json({
        error: 'Curso não encontrado',
      });
    }

    const isEnrolledOrProprietario =
      pedido.user.role === 'ADMIN' ||
      pedido.user.id === curso.idFormador ||
      Boolean(
        await Curso.procurarInscricoesPorUtilizadorIdAndCursoIdParaEnviarCursoPorCursoIdAvaliacoes([
          utilizadorId,
          curso.id,
        ]),
      );
    if (!isEnrolledOrProprietario) {
      return resposta.status(403).json({
        error: 'Apenas estudantes inscritos podem avaliar este curso',
      });
    }

    const agora = new Date().toISOString();
    const existenteRever = await Curso.procurarExistenteReverPorCursoIdAndUtilizadorId([
      curso.id,
      utilizadorId,
    ]);
    if (existenteRever) {
      await Curso.atualizarAvaliacoesPorClassificacaoAndComentarioAndId([
        Number(classificacao),
        comentario.trim(),
        existenteRever.id,
      ]);

      return resposta.json({
        message: 'Avaliação atualizada com sucesso',
        review: {
          id: existenteRever.id,
          rating: Number(classificacao),
          comment: comentario.trim(),
          criadoEm: agora,
        },
      });
    }

    const revId = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    await Curso.inserirAvaliacoes([
      revId,
      curso.id,
      utilizadorId,
      Number(classificacao),
      comentario.trim(),
      agora,
    ]);

    return resposta.status(201).json({
      message: 'Avaliação publicada com sucesso',
      review: {
        id: revId,
        rating: Number(classificacao),
        comment: comentario.trim(),
        criadoEm: agora,
      },
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao guardar avaliação',
    });
  }
};

exports.resolverCursoAcessoEstado = resolverCursoAcessoEstado;
exports.obterCursoMeusAprendizagem = obterCursoMeusAprendizagem;
exports.enviarCursoPorCursoIdAlternarOcultar = enviarCursoPorCursoIdAlternarOcultar;
exports.obterCurso = obterCurso;
exports.obterCursoPorId = obterCursoPorId;
exports.obterCursoPorIdColegas = obterCursoPorIdColegas;
exports.enviarCursoPorIdInscrever = enviarCursoPorIdInscrever;
exports.enviarCursoPorIdAulasPorAulaIdConcluir = enviarCursoPorIdAulasPorAulaIdConcluir;
exports.enviarCursoPorCursoIdAvaliacoes = enviarCursoPorCursoIdAvaliacoes;
