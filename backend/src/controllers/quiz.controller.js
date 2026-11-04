const { lerJsonCompativel } = require('../utils/fieldCompatibility.js');
const Questionario = require('../models/quiz.js');
const { assincronoFiltrar, assincronoMap } = require('../utils/asyncCollections.js');
const { concluirAula } = require('../services/progress.js');
const { transacao } = require('../database/connection.js');
const { podeGerirCurso, podeEstudarCurso } = require('../services/courseAccess.js');
const {
  carregarAvaliacao,
  publicoAvaliacao,
  classificarAvaliacao,
  registarAvaliacao,
} = require('../services/reviews.js');
const obterQuestionarioAvaliacoes = async (pedido, resposta) => {
  const registos = await Questionario.listarSubmissoesQuestionario([
    pedido.user.id,
    pedido.user.role === 'ADMIN',
  ]);

  return resposta.json(
    await assincronoMap(
      await assincronoFiltrar(
        registos,
        async (registo) =>
          await podeGerirCurso(
            pedido.user,
            await Questionario.procurarCursosPorId([registo.idCurso]),
          ),
      ),
      async (registo) => ({
        id: registo.id,
        studentName: registo.studentName,
        lessonTitle: registo.lessonTitle,
        idCurso: registo.idCurso,
        tituloCurso: registo.tituloCurso,
        submittedAt: registo.criado_em,
        answers: lerJsonCompativel(registo.respostas),
        quiz: publicoAvaliacao(await carregarAvaliacao(registo.id_aula)),
      }),
    ),
  );
};

const atualizarQuestionarioAvaliacoesPorId = async (pedido, resposta) => {
  const tentativa = await Questionario.procurarTentativaPorId([pedido.params.id]);
  if (!tentativa)
    return resposta.status(404).json({
      error: 'Submissão não encontrada.',
    });
  const questionario = await carregarAvaliacao(tentativa.id_aula);
  if (
    !questionario ||
    !(await podeGerirCurso(
      pedido.user,
      await Questionario.procurarCursosPorId([questionario.idCurso]),
    ))
  )
    return resposta.status(403).json({
      error: 'Sem permissão para avaliar esta submissão.',
    });
  const pontuacao = pedido.body.score;
  if (!Number.isInteger(pontuacao) || pontuacao < 0 || pontuacao > 100)
    return resposta.status(400).json({
      error: 'A nota deve ser um número inteiro entre 0 e 100.',
    });
  const resultado = {
    ...lerJsonCompativel(tentativa.resultado),
    score: pontuacao,
    passed: pontuacao >= questionario.pontuacaoAprovacao,
    pendingTeacherReviewCount: 0,
  };

  await transacao(async () => {
    await Questionario.reverQuestionarioSubmissao([
      pontuacao,
      resultado.passed ? 1 : 0,
      JSON.stringify(resultado),
      pedido.user.id,
      new Date().toISOString(),
      tentativa.id,
    ]);
    if (resultado.passed)
      await concluirAula(
        {
          id: tentativa.id_utilizador,
        },
        questionario.idCurso,
        questionario.idAula,
      );
  });

  return resposta.json(resultado);
};

const obterQuestionarioAulaPorAulaId = async (pedido, resposta) => {
  const questionario = await carregarAvaliacao(pedido.params.idAula);
  if (!questionario)
    return resposta.status(404).json({
      error: 'Questionário não encontrado.',
    });
  if (
    !(await podeEstudarCurso(
      pedido.user,
      await Questionario.procurarCursosPorId([questionario.idCurso]),
    ))
  )
    return resposta.status(403).json({
      error: 'Inscreva-se no curso para aceder ao questionário.',
    });
  const recente = await Questionario.procurarRecentePorIdUtilizadorAndIdAula([
    pedido.user.id,
    questionario.idAula,
  ]);

  return resposta.json({
    ...publicoAvaliacao(questionario),
    latestAttempt: recente ? lerJsonCompativel(recente.resultado) : null,
  });
};

const enviarQuestionarioPorQuestionarioIdSubmeter = async (pedido, resposta) => {
  const guardado = await Questionario.procurarGuardadoPorId([pedido.params.idQuestionario]);
  const questionario = await carregarAvaliacao(guardado?.idAula || pedido.params.idQuestionario);
  if (!questionario)
    return resposta.status(404).json({
      error: 'Questionário não encontrado.',
    });
  if (
    !(await podeEstudarCurso(
      pedido.user,
      await Questionario.procurarCursosPorId([questionario.idCurso]),
    ))
  )
    return resposta.status(403).json({
      error: 'Sem acesso a este questionário.',
    });
  try {
    const resultado = classificarAvaliacao(questionario, pedido.body.answers);
    const tentativaId = await registarAvaliacao(
      pedido.user.id,
      questionario,
      pedido.body.answers,
      resultado,
    );

    return resposta.json({
      ...resultado,
      attemptId: tentativaId,
    });
  } catch (erro) {
    return resposta.status(400).json({
      error: erro.message,
    });
  }
};

exports.obterQuestionarioAvaliacoes = obterQuestionarioAvaliacoes;
exports.atualizarQuestionarioAvaliacoesPorId = atualizarQuestionarioAvaliacoesPorId;
exports.obterQuestionarioAulaPorAulaId = obterQuestionarioAulaPorAulaId;
exports.enviarQuestionarioPorQuestionarioIdSubmeter = enviarQuestionarioPorQuestionarioIdSubmeter;
