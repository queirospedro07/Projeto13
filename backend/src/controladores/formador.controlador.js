const { guardarPrecoReferencia, obterPrecoReferencia } = require('../servicos/precosCurso');
const { lerJsonCompativel } = require('../utilitarios/compatibilidadeCampos.js');
const { submeterCurso, verificarVersao } = require('../servicos/publicacaoCurso');
const Formador = require('../modelos/Formador.js');
const { assincronoParaCada } = require('../utilitarios/colecoesAssincronas.js');
const { podeGerirCurso } = require('../servicos/acessoCurso.js');
const { randomUUID } = require('node:crypto');
const { transacao, bloquearTransacao } = require('../base-dados/ligacao.js');
const { garantirCursoCommunity } = require('../servicos/comunidadeCurso');
const obterFormadorCandidaturaEstado = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const candidatura = await Formador.procurarCandidaturaPorUtilizadorId([utilizadorId]);

    return resposta.json({
      role: pedido.user.role,
      hasApplication: !!candidatura,
      application: candidatura || null,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao obter estado da candidatura',
    });
  }
};

const enviarFormadorCandidatar = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    if (pedido.user.role === 'CREATOR' || pedido.user.role === 'ADMIN') {
      return resposta.status(400).json({
        error: 'A sua conta já tem estatuto de Formador ou Administrador.',
      });
    }

    const existentePendente = await Formador.procurarExistentePendentePorUtilizadorId([
      utilizadorId,
    ]);
    if (existentePendente) {
      return resposta.status(400).json({
        error: 'Já tem uma candidatura pendente em análise pela administração.',
      });
    }

    const {
      nomeCompleto: completoNome,
      bio: biografia,
      expertise: especialidade,
      anosExperiencia: experienciaYears,
      urlPortefolio: portefolioUrl,
      motivation: motivacao,
      cursosPropostos: propostosCursos,
      urlVideoExemplo,
    } = pedido.body;
    if (!completoNome || !especialidade || !motivacao || !propostosCursos) {
      return resposta.status(400).json({
        error: 'Nome completo, especialização, motivação e proposta de cursos são obrigatórios.',
      });
    }

    if (
      [
        completoNome,
        biografia,
        especialidade,
        portefolioUrl,
        motivacao,
        propostosCursos,
        urlVideoExemplo,
      ].some(
        (valor) => valor !== undefined && (typeof valor !== 'string' || valor.length > 10000),
      ) ||
      (experienciaYears !== undefined &&
        (!Number.isFinite(Number(experienciaYears)) ||
          Number(experienciaYears) < 0 ||
          Number(experienciaYears) > 100))
    )
      return resposta.status(400).json({
        error: 'Dados da candidatura inválidos.',
      });
    const aplicacaoId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const agora = new Date().toISOString();

    await Formador.inserirFormadorCandidaturas([
      aplicacaoId,
      utilizadorId,
      completoNome.trim(),
      biografia?.trim() || '',
      especialidade.trim(),
      Number(experienciaYears) || 0,
      portefolioUrl?.trim() || '',
      motivacao.trim(),
      propostosCursos.trim(),
      urlVideoExemplo?.trim() || '',
      agora,
      agora,
    ]);

    // Notificar administradores
    const administradores = await Formador.listarAdministradores();
    for (const administracao of administradores) {
      await Formador.inserirNotificacoes([
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        administracao.id,
        `${completoNome} submeteu um inquérito de candidatura para lecionar no NEXO.`,
        agora,
      ]);
    }

    const candidatura = await Formador.procurarCandidaturaPorId([aplicacaoId]);

    return resposta.status(201).json({
      message: 'Candidatura submetida com sucesso! A aguardar revisão do Administrador.',
      application: candidatura,
    });
  } catch (erro) {
    console.error('Error submitting creator application:', erro);

    return resposta.status(500).json({
      error: 'Falha ao submeter candidatura a criador',
    });
  }
};

const obterFormadorEstatisticas = async (pedido, resposta) => {
  try {
    const formadorId = pedido.user.id;
    const cursos = await Formador.contarCursosPorFormadorId([formadorId, formadorId]);
    const totalAlunos = cursos.reduce((acc, c) => acc + (c.studentsCount || 0), 0);
    const revenue = await Formador.somarAprovadoRevenuePorFormadorId([formadorId]);
    const totalRevenueCents = Number(revenue.totalRevenueCents);
    const totalRevenue = totalRevenueCents / 100;
    const recentesInscricoes = await Formador.listarRecentesInscricoesPorFormadorId([
      formadorId,
      formadorId,
    ]);
    const concluidoInscricoes =
      (await Formador.contarInscricoesPorFormadorId([formadorId, formadorId]))?.c || 0;
    const conclusaoRate =
      totalAlunos > 0 ? Math.round((concluidoInscricoes / totalAlunos) * 100) : 0;
    const classificacaoRegisto = await Formador.procurarClassificacaoRegistoPorFormadorId([
      formadorId,
    ]);
    const averageClassificacao = classificacaoRegisto?.avgRating
      ? Number(classificacaoRegisto.avgRating).toFixed(1)
      : '0.0';
    const questionarioRegisto = await Formador.procurarQuestionarioRegistoPorFormadorId([
      formadorId,
    ]);
    const averageQuestionarioPontuacao = questionarioRegisto?.avgScore
      ? Math.round(Number(questionarioRegisto.avgScore))
      : 0;

    return resposta.json({
      totalRevenue,
      totalRevenueCents,
      totalStudents: totalAlunos || 0,
      completionRate: conclusaoRate,
      averageRating: averageClassificacao,
      averageQuizScore: averageQuestionarioPontuacao,
      coursesCount: cursos.length,
      revenueData: [],
      recentEnrollments: recentesInscricoes.map((evento) => ({
        id: evento.id,
        inscritoEm: evento.inscritoEm,
        course: {
          title: evento.course_title,
        },
        user: {
          id: evento.user_id,
          name: evento.name,
          username: evento.username,
          urlAvatar: evento.urlAvatar,
          email: evento.email,
        },
      })),
    });
  } catch (erro) {
    console.error('Formador stats error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar estatísticas do criador',
    });
  }
};

