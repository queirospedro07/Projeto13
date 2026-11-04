const { randomUUID } = require('node:crypto');
const {
  executar,
  consultarUm,
  consultarTodos,
  transacao,
  bloquearTransacao,
} = require('../database/connection.js');

async function simularPagamento(utilizador, cursoId, entrada = {}) {
  if (process.env.NODE_ENV === 'production') {
    throw Object.assign(
      new Error('A compra de cursos está indisponível. Contacte o formador para obter acesso.'),
      {
        status: 503,
      },
    );
  }

  const {
    method: metodo,
    outcome: resultado,
    expectedAmountCents,
  } = entrada && typeof entrada === 'object' ? entrada : {};
  if (
    !['card', 'mbway', 'multibanco'].includes(metodo) ||
    !['approved', 'declined'].includes(resultado)
  ) {
    throw Object.assign(new Error('Escolha um método e um resultado de simulação válidos.'), {
      status: 400,
    });
  }

  if (
    expectedAmountCents !== undefined &&
    (!Number.isSafeInteger(expectedAmountCents) || expectedAmountCents <= 0)
  ) {
    throw Object.assign(new Error('O montante de confirmação é inválido.'), {
      status: 400,
    });
  }

  return await transacao(async () => {
    const curso = await consultarUm(
      'SELECT * FROM consulta_cursos WHERE id = $1 OR slug = $2 FOR SHARE',
      [cursoId, cursoId],
    );
    if (
      !curso ||
      curso.estaPublicado !== 1 ||
      (curso.estadoAprovacao && curso.estadoAprovacao !== 'APPROVED')
    ) {
      throw Object.assign(new Error('Curso indisponível.'), {
        status: 404,
      });
    }

    if (curso.eGratuito === 1 || !(Number(curso.price) > 0)) {
      throw Object.assign(new Error('Este curso não necessita de pagamento.'), {
        status: 400,
      });
    }

    await bloquearTransacao(`enrollment:${utilizador.id}:${curso.id}`);

    const existente = await consultarUm(
      'SELECT id FROM consulta_inscricoes WHERE "idUtilizador" = $1 AND "idCurso" = $2',
      [utilizador.id, curso.id],
    );
    if (existente)
      return {
        alreadyEnrolled: true,
        idInscricao: existente.id,
      };
    const atualAmountCents = Math.round(Number(curso.price) * 100);
    if (atualAmountCents < 1)
      throw Object.assign(new Error('O preço do curso precisa de ser corrigido pelo formador.'), {
        status: 409,
      });
    if (
      await consultarUm(
        "SELECT id FROM simulacoes_pagamento WHERE id_utilizador = $1 AND id_curso = $2 AND estado = 'approved'",
        [utilizador.id, curso.id],
      )
    ) {
      throw Object.assign(
        new Error(
          'Já existe uma compra aprovada para este curso. Contacte o formador para recuperar o acesso.',
        ),
        {
          status: 409,
        },
      );
    }

    if (expectedAmountCents !== undefined && expectedAmountCents !== atualAmountCents) {
      throw Object.assign(
        new Error('O preço do curso mudou. Atualize a página e confirme novamente o valor.'),
        {
          status: 409,
        },
      );
    }

    const pagamento = {
      id: randomUUID(),
      idCurso: curso.id,
      amountCents: atualAmountCents,
      currency: 'EUR',
      method: metodo,
      status: resultado,
      criadoEm: new Date().toISOString(),
      simulated: true,
    };

    await executar(
      `INSERT INTO simulacoes_pagamento
      (id, id_utilizador, id_curso, montante_centimos, metodo, estado, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        pagamento.id,
        utilizador.id,
        curso.id,
        pagamento.amountCents,
        metodo,
        resultado,
        pagamento.criadoEm,
      ],
    );
    if (resultado === 'approved') {
      await executar(
        'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0)',
        [randomUUID(), utilizador.id, curso.id, pagamento.criadoEm],
      );
      if (
        curso.idEspaco &&
        !(await consultarUm(
          'SELECT id FROM consulta_membros_espacos WHERE "idUtilizador" = $1 AND "idEspaco" = $2',
          [utilizador.id, curso.idEspaco],
        ))
      ) {
        await executar(
          "INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em) VALUES ($1, $2, $3, 'MEMBER', $4) ON CONFLICT (id_utilizador, id_espaco) DO NOTHING",
          [randomUUID(), utilizador.id, curso.idEspaco, pagamento.criadoEm],
        );
      }
    }

    return pagamento;
  });
}

async function obterPagamentoHistorico(utilizadorId) {
  return await consultarTodos(
    `SELECT p.id, p.id_curso AS "idCurso", c.titulo AS "tituloCurso",
    p.montante_centimos AS "amountCents", p.moeda AS currency, p.metodo AS method,
    p.estado AS status, p.criado_em AS "criadoEm"
    FROM simulacoes_pagamento p JOIN cursos c ON c.id = p.id_curso
    WHERE p.id_utilizador = $1 ORDER BY p.criado_em DESC LIMIT 100`,
    [utilizadorId],
  );
}

exports.simularPagamento = simularPagamento;
exports.obterPagamentoHistorico = obterPagamentoHistorico;
