const Projeto = require('../models/project.js');
const { assincronoFiltrar } = require('../utils/asyncCollections.js');
const { randomUUID } = require('node:crypto');
const { transacao } = require('../database/connection.js');
const { podeEstudarCurso, podeGerirCurso, aulaComCurso } = require('../services/courseAccess.js');
const { concluirAula } = require('../services/progress.js');
const obterProjetoAvaliacoes = async (pedido, resposta) => {
  const registos = await Projeto.listarSubmissoesProjeto([
    pedido.user.id,
    pedido.user.role === 'ADMIN',
  ]);

  return resposta.json(
    await assincronoFiltrar(
      registos,
      async (r) =>
        await podeGerirCurso(pedido.user, await Projeto.procurarCursosPorId([r.idCurso])),
    ),
  );
};

const atualizarProjetoAvaliacoesPorId = async (pedido, resposta) => {
  const registo = await Projeto.procurarSubmissoesProjetoPorId([pedido.params.id]);
  const aula = registo && (await aulaComCurso(registo.id_aula));
  if (!aula)
    return resposta.status(404).json({
      error: 'Projeto não encontrado.',
    });
  if (!(await podeGerirCurso(pedido.user, await Projeto.procurarCursosPorId([aula.idCurso]))))
    return resposta.status(403).json({
      error: 'Sem permissão para avaliar este projeto.',
    });
  if (
    !['APPROVED', 'CHANGES_REQUESTED'].includes(pedido.body.status) ||
    typeof pedido.body.feedback !== 'string' ||
    pedido.body.feedback.length > 2000
  )
    return resposta.status(400).json({
      error: 'Avaliação inválida. Inclua um parecer com até 2000 caracteres.',
    });
  if (pedido.body.status === 'CHANGES_REQUESTED' && !pedido.body.feedback.trim())
    return resposta.status(400).json({
      error: 'Indique as alterações necessárias no feedback.',
    });
  await transacao(async () => {
    await Projeto.reverProjetoSubmissao([
      pedido.body.status,
      pedido.body.feedback.trim(),
      pedido.user.id,
      new Date().toISOString(),
      registo.id,
    ]);
    if (pedido.body.status === 'APPROVED')
      await concluirAula(
        {
          id: registo.id_utilizador,
        },
        aula.idCurso,
        aula.id,
      );
  });

  return resposta.json({
    status: pedido.body.status,
    feedback: pedido.body.feedback.trim(),
  });
};

const obterProjetoAulaPorId = async (pedido, resposta) => {
  const aula = await aulaComCurso(pedido.params.id);
  if (!aula || aula.type !== 'project')
    return resposta.status(404).json({
      error: 'Projeto não encontrado.',
    });
  if (!(await podeEstudarCurso(pedido.user, await Projeto.procurarCursosPorId([aula.idCurso]))))
    return resposta.status(403).json({
      error: 'Sem acesso ao projeto.',
    });

  return resposta.json(
    (await Projeto.procurarSubmissoesProjetoPorIdUtilizadorAndIdAula([pedido.user.id, aula.id])) ||
      null,
  );
};

const enviarProjetoAulaPorId = async (pedido, resposta) => {
  const aula = await aulaComCurso(pedido.params.id);
  if (!aula || aula.type !== 'project')
    return resposta.status(404).json({
      error: 'Projeto não encontrado.',
    });
  if (!(await podeEstudarCurso(pedido.user, await Projeto.procurarCursosPorId([aula.idCurso]))))
    return resposta.status(403).json({
      error: 'Sem acesso ao projeto.',
    });
  let url;
  try {
    url = new URL(pedido.body.url);
  } catch {
    return resposta.status(400).json({
      error: 'Use um link http ou https para o seu projeto.',
    });
  }

  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.href.length > 2000
  )
    return resposta.status(400).json({
      error: 'Link de projeto inválido.',
    });
  const id = randomUUID();

  await Projeto.inserirSubmissoesProjeto([
    id,
    pedido.user.id,
    aula.id,
    url.href,
    new Date().toISOString(),
  ]);

  return resposta.status(201).json({
    id,
    url: url.href,
    status: 'SUBMITTED',
    feedback: '',
  });
};

exports.obterProjetoAvaliacoes = obterProjetoAvaliacoes;
exports.atualizarProjetoAvaliacoesPorId = atualizarProjetoAvaliacoesPorId;
exports.obterProjetoAulaPorId = obterProjetoAulaPorId;
exports.enviarProjetoAulaPorId = enviarProjetoAulaPorId;