const obterFormadorCursosPorCursoId = async (pedido, resposta) => {
  try {
    const { idCurso: cursoId } = pedido.params;
    const formadorId = pedido.user.id;
    const curso = await Formador.contarCursoPorIdAndFormadorIdAndIdUtilizador([
      cursoId,
      formadorId,
      pedido.user.role,
      formadorId,
    ]);
    if (!curso)
      return resposta.status(404).json({
        error: 'Curso não encontrado ou sem permissão',
      });
    const modulos = await Formador.listarModulosPorCursoId([cursoId]);
    for (const mod of modulos) {
      mod.lessons = await Formador.listarAulasPorModuloId([mod.id]);
      for (const les of mod.lessons) {
        if (
          typeof les.content === 'string' &&
          (les.content.startsWith('{') || les.content.startsWith('['))
        ) {
          try {
            const parsed = lerJsonCompativel(les.content);
            if (les.type === 'quiz') les.quiz = parsed;
            else if (les.type === 'article' || les.type === 'text') les.richArticle = parsed;
            else les.customData = parsed;
          } catch {}
        }

        if (les.type === 'quiz' && !les.quiz) {
          const q = await Formador.procurarQPorAulaId([les.id]);
          if (q) {
            const perguntas = await Formador.listarPerguntasPorQuestionarioId([q.id]);

            q.questions = perguntas.map((qq) => ({
              ...qq,
              options: (() => {
                try {
                  return typeof qq.options === 'string'
                    ? lerJsonCompativel(qq.options)
                    : qq.options || [];
                } catch (_) {
                  return [];
                }
              })(),
            }));
            les.quiz = q;
          }
        }
      }
    }

    const espacoId = curso.idEspaco;
    const canais = espacoId ? await Formador.listarCanaisPorEspacoId([espacoId]) : [];
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
      ...curso,
      precoReferencia: await obterPrecoReferencia(curso.id),
      hasCommunity: Boolean(curso.idEspaco),
      learningOutcomes: parsedOutcomes,
      requirements: parsedRequisitos,
      documents: parsedDocumentos,
      eGratuito: curso.eGratuito === 1,
      estaPublicado: curso.estaPublicado === 1,
      permitirPartilhaEcraAluno: curso.permitirPartilhaEcraAluno === 1,
      permitirCamaraAluno: curso.permitirCamaraAluno === 1,
      modules: modulos,
      channels: canais,
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao carregar curso',
    });
  }
};

