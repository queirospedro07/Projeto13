const { assincronoTodos } = require('../utils/asyncCollections.js');
const { randomUUID } = require('node:crypto');
const {
  consultarUm,
  consultarTodos,
  executar,
  transacao,
  bloquearTransacao,
} = require('../database/connection.js');
const { temAprovadoAvaliacao } = require('./reviews.js');
const { podeGerirCurso } = require('./courseAccess.js');
const falha = (estado, mensagem) =>
  Object.assign(new Error(mensagem), {
    status: estado,
  });

async function podeEmitirCertificado(utilizadorId, cursoId) {
  const inscricao = await consultarUm(
    'SELECT id FROM consulta_inscricoes WHERE "idUtilizador" = $1 AND "idCurso" = $2',
    [utilizadorId, cursoId],
  );
  if (!inscricao) return false;
  const aulas = await consultarTodos(
    'SELECT l.id, l.type FROM consulta_aulas l JOIN consulta_modulos_curso m ON m.id = l."idModulo" WHERE m."idCurso" = $1',
    [cursoId],
  );

  return (
    aulas.length > 0 &&
    (await assincronoTodos(
      aulas,
      async (aula) =>
        (await consultarUm(
          'SELECT id FROM consulta_progresso_aulas WHERE "idInscricao" = $1 AND "idAula" = $2 AND completed = 1',
          [inscricao.id, aula.id],
        )) &&
        (aula.type !== 'quiz' || (await temAprovadoAvaliacao(utilizadorId, aula.id))) &&
        (aula.type !== 'project' ||
          Boolean(
            await consultarUm(
              "SELECT id FROM submissoes_projeto WHERE id_utilizador = $1 AND id_aula = $2 AND estado = 'APPROVED'",
              [utilizadorId, aula.id],
            ),
          )),
    ))
  );
}

async function emitirCertificado(utilizadorId, cursoId) {
  return await transacao(async () => {
    await bloquearTransacao(`certificate:${utilizadorId}:${cursoId}`);
    if (!(await podeEmitirCertificado(utilizadorId, cursoId)))
      throw falha(400, 'Conclua todas as aulas e avaliações antes de pedir o certificado.');
    const existente = await consultarUm(
      'SELECT * FROM consulta_certificados WHERE "idUtilizador" = $1 AND "idCurso" = $2',
      [utilizadorId, cursoId],
    );
    if (existente) return existente;
    const utilizador = await consultarUm('SELECT name FROM consulta_utilizadores WHERE id = $1', [
      utilizadorId,
    ]);
    const curso = await consultarUm('SELECT title FROM consulta_cursos WHERE id = $1', [cursoId]);
    const id = randomUUID();

    await executar(
      'INSERT INTO certificados (id, id_utilizador, id_curso, nome_destinatario, titulo_curso, id_credencial, emitido_em, pontuacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        id,
        utilizadorId,
        cursoId,
        utilizador.name,
        curso.title,
        `NEXO-${randomUUID().replaceAll('-', '').toUpperCase()}`,
        new Date().toISOString(),
        100,
      ],
    );

    return await consultarUm('SELECT * FROM consulta_certificados WHERE id = $1', [id]);
  });
}

