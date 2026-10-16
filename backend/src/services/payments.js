const { randomUUID } = require('node:crypto');
const {
  execute,
  queryOne,
  queryAll,
  transaction,
  lockTransaction,
} = require('../database/connection.js');
async function simulatePayment(user, courseId, input = {}) {
  const { method, outcome, expectedAmountCents } = input && typeof input === 'object' ? input : {};
  if (
    !['card', 'mbway', 'multibanco'].includes(method) ||
    !['approved', 'declined'].includes(outcome)
  ) {
    throw Object.assign(new Error('Escolha um método e um resultado de simulação válidos.'), {
      status: 400,
    });
  }
  if (
    expectedAmountCents !== undefined &&
    (!Number.isSafeInteger(expectedAmountCents) || expectedAmountCents <= 0)
  ) {
    throw Object.assign(new Error('O montante de confirmação é inválido.'), { status: 400 });
  }
  return await transaction(async () => {
    const course = await queryOne('SELECT * FROM courses WHERE id = $1 OR slug = $2 FOR SHARE', [
      courseId,
      courseId,
    ]);
    if (
      !course ||
      course.isPublished !== 1 ||
      (course.approvalStatus && course.approvalStatus !== 'APPROVED')
    ) {
      throw Object.assign(new Error('Curso indisponível.'), {
        status: 404,
      });
    }
    if (course.isFree === 1 || !(Number(course.price) > 0)) {
      throw Object.assign(new Error('Este curso não necessita de pagamento.'), {
        status: 400,
      });
    }
    await lockTransaction(`enrollment:${user.id}:${course.id}`);
    const existing = await queryOne(
      'SELECT id FROM enrollments WHERE "userId" = $1 AND "courseId" = $2',
      [user.id, course.id],
    );
    if (existing)
      return {
        alreadyEnrolled: true,
        enrollmentId: existing.id,
      };
    const currentAmountCents = Math.round(Number(course.price) * 100);
    if (
      await queryOne(
        "SELECT id FROM simulacoes_pagamento WHERE id_utilizador = $1 AND id_curso = $2 AND estado = 'approved'",
        [user.id, course.id],
      )
    ) {
      throw Object.assign(
        new Error(
          'Já existe uma compra aprovada para este curso. Contacte o formador para recuperar o acesso.',
        ),
        { status: 409 },
      );
    }
    if (expectedAmountCents !== undefined && expectedAmountCents !== currentAmountCents) {
      throw Object.assign(
        new Error('O preço do curso mudou. Atualize a página e confirme novamente o valor.'),
        { status: 409 },
      );
    }
    const payment = {
      id: randomUUID(),
      courseId: course.id,
      amountCents: currentAmountCents,
      currency: 'EUR',
      method,
      status: outcome,
      createdAt: new Date().toISOString(),
      simulated: true,
    };
    await execute(
      `INSERT INTO simulacoes_pagamento
      (id, id_utilizador, id_curso, montante_centimos, metodo, estado, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [payment.id, user.id, course.id, payment.amountCents, method, outcome, payment.createdAt],
    );
    if (outcome === 'approved') {
      await execute(
        'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0)',
        [randomUUID(), user.id, course.id, payment.createdAt],
      );
      if (
        course.spaceId &&
        !(await queryOne('SELECT id FROM memberships WHERE "userId" = $1 AND "spaceId" = $2', [
          user.id,
          course.spaceId,
        ]))
      ) {
        await execute(
          "INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em) VALUES ($1, $2, $3, 'MEMBER', $4) ON CONFLICT (id_utilizador, id_espaco) DO NOTHING",
          [randomUUID(), user.id, course.spaceId, payment.createdAt],
        );
      }
    }
    return payment;
  });
}
async function getPaymentHistory(userId) {
  return await queryAll(
    `SELECT p.id, p.id_curso AS "courseId", c.titulo AS "courseTitle",
    p.montante_centimos AS "amountCents", p.moeda AS currency, p.metodo AS method,
    p.estado AS status, p.criado_em AS "createdAt"
    FROM simulacoes_pagamento p JOIN cursos c ON c.id = p.id_curso
    WHERE p.id_utilizador = $1 ORDER BY p.criado_em DESC LIMIT 100`,
    [userId],
  );
}
exports.simulatePayment = simulatePayment;
exports.getPaymentHistory = getPaymentHistory;