const atualizarFormadorCursosPorCursoId = async (pedido, resposta) => {
  try {
    const { idCurso: cursoId } = pedido.params;
    const formadorId = pedido.user.id;
    let pertencente = null;
    if (pedido.user.role !== 'ADMIN') {
      pertencente = await Formador.procurarCursosPorIdAndFormadorIdAndIdCursoAndIdUtilizador([
        cursoId,
        formadorId,
        cursoId,
        formadorId,
      ]);
      if (!pertencente)
        return resposta.status(403).json({
          error: 'Sem permissão para editar este curso',
        });
    } else {
      pertencente = await Formador.procurarCursosPorId([cursoId]);
      if (!pertencente)
        return resposta.status(404).json({
          error: 'Curso não encontrado',
        });
    }

    const {
      title: titulo,
      description: descricao,
      category: categoria,
      difficulty: dificuldade,
      language,
      price: preco,
      eGratuito: isGratuito,
      urlMiniatura: miniaturaUrl,
      thumbnailPosition: miniaturaPosicao,
      urlCapa: capaUrl,
      posicaoCapa: capaPosicao,
      duracaoHoras: duracaoHoras,
      modoChamadaPredefinido: defaultChamadaModo,
      permitirPartilhaEcraAluno: allowAlunoEcraPartilhar,
      permitirCamaraAluno: allowAlunoCamara,
      learningOutcomes: aprendizagemOutcomes,
      requirements: requisitos,
      documents: documentos,
      modules: modulos,
      channels: canais,
    } = pedido.body;
    const agora = new Date().toISOString();
    const outcomesStr =
      aprendizagemOutcomes !== undefined
        ? typeof aprendizagemOutcomes === 'string'
          ? aprendizagemOutcomes
          : JSON.stringify(aprendizagemOutcomes)
        : null;
    const requisitosStr =
      requisitos !== undefined
        ? typeof requisitos === 'string'
          ? requisitos
          : JSON.stringify(requisitos)
        : null;
    const documentosStr =
      documentos !== undefined
        ? typeof documentos === 'string'
          ? documentos
          : JSON.stringify(documentos)
        : null;
    const seguroIsPublicado = 0;

    await transacao(async () => {
      await bloquearTransacao(`course-community:${cursoId}`);

      const atual = await Formador.procurarCursosPorId([cursoId]);
      if (!atual)
        throw Object.assign(new Error('Curso não encontrado.'), {
          status: 404,
        });
      verificarVersao(atual, pedido.body.atualizadoEmEsperado);
      pertencente = atual;

      // Limpar a referência antes de alterar o preço para respeitar a restrição do esquema.
      const referenciaAnterior = await obterPrecoReferencia(cursoId);

      await guardarPrecoReferencia(cursoId, { precoReferencia: null }, 0, false);
      await Formador.atualizarCursoDetalhes(false, [
        titulo && titulo.trim() ? titulo.trim() : null,
        descricao !== undefined ? descricao.trim() : null,
        categoria && categoria.trim() ? categoria.trim() : null,
        dificuldade && dificuldade.trim() ? dificuldade.trim() : null,
        language && language.trim() ? language.trim() : null,
        (isGratuito ?? pertencente.eGratuito) ? 0 : Number(preco ?? pertencente.price),
        (isGratuito ?? pertencente.eGratuito) ? 1 : 0,
        seguroIsPublicado,
        miniaturaUrl !== undefined ? miniaturaUrl : null,
        miniaturaPosicao || null,
        capaUrl !== undefined ? capaUrl : null,
        capaPosicao || null,
        duracaoHoras !== undefined ? Number(duracaoHoras) : pertencente.duracaoHoras,
        defaultChamadaModo || pertencente.modoChamadaPredefinido || 'open',
        allowAlunoEcraPartilhar !== undefined
          ? allowAlunoEcraPartilhar
            ? 1
            : 0
          : pertencente.permitirPartilhaEcraAluno,
        allowAlunoCamara !== undefined
          ? allowAlunoCamara
            ? 1
            : 0
          : pertencente.permitirCamaraAluno,
        outcomesStr,
        requisitosStr,
        documentosStr,
        agora,
        cursoId,
      ]);
      await guardarPrecoReferencia(
        cursoId,
        {
          precoReferencia:
            pedido.body.precoReferencia === undefined
              ? referenciaAnterior
              : pedido.body.precoReferencia,
        },
        preco ?? pertencente.price,
        Boolean(isGratuito ?? pertencente.eGratuito),
      );
      if (
        !pertencente.idEspaco &&
        pedido.body.hasCommunity !== false &&
        (pedido.body.hasCommunity === true || (Array.isArray(canais) && canais.length > 0))
      ) {
        pertencente.idEspaco = await garantirCursoCommunity(pedido.user, cursoId);
      }

      if (pertencente?.idEspaco && titulo) {
        await Formador.atualizarEspacosPorNomeAndDescricaoAndId([
          titulo.trim(),
          descricao || '',
          pertencente.idEspaco,
        ]);
      }

      if (Array.isArray(modulos)) {
        const existenteModulos = await Formador.listarExistenteModulosPorCursoId([cursoId]);
        const recebidaModIds = new Set(
          modulos.filter((m) => m.id && !String(m.id).startsWith('mod-temp-')).map((m) => m.id),
        );
        for (const exMod of existenteModulos) {
          if (!recebidaModIds.has(exMod.id)) {
            const exAulas = await Formador.listarExAulasPorModuloId([exMod.id]);
            for (const el of exAulas) {
              await Formador.eliminarQuestionarioPerguntasPorAulaId([el.id]);
              await Formador.eliminarQuestionariosPorAulaId([el.id]);
              await Formador.eliminarAulaProgressoPorAulaId([el.id]);
              await Formador.eliminarNotasPorAulaId([el.id]);
            }

            await Formador.eliminarAulasPorModuloId([exMod.id]);
            await Formador.eliminarCursoModulosPorId([exMod.id]);
          }
        }

        await assincronoParaCada(modulos, async (mod, mIdx) => {
          let modId = mod.id;
          const desbloqueio = mod.modoDesbloqueio === 'sequential' ? 'sequential' : 'instant';
          const exists = modId
            ? await Formador.procurarCursoModulosPorIdAndCursoId([modId, cursoId])
            : null;
          if (exists) {
            await Formador.atualizarModulo([
              mod.title || `Módulo ${mIdx + 1}`,
              mod.description || '',
              mIdx,
              desbloqueio,
              modId,
              cursoId,
            ]);
          } else {
            modId =
              modId && !(await Formador.procurarCursoModulosPorId([modId])) ? modId : randomUUID();
            await Formador.inserirCursoModulos([
              modId,
              cursoId,
              mod.title || `Módulo ${mIdx + 1}`,
              mod.description || '',
              mIdx,
              desbloqueio,
            ]);
          }

          if (Array.isArray(mod.lessons)) {
            const existenteAulas = await Formador.listarExAulasPorModuloId([modId]);
            const recebidaLesIds = new Set(
              mod.lessons
                .filter((l) => l.id && !String(l.id).startsWith('les-temp-'))
                .map((l) => l.id),
            );
            for (const exLes of existenteAulas) {
              if (!recebidaLesIds.has(exLes.id)) {
                await Formador.eliminarQuestionarioPerguntasPorAulaId([exLes.id]);
                await Formador.eliminarQuestionariosPorAulaId([exLes.id]);
                await Formador.eliminarAulaProgressoPorAulaId([exLes.id]);
                await Formador.eliminarNotasPorAulaId([exLes.id]);
                await Formador.eliminarAulasPorId([exLes.id]);
              }
            }

            await assincronoParaCada(mod.lessons, async (les, lIdx) => {
              let lesId = les.id;
              const conteudoToStore = les.quiz
                ? JSON.stringify(les.quiz)
                : les.richArticle
                  ? JSON.stringify(les.richArticle)
                  : typeof les.content === 'object'
                    ? JSON.stringify(les.content)
                    : les.customData
                      ? JSON.stringify(les.customData)
                      : les.content || '';
              const lesExists = lesId
                ? await Formador.procurarAulasPorIdAndModuloId([lesId, modId])
                : null;
              if (lesExists) {
                await Formador.atualizarAula([
                  les.title || `Aula ${lIdx + 1}`,
                  les.type || 'video',
                  conteudoToStore,
                  les.urlVideo || '',
                  Number(les.duracaoMinutos || 15),
                  lIdx,
                  Number(les.recompensaExperiencia || 25),
                  lesId,
                  modId,
                ]);
              } else {
                lesId =
                  lesId && !(await Formador.procurarAulasPorId([lesId])) ? lesId : randomUUID();
                await Formador.inserirAulas([
                  lesId,
                  modId,
                  les.title || `Aula ${lIdx + 1}`,
                  les.type || 'video',
                  conteudoToStore,
                  les.urlVideo || '',
                  Number(les.duracaoMinutos || 15),
                  lIdx,
                  Number(les.recompensaExperiencia || 25),
                ]);
              }

              if (les.quiz) {
                const questionarioId = `quiz-${lesId}`;
                const qExists = await Formador.procurarQExistsPorAulaId([lesId]);
                if (qExists) {
                  await Formador.atualizarQuestionariosPorTituloAndDescricaoAndAprovacaoPontuacaoAndExperienciaRewardAndId(
                    [
                      les.quiz.title || `Questionário: ${les.title}`,
                      les.quiz.description || '',
                      Number(les.quiz.pontuacaoAprovacao || 70),
                      Number(les.quiz.recompensaExperiencia || 50),
                      qExists.id,
                    ],
                  );
                  await Formador.eliminarQuestionarioPerguntasPorQuestionarioId([qExists.id]);
                } else {
                  await Formador.inserirQuestionarios([
                    questionarioId,
                    lesId,
                    les.quiz.title || `Questionário: ${les.title}`,
                    les.quiz.description || '',
                    Number(les.quiz.pontuacaoAprovacao || 70),
                    Number(les.quiz.recompensaExperiencia || 50),
                  ]);
                }

                const ativoQuestionarioId = qExists ? qExists.id : questionarioId;
                if (Array.isArray(les.quiz.questions)) {
                  await assincronoParaCada(les.quiz.questions, async (q, qIdx) => {
                    const qId = randomUUID();
                    const opcoesArray = Array.isArray(q.options)
                      ? q.options.map((opt) => (typeof opt === 'string' ? opt : opt.text))
                      : ['Opção A', 'Opção B'];
                    let corretaOpcaoIndice = 0;
                    if (Array.isArray(q.options)) {
                      const idx = q.options.findIndex((opt) => opt && opt.isCorrect);
                      if (idx >= 0) corretaOpcaoIndice = idx;
                    } else if (q.indiceOpcaoCorreta !== undefined) {
                      corretaOpcaoIndice = Number(q.indiceOpcaoCorreta);
                    }

                    await Formador.inserirQuestionarioPerguntas([
                      qId,
                      ativoQuestionarioId,
                      q.question || `Questão ${qIdx + 1}`,
                      JSON.stringify(opcoesArray),
                      corretaOpcaoIndice,
                      q.explanation || '',
                      qIdx,
                    ]);
                  });
                }
              }
            });
          }
        });
      }

      if (pedido.body.hasCommunity !== false && Array.isArray(canais) && pertencente?.idEspaco) {
        const existenteCanais = await Formador.listarCanaisPorEspacoId([pertencente.idEspaco]);
        const retainedIds = new Set(canais.map((canal) => canal.id));
        for (const canal of existenteCanais) {
          if (!retainedIds.has(canal.id))
            await Formador.eliminarCanalPorIdAndEspacoId([canal.id, pertencente.idEspaco]);
        }

        await assincronoParaCada(canais, async (ch, chIdx) => {
          const isVozChan = ch.type === 'voice' || ch.eVoz ? 1 : 0;
          const chanAcesso =
            ch.modoAcesso || (ch.type === 'announcement' ? 'announcement' : 'discussion');
          const chanVozModo = ch.modoVoz || defaultChamadaModo || 'open';
          const chExists = ch.id
            ? await Formador.procurarCanaisPorIdAndEspacoId([ch.id, pertencente.idEspaco])
            : null;
          if (chExists) {
            await Formador.atualizarCanalDefinicoes([
              ch.name,
              ch.type || 'text',
              ch.topic || '',
              chIdx,
              isVozChan,
              chanAcesso,
              chanVozModo,
              ch.id,
            ]);
          } else {
            const novoChId = randomUUID();

            await Formador.inserirCanais([
              novoChId,
              pertencente.idEspaco,
              ch.name || `canal-${chIdx + 1}`,
              ch.type || 'text',
              ch.topic || '',
              chIdx,
              isVozChan,
              ch.perguntaOrientadora || '',
              ch.guidelines || '',
              chanAcesso,
              chanVozModo,
            ]);
          }
        });
      }
    });

    return resposta.json({
      success: true,
      id: cursoId,
    });
  } catch (erro) {
    if (!erro.status || erro.status >= 500) console.error('Update course error:', erro);

    return resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Falha ao atualizar curso',
    });
  }
};

