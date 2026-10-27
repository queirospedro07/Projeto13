const { lerJsonCompativel } = require('../utilitarios/compatibilidadeCampos.js');
const { consultarUm, consultarTodos, executar } = require('../base-dados/ligacao.js');
const { aulaComCurso } = require('./acessoCurso.js');
const { randomUUID } = require('node:crypto');
const parse = (valor, fallback) => {
  try {
    return typeof valor === 'string' ? lerJsonCompativel(valor) : valor || fallback;
  } catch {
    return fallback;
  }
};

const normalizar = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function carregarAvaliacao(aulaId) {
  const aula = await aulaComCurso(aulaId);
  if (!aula || aula.type !== 'quiz') return null;
  const guardado = await consultarUm('SELECT * FROM consulta_questionarios WHERE "idAula" = $1', [
    aula.id,
  ]);
  const conteudo = parse(aula.content, {});
  let perguntas = Array.isArray(conteudo.questions) ? conteudo.questions : [];
  if (!perguntas.length && guardado)
    perguntas = (
      await consultarTodos(
        'SELECT * FROM consulta_perguntas_questionario WHERE "idQuestionario" = $1 ORDER BY "indiceOrdem"',
        [guardado.id],
      )
    ).map((q) => ({
      ...q,
      options: parse(q.options, []),
    }));
  const formatted = perguntas.map((q, indice) => ({
    ...q,
    id: String(q.id || `q-${indice}`),
    type: q.type || 'single',
    points: Math.max(1, Math.min(100, Number(q.points) || 10)),
    options: (Array.isArray(q.options) ? q.options : []).map((opcao, opcaoIndice) => ({
      id: String(opcao?.id || `opt-${indice}-${opcaoIndice}`),
      text: typeof opcao === 'string' ? opcao : String(opcao?.text || ''),
      isCorrect:
        typeof opcao === 'string'
          ? opcaoIndice === Number(q.indiceOpcaoCorreta ?? -1)
          : opcao?.isCorrect === true,
    })),
  }));

  return {
    idAula: aula.id,
    idCurso: aula.idCurso,
    id: aula.id,
    title: conteudo.title || guardado?.title || aula.title,
    description: conteudo.description || '',
    pontuacaoAprovacao: Math.max(
      1,
      Math.min(100, Number(conteudo.pontuacaoAprovacao || guardado?.pontuacaoAprovacao) || 70),
    ),
    questions: formatted,
  };
}

function publicoAvaliacao(questionario) {
  if (!questionario) return null;

  return {
    id: questionario.id,
    idAula: questionario.idAula,
    title: questionario.title,
    description: questionario.description,
    pontuacaoAprovacao: questionario.pontuacaoAprovacao,
    questions: questionario.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      points: q.points,
      gradingMode: q.gradingMode,
      minWords: q.minWords,
      options: q.options.map(({ id, text }) => ({
        id,
        text,
      })),
    })),
  };
}

function classificarAvaliacao(questionario, answers) {
  if (
    !answers ||
    typeof answers !== 'object' ||
    Array.isArray(answers) ||
    JSON.stringify(answers).length > 60000
  )
    throw new Error('Respostas inválidas.');
  if (!questionario.questions.length) throw new Error('O questionário ainda não tem perguntas.');
  let earned = 0;
  let total = 0;
  let corretaContar = 0;
  let pendente = 0;
  const resultados = questionario.questions.map((q) => {
    const resposta = answers[q.id];
    let isCorreta;
    if (q.type === 'open-ended') {
      if (typeof resposta !== 'string' || !resposta.trim() || resposta.length > 5000)
        throw new Error('Responda a todas as perguntas. Use até 5000 caracteres por resposta.');
      const keywords = Array.isArray(q.keywords) ? q.keywords.map(normalizar).filter(Boolean) : [];
      if (q.gradingMode === 'teacher' || !keywords.length) {
        pendente++;
        isCorreta = null;
      } else {
        const matched = keywords.filter((word) => normalizar(resposta).includes(word)).length;

        isCorreta =
          resposta.trim().split(/\s+/).length >= (Number(q.minWords) || 1) &&
          (matched / keywords.length >= 0.5 || matched >= Math.min(2, keywords.length));
      }
    } else {
      const selecionado = q.type === 'multiple' ? resposta : [resposta];
      if (
        !Array.isArray(selecionado) ||
        !selecionado.length ||
        selecionado.some((id) => typeof id !== 'string' || !q.options.some((o) => o.id === id))
      )
        throw new Error('Selecione uma resposta válida em cada pergunta.');
      const correta = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      if (!correta.length)
        throw new Error('O formador ainda não configurou as respostas deste questionário.');
      const unique = new Set(selecionado);

      isCorreta = unique.size === correta.length && correta.every((id) => unique.has(id));
    }

    total += q.points;
    if (isCorreta) {
      earned += q.points;
      corretaContar++;
    }

    return {
      questionId: q.id,
      isCorrect: isCorreta,
      correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
      explanation: q.explanation || '',
      expectedAnswer: q.expectedAnswer || '',
    };
  });
  const pontuacao = Math.round((earned / total) * 100);

  return {
    score: pontuacao,
    passed: pendente === 0 && pontuacao >= questionario.pontuacaoAprovacao,
    correctCount: corretaContar,
    totalCount: questionario.questions.length,
    earnedXp: 0,
    pendingTeacherReviewCount: pendente,
    results: resultados,
  };
}

async function registarAvaliacao(utilizadorId, questionario, answers, resultado) {
  const id = randomUUID();

  await executar(
    'INSERT INTO submissoes_questionario (id, id_utilizador, id_aula, respostas, resultado, nota, aprovado, pendente, criado_em) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    [
      id,
      utilizadorId,
      questionario.idAula,
      JSON.stringify(answers),
      JSON.stringify(resultado),
      resultado.score,
      resultado.passed ? 1 : 0,
      resultado.pendingTeacherReviewCount ? 1 : 0,
      new Date().toISOString(),
    ],
  );

  return id;
}

async function temAprovadoAvaliacao(utilizadorId, aulaId) {
  return Boolean(
    await consultarUm(
      'SELECT id FROM submissoes_questionario WHERE id_utilizador = $1 AND id_aula = $2 AND aprovado = 1 LIMIT 1',
      [utilizadorId, aulaId],
    ),
  );
}

exports.carregarAvaliacao = carregarAvaliacao;
exports.publicoAvaliacao = publicoAvaliacao;
exports.classificarAvaliacao = classificarAvaliacao;
exports.registarAvaliacao = registarAvaliacao;
exports.temAprovadoAvaliacao = temAprovadoAvaliacao;
