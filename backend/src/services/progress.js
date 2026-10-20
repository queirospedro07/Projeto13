const { asyncEvery } = require('../utils/asyncCollections.js');
const { randomUUID } = require('node:crypto');
const {
  queryOne,
  queryAll,
  execute,
  transaction,
  lockTransaction,
} = require('../database/connection.js');
const { hasPassedAssessment } = require('./assessments.js');
const { canManageCourse } = require('./courseAccess.js');
const failure = (status, message) =>
  Object.assign(new Error(message), {
    status,
  });
async function eligibleForCertificate(userId, courseId) {
  const enrollment = await queryOne(
    'SELECT id FROM enrollments WHERE "userId" = $1 AND "courseId" = $2',
    [userId, courseId],
  );
  if (!enrollment) return false;
  const lessons = await queryAll(
    'SELECT l.id, l.type FROM lessons l JOIN course_modules m ON m.id = l."moduleId" WHERE m."courseId" = $1',
    [courseId],
  );
  return (
    lessons.length > 0 &&
    (await asyncEvery(
      lessons,
      async (lesson) =>
        (await queryOne(
          'SELECT id FROM lesson_progress WHERE "enrollmentId" = $1 AND "lessonId" = $2 AND completed = 1',
          [enrollment.id, lesson.id],
        )) &&
        (lesson.type !== 'quiz' || (await hasPassedAssessment(userId, lesson.id))) &&
        (lesson.type !== 'project' ||
          Boolean(
            await queryOne(
              "SELECT id FROM submissoes_projeto WHERE id_utilizador = $1 AND id_aula = $2 AND estado = 'APPROVED'",
              [userId, lesson.id],
            ),
          )),
    ))
  );
}
async function issueCertificate(userId, courseId) {
  return await transaction(async () => {
    await lockTransaction(`certificate:${userId}:${courseId}`);
    if (!(await eligibleForCertificate(userId, courseId)))
      throw failure(400, 'Conclua todas as aulas e avaliações antes de pedir o certificado.');
    const existing = await queryOne(
      'SELECT * FROM certificates WHERE "userId" = $1 AND "courseId" = $2',
      [userId, courseId],
    );
    if (existing) return existing;
    const user = await queryOne('SELECT name FROM users WHERE id = $1', [userId]);
    const course = await queryOne('SELECT title FROM courses WHERE id = $1', [courseId]);
    const id = randomUUID();
    await execute(
      'INSERT INTO certificados (id, id_utilizador, id_curso, nome_destinatario, titulo_curso, id_credencial, emitido_em, pontuacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        id,
        userId,
        courseId,
        user.name,
        course.title,
        `NEXO-${randomUUID().replaceAll('-', '').toUpperCase()}`,
        new Date().toISOString(),
        100,
      ],
    );
    return await queryOne('SELECT * FROM certificates WHERE id = $1', [id]);
  });
}
async function completeLesson(user, courseIdentifier, lessonId) {
  return await transaction(async () => {
    const course = await queryOne('SELECT * FROM courses WHERE id = $1 OR slug = $2', [
      courseIdentifier,
      courseIdentifier,
    ]);
    if (!course) throw failure(404, 'Curso não encontrado.');
    await lockTransaction(`enrollment:${user.id}:${course.id}`);
    const lesson = await queryOne(
      'SELECT l.* FROM lessons l JOIN course_modules m ON m.id = l."moduleId" WHERE l.id = $1 AND m."courseId" = $2',
      [lessonId, course.id],
    );
    if (!lesson) throw failure(404, 'Aula não encontrada neste curso.');
    if (lesson.type === 'quiz' && !(await hasPassedAssessment(user.id, lessonId)))
      throw failure(403, 'Obtenha aprovação no questionário antes de concluir esta aula.');
    if (
      lesson.type === 'project' &&
      !(await queryOne(
        "SELECT id FROM submissoes_projeto WHERE id_utilizador = $1 AND id_aula = $2 AND estado = 'APPROVED'",
        [user.id, lesson.id],
      ))
    )
      throw failure(403, 'O projeto deve ser aprovado pelo formador.');
    let enrollment = await queryOne(
      'SELECT * FROM enrollments WHERE "userId" = $1 AND "courseId" = $2',
      [user.id, course.id],
    );
    const now = new Date().toISOString();
    if (!enrollment) {
      if (!(await canManageCourse(user, course)))
        throw failure(403, 'Inscreva-se no curso antes de concluir aulas.');
      await execute(
        'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0)',
        [randomUUID(), user.id, course.id, now],
      );
      enrollment = await queryOne(
        'SELECT * FROM enrollments WHERE "userId" = $1 AND "courseId" = $2',
        [user.id, course.id],
      );
    }
    const progress = await queryOne(
      'SELECT * FROM lesson_progress WHERE "enrollmentId" = $1 AND "lessonId" = $2',
      [enrollment.id, lessonId],
    );
    if (!progress?.completed) {
      if (progress)
        await execute('UPDATE progresso_aulas SET concluido = 1, concluido_em = $1 WHERE id = $2', [
          now,
          progress.id,
        ]);
      else
        await execute(
          'INSERT INTO progresso_aulas (id, id_inscricao, id_aula, concluido, concluido_em) VALUES ($1, $2, $3, 1, $4)',
          [randomUUID(), enrollment.id, lessonId, now],
        );
    }
    const lessons = await queryAll(
      'SELECT l.id FROM lessons l JOIN course_modules m ON m.id = l."moduleId" WHERE m."courseId" = $1',
      [course.id],
    );
    const progressRows = await queryAll('SELECT * FROM lesson_progress WHERE "enrollmentId" = $1', [
      enrollment.id,
    ]);
    const done = new Set(
      progressRows.filter((row) => row.completed === 1).map((row) => row.lessonId),
    );
    const completedCount = lessons.filter((row) => done.has(row.id)).length;
    const allCompleted = lessons.length > 0 && completedCount === lessons.length;
    const percent = allCompleted
      ? 100
      : lessons.length
        ? Math.min(99, Math.round((completedCount / lessons.length) * 100))
        : 0;
    await execute(
      'UPDATE inscricoes SET percentagem_progresso = $1, concluido_em = $2, id_ultima_aula = $3 WHERE id = $4',
      [percent, percent === 100 ? now : null, lessonId, enrollment.id],
    );
    const certificate =
      allCompleted && (await eligibleForCertificate(user.id, course.id))
        ? await issueCertificate(user.id, course.id)
        : null;
    return {
      certificate,
      enrollment: {
        ...(await queryOne('SELECT * FROM enrollments WHERE id = $1', [enrollment.id])),
        lessonProgresses: progressRows.map((row) => ({
          ...row,
          isCompleted: Boolean(row.completed),
        })),
      },
      xpGained: 0,
      completedCount,
      totalCount: lessons.length,
    };
  });
}
exports.eligibleForCertificate = eligibleForCertificate;
exports.issueCertificate = issueCertificate;
exports.completeLesson = completeLesson;