const obterFormadorCursos = async (pedido, resposta) => {
  try {
    const formadorId = pedido.user.id;
    const cursos = await Formador.contarCursosPorFormadorIdAndIdUtilizador([
      formadorId,
      formadorId,
      formadorId,
    ]);

    return resposta.json(
      cursos.map((c) => ({
        ...c,
        eGratuito: c.eGratuito === 1,
        estaPublicado: c.estaPublicado === 1,
        isOwner: c.isOwner === 1,
        _count: {
          enrollments: c.studentsCount || 0,
          modules: c.modulesCount || 0,
          reviews: c.reviewsCount || 0,
        },
      })),
    );
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao carregar cursos do criador',
    });
  }
};

const eliminarFormadorCursosPorCursoId = async (pedido, resposta) => {
  try {
    const { idCurso: cursoId } = pedido.params;
    const curso = await Formador.procurarCursoPorId([cursoId]);
    if (!curso) {
      return resposta.status(404).json({
        error: 'Curso não encontrado',
      });
    }

    if (pedido.user.role !== 'ADMIN' && curso.idFormador !== pedido.user.id) {
      return resposta.status(403).json({
        error: 'Só pode eliminar cursos que criou',
      });
    }

    const outroCursoUsesEspaco =
      curso.idEspaco && (await Formador.procurarCursosPorEspacoId([curso.idEspaco, cursoId]));
    const eliminarPertencenteEspaco =
      curso.idEspaco && curso.spaceOwnerId === curso.idFormador && !outroCursoUsesEspaco;

    await transacao(async () => {
      await Formador.eliminarCursosPorId([cursoId]);
      if (eliminarPertencenteEspaco) {
        await Formador.eliminarEspacosPorIdAndProprietarioId([curso.idEspaco, curso.idFormador]);
      }
    });

    return resposta.json({
      success: true,
      id: cursoId,
    });
  } catch (erro) {
    console.error('Delete course error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao eliminar curso',
    });
  }
};

