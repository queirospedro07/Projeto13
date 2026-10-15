import { randomUUID } from 'node:crypto';
import { queryOne, queryAll, execute, transaction } from '../database/connection.js';
import { hasPassedAssessment } from './assessments.js';
import { canManageCourse } from './courseAccess.js';

const failure = (status, message) => Object.assign(new Error(message), { status });
export function eligibleForCertificate(userId, courseId) {
  const enrollment = queryOne('SELECT id FROM enrollments WHERE userId = ? AND courseId = ?', [
    userId,
    courseId,
  ]);
  if (!enrollment) return false;
  const lessons = queryAll(
    'SELECT l.id, l.type FROM lessons l JOIN course_modules m ON m.id = l.moduleId WHERE m.courseId = ?',
    [courseId],
  );
  return (
    lessons.length > 0 &&
    lessons.every(
      (lesson) =>
        queryOne(
          'SELECT id FROM lesson_progress WHERE enrollmentId = ? AND lessonId = ? AND completed = 1',
          [enrollment.id, lesson.id],
        ) &&
        (lesson.type !== 'quiz' || hasPassedAssessment(userId, lesson.id)) &&
        (lesson.type !== 'project' ||
          Boolean(
            queryOne(
              "SELECT id FROM submissoes_projeto WHERE id_utilizador = ? AND id_aula = ? AND estado = 'APPROVED'",
              [userId, lesson.id],
            ),
          )),
    )
  );
}
export function issueCertificate(userId, courseId) {
  return transaction(() => {
    if (!eligibleForCertificate(userId, courseId))
      throw failure(400, 'Conclua todas as aulas e avaliações antes de pedir o certificado.');
    const existing = queryOne('SELECT * FROM certificates WHERE userId = ? AND courseId = ?', [
      userId,
      courseId,
    ]);
    if (existing) return existing;
    const user = queryOne('SELECT name FROM users WHERE id = ?', [userId]);
    const course = queryOne('SELECT title FROM courses WHERE id = ?', [courseId]);
    const id = randomUUID();
    execute(
      'INSERT INTO certificates (id, userId, courseId, recipientName, courseTitle, credentialId, issuedAt, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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
    return queryOne('SELECT * FROM certificates WHERE id = ?', [id]);
  });
}
export function completeLesson(user, courseIdentifier, lessonId) {
  return transaction(() => {
    const course = queryOne('SELECT * FROM courses WHERE id = ? OR slug = ?', [
      courseIdentifier,
      courseIdentifier,
    ]);
    if (!course) throw failure(404, 'Curso não encontrado.');
    const lesson = queryOne(
      'SELECT l.* FROM lessons l JOIN course_modules m ON m.id = l.moduleId WHERE l.id = ? AND m.courseId = ?',
      [lessonId, course.id],
    );
    if (!lesson) throw failure(404, 'Aula não encontrada neste curso.');
    if (lesson.type === 'quiz' && !hasPassedAssessment(user.id, lessonId))
      throw failure(403, 'Obtenha aprovação no questionário antes de concluir esta aula.');
    if (
      lesson.type === 'project' &&
      !queryOne(
        "SELECT id FROM submissoes_projeto WHERE id_utilizador = ? AND id_aula = ? AND estado = 'APPROVED'",
        [user.id, lesson.id],
      )
    )
      throw failure(403, 'O projeto deve ser aprovado pelo formador.');
    let enrollment = queryOne('SELECT * FROM enrollments WHERE userId = ? AND courseId = ?', [
      user.id,
      course.id,
    ]);
    const now = new Date().toISOString();
    if (!enrollment) {
      const free =
        course.isFree === 1 && course.isPublished === 1 && course.approvalStatus === 'APPROVED';
      if (!free && !canManageCourse(user, course))
        throw failure(403, 'Inscreva-se no curso antes de concluir aulas.');
      execute(
        'INSERT INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 0)',
        [randomUUID(), user.id, course.id, now],
      );
      enrollment = queryOne('SELECT * FROM enrollments WHERE userId = ? AND courseId = ?', [
        user.id,
        course.id,
      ]);
    }
    const progress = queryOne(
      'SELECT * FROM lesson_progress WHERE enrollmentId = ? AND lessonId = ?',
      [enrollment.id, lessonId],
    );
    if (!progress?.completed) {
      if (progress)
        execute('UPDATE lesson_progress SET completed = 1, completedAt = ? WHERE id = ?', [
          now,
          progress.id,
        ]);
      else
        execute(
          'INSERT INTO lesson_progress (id, enrollmentId, lessonId, completed, completedAt) VALUES (?, ?, ?, 1, ?)',
          [randomUUID(), enrollment.id, lessonId, now],
        );
    }
    const lessons = queryAll(
      'SELECT l.id FROM lessons l JOIN course_modules m ON m.id = l.moduleId WHERE m.courseId = ?',
      [course.id],
    );
    const progressRows = queryAll('SELECT * FROM lesson_progress WHERE enrollmentId = ?', [
      enrollment.id,
    ]);
    const done = new Set(
      progressRows.filter((row) => row.completed === 1).map((row) => row.lessonId),
    );
    const completedCount = lessons.filter((row) => done.has(row.id)).length;
    const percent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
    execute(
      'UPDATE enrollments SET progressPercent = ?, completedAt = ?, lastLessonId = ? WHERE id = ?',
      [percent, percent === 100 ? now : null, lessonId, enrollment.id],
    );
    if (percent === 100 && eligibleForCertificate(user.id, course.id))
      issueCertificate(user.id, course.id);
    return {
      enrollment: {
        ...queryOne('SELECT * FROM enrollments WHERE id = ?', [enrollment.id]),
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