async function concluirAula(utilizador, cursoIdentificador, aulaId) {
  return await transacao(async () => {
    const curso = await consultarUm('SELECT * FROM consulta_cursos WHERE id = $1 OR slug = $2', [
      cursoIdentificador,
      cursoIdentificador,
    ]);
    if (!curso) throw falha(404, 'Curso não encontrado.');
    await bloquearTransacao(`enrollment:${utilizador.id}:${curso.id}`);

    const aula = await consultarUm(
      'SELECT l.* FROM consulta_aulas l JOIN consulta_modulos_curso m ON m.id = l."idModulo" WHERE l.id = $1 AND m."idCurso" = $2',
      [aulaId, curso.id],
    );
    if (!aula) throw falha(404, 'Aula não encontrada neste curso.');
    if (aula.type === 'quiz' && !(await temAprovadoAvaliacao(utilizador.id, aulaId)))
      throw falha(403, 'Obtenha aprovação no questionário antes de concluir esta aula.');
    if (
      aula.type === 'project' &&
      !(await consultarUm(
        "SELECT id FROM submissoes_projeto WHERE id_utilizador = $1 AND id_aula = $2 AND estado = 'APPROVED'",
        [utilizador.id, aula.id],
      ))
    )
      throw falha(403, 'O projeto deve ser aprovado pelo formador.');
    let inscricao = await consultarUm(
      'SELECT * FROM consulta_inscricoes WHERE "idUtilizador" = $1 AND "idCurso" = $2',
      [utilizador.id, curso.id],
    );
    const agora = new Date().toISOString();
    if (!inscricao) {
      if (!(await podeGerirCurso(utilizador, curso)))
        throw falha(403, 'Inscreva-se no curso antes de concluir aulas.');
      await executar(
        'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0)',
        [randomUUID(), utilizador.id, curso.id, agora],
      );
      inscricao = await consultarUm(
        'SELECT * FROM consulta_inscricoes WHERE "idUtilizador" = $1 AND "idCurso" = $2',
        [utilizador.id, curso.id],
      );
    }

    const progresso = await consultarUm(
      'SELECT * FROM consulta_progresso_aulas WHERE "idInscricao" = $1 AND "idAula" = $2',
      [inscricao.id, aulaId],
    );
    if (!progresso?.completed) {
      if (progresso)
        await executar(
          'UPDATE progresso_aulas SET concluido = 1, concluido_em = $1 WHERE id = $2',
          [agora, progresso.id],
        );
      else
        await executar(
          'INSERT INTO progresso_aulas (id, id_inscricao, id_aula, concluido, concluido_em) VALUES ($1, $2, $3, 1, $4)',
          [randomUUID(), inscricao.id, aulaId, agora],
        );
    }

    const aulas = await consultarTodos(
      'SELECT l.id FROM consulta_aulas l JOIN consulta_modulos_curso m ON m.id = l."idModulo" WHERE m."idCurso" = $1',
      [curso.id],
    );
    const progressoRegistos = await consultarTodos(
      'SELECT * FROM consulta_progresso_aulas WHERE "idInscricao" = $1',
      [inscricao.id],
    );
    const done = new Set(
      progressoRegistos
        .filter((registo) => registo.completed === 1)
        .map((registo) => registo.idAula),
    );
    const concluidoContar = aulas.filter((registo) => done.has(registo.id)).length;
    const todosConcluido = aulas.length > 0 && concluidoContar === aulas.length;
    const percentagem = todosConcluido
      ? 100
      : aulas.length
        ? Math.min(99, Math.round((concluidoContar / aulas.length) * 100))
        : 0;

    await executar(
      'UPDATE inscricoes SET percentagem_progresso = $1, concluido_em = $2, id_ultima_aula = $3 WHERE id = $4',
      [percentagem, percentagem === 100 ? agora : null, aulaId, inscricao.id],
    );

    const certificado =
      todosConcluido && (await podeEmitirCertificado(utilizador.id, curso.id))
        ? await emitirCertificado(utilizador.id, curso.id)
        : null;

    return {
      certificate: certificado,
      enrollment: {
        ...(await consultarUm('SELECT * FROM consulta_inscricoes WHERE id = $1', [inscricao.id])),
        lessonProgresses: progressoRegistos.map((registo) => ({
          ...registo,
          isCompleted: Boolean(registo.completed),
        })),
      },
      xpGained: 0,
      completedCount: concluidoContar,
      totalCount: aulas.length,
    };
  });
}

exports.podeEmitirCertificado = podeEmitirCertificado;
exports.emitirCertificado = emitirCertificado;
exports.concluirAula = concluirAula;