const enviarFormadorCursos = async (pedido, resposta) => {
  try {
    const formadorId = pedido.user.id;
    const {
      title: titulo,
      description: descricao,
      category: categoria,
      difficulty: dificuldade,
      language,
      price: preco,
      eGratuito: isGratuito,
      estaPublicado: isPublicado,
      urlMiniatura: miniaturaUrl,
      thumbnailPosition: miniaturaPosicao,
      urlCapa: capaUrl,
      posicaoCapa: capaPosicao,
      duracaoHoras: duracaoHoras,
      idEspaco: personalizadoEspacoId,
      channels: canais,
      modules: modulos,
      modoChamadaPredefinido: defaultChamadaModo,
      permitirPartilhaEcraAluno: allowAlunoEcraPartilhar,
      permitirCamaraAluno: allowAlunoCamara,
      learningOutcomes: aprendizagemOutcomes,
      requirements: requisitos,
      documents: documentos,
    } = pedido.body;
    if (!titulo || !categoria) {
      return resposta.status(400).json({
        error: 'Título e categoria são obrigatórios',
      });
    }

    const cursoId = randomUUID();
    const slug = `${titulo
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Math.floor(Math.random() * 1000)}`;
    const agora = new Date().toISOString();
    let resolvedEspacoId = personalizadoEspacoId || null;
    if (resolvedEspacoId) {
      const espaco = await Formador.procurarEspacoPorId([resolvedEspacoId]);
      if (!espaco || (pedido.user.role !== 'ADMIN' && espaco.idProprietario !== formadorId))
        return resposta.status(403).json({
          error: 'Só pode associar comunidades que administra.',
        });
      if (await Formador.procurarCursosPorEspacoIdParaEnviarFormadorCursos([resolvedEspacoId]))
        return resposta.status(409).json({
          error: 'Esta comunidade já pertence a outro curso.',
        });
    }

    const outcomesStr = aprendizagemOutcomes
      ? typeof aprendizagemOutcomes === 'string'
        ? aprendizagemOutcomes
        : JSON.stringify(aprendizagemOutcomes)
      : null;
    const requisitosStr = requisitos
      ? typeof requisitos === 'string'
        ? requisitos
        : JSON.stringify(requisitos)
      : null;
    const documentosStr = documentos
      ? typeof documentos === 'string'
        ? documentos
        : JSON.stringify(documentos)
      : null;

    await transacao(async () => {
      if (!resolvedEspacoId && pedido.body.hasCommunity !== false) {
        resolvedEspacoId = randomUUID();

        const espacoSlug = `${slug}-comunidade`;

        await Formador.inserirEspacos([
          resolvedEspacoId,
          `Comunidade ${titulo}`,
          espacoSlug,
          descricao || `Espaço comunitário e salas de estudo do curso ${titulo}`,
          miniaturaUrl ||
            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&auto=format&fit=crop&q=80',
          capaUrl ||
            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
          categoria,
          formadorId,
          agora,
        ]);
        await Formador.inserirAdesoes([randomUUID(), formadorId, resolvedEspacoId, agora]);

        const canaisToInserir =
          Array.isArray(canais) && canais.length > 0
            ? canais
            : [
                {
                  name: 'geral',
                  type: 'text',
                  topic: '',
                  perguntaOrientadora: '',
                  guidelines: '',
                },
              ];

        await assincronoParaCada(canaisToInserir, async (ch, chIdx) => {
          const chId = randomUUID();
          const isVozChan = ch.type === 'voice' || ch.eVoz ? 1 : 0;
          const chanAcesso =
            ch.modoAcesso || (ch.type === 'announcement' ? 'announcement' : 'discussion');
          const chanVozModo = ch.modoVoz || defaultChamadaModo || 'open';

          await Formador.inserirCanaisParaLookup([
            chId,
            resolvedEspacoId,
            ch.name || `canal-${chIdx + 1}`,
            ch.type || 'text',
            ch.topic || '',
            chIdx,
            isVozChan,
            ch.perguntaOrientadora || '',
            ch.guidelines || '',
            chanAcesso,
            chanVozModo,
          ]);
        });
      }

      const defChamadaModo = defaultChamadaModo || 'open';
      const allowEcra = allowAlunoEcraPartilhar !== false ? 1 : 0;
      const allowCam = allowAlunoCamara !== false ? 1 : 0;
      const aprovacaoEstado = pedido.user.role === 'ADMIN' && isPublicado ? 'APPROVED' : 'DRAFT';
      const isPub = pedido.user.role === 'ADMIN' && isPublicado ? 1 : 0;

      await Formador.inserirCursos([
        cursoId,
        titulo,
        slug,
        descricao || '',
        categoria,
        dificuldade || 'Intermédio',
        miniaturaUrl ||
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        miniaturaPosicao || '50% 50%',
        capaUrl || null,
        capaPosicao || '50% 50%',
        isGratuito ? 0 : Number(preco || 0),
        isGratuito ? 1 : 0,
        isPub,
        aprovacaoEstado,
        agora,
        duracaoHoras ? Number(duracaoHoras) : 10.0,
        language || 'Português',
        formadorId,
        resolvedEspacoId,
        defChamadaModo,
        allowEcra,
        allowCam,
        outcomesStr,
        requisitosStr,
        documentosStr,
        agora,
        agora,
      ]);
      await guardarPrecoReferencia(cursoId, pedido.body, preco || 0, Boolean(isGratuito));
      if (Array.isArray(modulos)) {
        await assincronoParaCada(modulos, async (mod, mIdx) => {
          const modId = randomUUID();
          const desbloqueio = mod.modoDesbloqueio === 'sequential' ? 'sequential' : 'instant';

          await Formador.inserirCursoModulosParaLookup([
            modId,
            cursoId,
            mod.title || `Módulo ${mIdx + 1}`,
            mod.description || '',
            mIdx,
            desbloqueio,
          ]);
          if (Array.isArray(mod.lessons)) {
            await assincronoParaCada(mod.lessons, async (les, lIdx) => {
              const lesId = randomUUID();
              const conteudoToStore = les.quiz
                ? JSON.stringify(les.quiz)
                : les.richArticle
                  ? JSON.stringify(les.richArticle)
                  : typeof les.content === 'object'
                    ? JSON.stringify(les.content)
                    : les.customData
                      ? JSON.stringify(les.customData)
                      : les.content || '';

              await Formador.inserirAulasParaLookup([
                lesId,
                modId,
                les.title || `Aula ${lIdx + 1}`,
                les.type || 'video',
                conteudoToStore,
                les.urlVideo || '',
                Number(les.duracaoMinutos || 15),
                lIdx,
                Number(les.recompensaExperiencia || 25),
              ]);
              if (les.quiz) {
                const questionarioId = randomUUID();

                await Formador.inserirQuestionariosParaLookup([
                  questionarioId,
                  lesId,
                  les.quiz.title || `Questionário: ${les.title}`,
                  les.quiz.description || '',
                  Number(les.quiz.pontuacaoAprovacao || 70),
                  Number(les.quiz.recompensaExperiencia || 50),
                ]);
                if (Array.isArray(les.quiz.questions)) {
                  await assincronoParaCada(les.quiz.questions, async (q, qIdx) => {
                    const qId = randomUUID();
                    const opcoesArray = Array.isArray(q.options)
                      ? q.options.map((opt) => (typeof opt === 'string' ? opt : opt.text))
                      : ['Opção A', 'Opção B', 'Opção C', 'Opção D'];
                    let corretaOpcaoIndice = 0;
                    if (Array.isArray(q.options)) {
                      const idx = q.options.findIndex((opt) => opt && opt.isCorrect);
                      if (idx >= 0) corretaOpcaoIndice = idx;
                    } else if (q.indiceOpcaoCorreta !== undefined) {
                      corretaOpcaoIndice = Number(q.indiceOpcaoCorreta);
                    }

                    await Formador.inserirQuestionarioPerguntasParaLookup([
                      qId,
                      questionarioId,
                      q.question || `Questão ${qIdx + 1}`,
                      JSON.stringify(opcoesArray),
                      corretaOpcaoIndice,
                      q.explanation || '',
                      qIdx,
                    ]);
                  });
                }
              }
            });
          }
        });
      }

      await Formador.inserirInscricoes([randomUUID(), formadorId, cursoId, agora]);
    });

    const criadoCurso = await Formador.procurarCursosPorId([cursoId]);

    return resposta.status(201).json(criadoCurso);
  } catch (erro) {
    console.error('Create course error:', erro);

    return resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Falha ao criar curso',
    });
  }
};

const obterFormadorMembros = async (pedido, resposta) => {
  try {
    const formadorId = pedido.user.id;
    const membros = await Formador.listarMembrosPorFormadorIdAndUtilizadorId([
      formadorId,
      formadorId,
      formadorId,
    ]);
    const formatted = membros.map((m) => ({
      id: m.id,
      role: m.member_type,
      percentagemProgresso: m.percentagemProgresso,
      inscritoEm: m.inscritoEm,
      course: {
        id: m.course_id,
        title: m.course_title,
      },
      space: {
        name: m.space_name || m.course_title,
      },
      user: {
        id: m.user_id,
        name: m.name,
        username: m.username,
        urlAvatar: m.urlAvatar,
        email: m.email,
        level: m.level,
        xp: m.xp,
      },
    }));

    return resposta.json(formatted);
  } catch (erro) {
    console.error('Get creator members error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar lista de membros',
    });
  }
};

const obterFormadorCursosPorCursoIdColaboradores = async (pedido, resposta) => {
  try {
    const { idCurso: cursoId } = pedido.params;
    const utilizadorId = pedido.user.id;
    if (pedido.user.role !== 'ADMIN') {
      const acesso = await Formador.procurarAcessoPorIdAndFormadorIdAndUtilizadorId([
        cursoId,
        utilizadorId,
        utilizadorId,
      ]);
      if (!acesso)
        return resposta.status(403).json({
          error: 'Acesso negado a este curso',
        });
    }

    const colaboradores = await Formador.listarColaboradoresPorCursoId([cursoId]);

    return resposta.json(colaboradores);
  } catch (erro) {
    console.error('Get collaborators error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar colaboradores do curso',
    });
  }
};

const enviarFormadorCursosPorCursoIdColaboradores = async (pedido, resposta) => {
  try {
    const { idCurso: cursoId } = pedido.params;
    const utilizadorId = pedido.user.id;
    const curso = await Formador.procurarCursoPorIdParaEnviarFormadorCursosPorCursoIdColaboradores([
      cursoId,
    ]);
    if (!curso)
      return resposta.status(404).json({
        error: 'Curso não encontrado',
      });
    if (pedido.user.role !== 'ADMIN' && curso.idFormador !== utilizadorId) {
      return resposta.status(403).json({
        error: 'Apenas o proprietário do curso pode adicionar colaboradores',
      });
    }

    const { identifier: identificador } = pedido.body;
    if (!identificador || typeof identificador !== 'string' || !identificador.trim()) {
      return resposta.status(400).json({
        error: 'Indique o nome de utilizador ou email do colaborador',
      });
    }

    const cleanIdent = identificador.trim().toLowerCase();
    const destinoUtilizador = await Formador.procurarDestinoUtilizador([cleanIdent, cleanIdent]);
    if (!destinoUtilizador) {
      return resposta.status(404).json({
        error: 'Utilizador não encontrado com este email/username',
      });
    }

    if (destinoUtilizador.id === curso.idFormador) {
      return resposta.status(400).json({
        error: 'O criador já é o proprietário do curso',
      });
    }

    const existente = await Formador.procurarExistentePorCursoIdAndUtilizadorId([
      cursoId,
      destinoUtilizador.id,
    ]);
    if (existente) {
      return resposta.status(400).json({
        error: 'Este utilizador já é colaborador deste curso',
      });
    }

    const collabId = `collab-${Date.now()}`;
    const agora = new Date().toISOString();

    await Formador.inserirCursoColaboradores([collabId, cursoId, destinoUtilizador.id, agora]);

    const enrolled = await Formador.procurarEnrolledPorCursoIdAndUtilizadorId([
      cursoId,
      destinoUtilizador.id,
    ]);
    if (!enrolled) {
      await Formador.inserirInscricoesParaEnviarFormadorCursosPorCursoIdColaboradores([
        `enr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        destinoUtilizador.id,
        cursoId,
        agora,
      ]);
    }

    await Formador.inserirNotificacoesParaEnviarFormadorCursosPorCursoIdColaboradores([
      `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      destinoUtilizador.id,
      `Foi adicionado como colaborador do curso "${curso.title}". Agora pode ajudar a gerir os conteúdos.`,
      `/formador/cursos/${cursoId}/editar`,
      agora,
    ]);

    return resposta.status(201).json({
      id: collabId,
      idCurso: cursoId,
      idUtilizador: destinoUtilizador.id,
      criadoEm: agora,
      name: destinoUtilizador.name,
      username: destinoUtilizador.username,
      email: destinoUtilizador.email,
      urlAvatar: destinoUtilizador.urlAvatar,
      level: destinoUtilizador.level,
    });
  } catch (erro) {
    console.error('Add collaborator error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao adicionar colaborador',
    });
  }
};

const eliminarFormadorCursosPorCursoIdColaboradoresPorDestinoUtilizadorId = async (
  pedido,
  resposta,
) => {
  try {
    const { idCurso: cursoId, targetUserId: destinoUtilizadorId } = pedido.params;
    const utilizadorId = pedido.user.id;
    const curso = await Formador.procurarCursoParaColaboradorRemoval([cursoId]);
    if (!curso)
      return resposta.status(404).json({
        error: 'Curso não encontrado',
      });
    if (
      pedido.user.role !== 'ADMIN' &&
      curso.idFormador !== utilizadorId &&
      destinoUtilizadorId !== utilizadorId
    ) {
      return resposta.status(403).json({
        error: 'Sem permissão para remover este colaborador',
      });
    }

    await Formador.eliminarCursoColaboradoresPorCursoIdAndUtilizadorId([
      cursoId,
      destinoUtilizadorId,
    ]);

    return resposta.json({
      success: true,
      message: 'Colaborador removido com sucesso',
    });
  } catch (erro) {
    console.error('Delete collaborator error:', erro);

    return resposta.status(500).json({
      error: 'Falha ao remover colaborador',
    });
  }
};

const eliminarFormadorCursosPorCursoIdMembrosPorUtilizadorId = async (pedido, resposta) => {
  try {
    const { idCurso: cursoId, idUtilizador: utilizadorId } = pedido.params;
    const formadorId = pedido.user.id;
    if (pedido.user.role !== 'ADMIN') {
      const pertencente = await Formador.procurarPertencentePorIdAndFormadorIdAndUtilizadorId([
        cursoId,
        formadorId,
        formadorId,
      ]);
      if (!pertencente)
        return resposta.status(403).json({
          error: 'Acesso negado a este curso',
        });
    }

    await Formador.eliminarInscricoesPorCursoIdAndUtilizadorId([cursoId, utilizadorId]);
    pedido.app
      .get('io')
      ?.in('user_' + utilizadorId)
      .disconnectSockets(true);

    return resposta.json({
      success: true,
      message: 'Membro removido do curso com sucesso',
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao remover membro',
    });
  }
};

const enviarFormadorCursosPorCursoIdInscricoes = async (pedido, resposta) => {
  const curso = await Formador.procurarCursosPorId([pedido.params.idCurso]);
  if (!curso)
    return resposta.status(404).json({
      error: 'Curso não encontrado.',
    });
  if (!(await podeGerirCurso(pedido.user, curso)))
    return resposta.status(403).json({
      error: 'Sem permissão para gerir inscrições.',
    });
  const identificador = pedido.body.identifier;
  if (typeof identificador !== 'string' || !identificador.trim() || identificador.length > 254)
    return resposta.status(400).json({
      error: 'Indique um email ou nome de utilizador.',
    });
  const aluno = await Formador.procurarAluno([
    identificador.trim().toLowerCase(),
    identificador.trim().toLowerCase(),
  ]);
  if (!aluno)
    return resposta.status(404).json({
      error: 'Utilizador não encontrado.',
    });
  await transacao(async () => {
    await bloquearTransacao(`enrollment:${aluno.id}:${curso.id}`);
    if (!(await Formador.procurarEnrolledPorCursoIdAndUtilizadorId([curso.id, aluno.id])))
      await Formador.inserirInscricoesParaLookup([
        randomUUID(),
        aluno.id,
        curso.id,
        new Date().toISOString(),
      ]);
    if (
      curso.idEspaco &&
      !(await Formador.procurarAdesoesPorEspacoIdAndUtilizadorId([curso.idEspaco, aluno.id]))
    )
      await Formador.inserirAdesoesParaLookup([
        randomUUID(),
        aluno.id,
        curso.idEspaco,
        new Date().toISOString(),
      ]);
  });

  return resposta.json({
    message: 'Acesso concedido.',
    idUtilizador: aluno.id,
    idCurso: curso.id,
  });
};

const enviarFormadorCursosPorCursoIdSubmeterRever = async (pedido, resposta) => {
  try {
    resposta.json(await submeterCurso(pedido.user, pedido.params.idCurso));
  } catch (erro) {
    resposta.status(erro.status || 500).json({
      error: erro.status ? erro.message : 'Falha ao enviar curso para revisão.',
    });
  }
};

exports.obterFormadorCandidaturaEstado = obterFormadorCandidaturaEstado;
exports.postCreatorCourseCommunity = async (pedido, resposta) => {
  const espacoId = await garantirCursoCommunity(pedido.user, pedido.params.idCurso);

  resposta.json({
    idEspaco: espacoId,
  });
};

exports.enviarFormadorCandidatar = enviarFormadorCandidatar;
exports.obterFormadorEstatisticas = obterFormadorEstatisticas;
exports.obterFormadorCursosPorCursoId = obterFormadorCursosPorCursoId;
exports.atualizarFormadorCursosPorCursoId = atualizarFormadorCursosPorCursoId;
exports.obterFormadorCursos = obterFormadorCursos;
exports.eliminarFormadorCursosPorCursoId = eliminarFormadorCursosPorCursoId;
exports.enviarFormadorCursos = enviarFormadorCursos;
exports.obterFormadorMembros = obterFormadorMembros;
exports.obterFormadorCursosPorCursoIdColaboradores = obterFormadorCursosPorCursoIdColaboradores;
exports.enviarFormadorCursosPorCursoIdColaboradores = enviarFormadorCursosPorCursoIdColaboradores;
exports.eliminarFormadorCursosPorCursoIdColaboradoresPorDestinoUtilizadorId =
  eliminarFormadorCursosPorCursoIdColaboradoresPorDestinoUtilizadorId;
exports.eliminarFormadorCursosPorCursoIdMembrosPorUtilizadorId =
  eliminarFormadorCursosPorCursoIdMembrosPorUtilizadorId;
exports.enviarFormadorCursosPorCursoIdInscricoes = enviarFormadorCursosPorCursoIdInscricoes;
exports.enviarFormadorCursosPorCursoIdSubmeterRever = enviarFormadorCursosPorCursoIdSubmeterRever;
