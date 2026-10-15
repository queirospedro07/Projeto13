import { completeLesson } from '../services/progress.js';
import { Router } from 'express';
import { queryOne, queryAll, execute, transaction } from '../database/connection.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { canManageCourse, canStudyCourse } from '../services/courseAccess.js';
import {
  loadAssessment,
  publicAssessment,
  gradeAssessment,
  recordAssessment,
} from '../services/assessments.js';
const router = Router();

router.get('/reviews', authenticate, requireRole('CREATOR', 'ADMIN'), (req, res) => {
  const rows = queryAll(
    `SELECT s.*, u.name AS studentName, l.title AS lessonTitle, m.courseId FROM submissoes_questionario s JOIN users u ON u.id = s.id_utilizador JOIN lessons l ON l.id = s.id_aula JOIN course_modules m ON m.id = l.moduleId WHERE s.pendente = 1 ORDER BY s.criado_em LIMIT 200`,
  );
  return res.json(
    rows
      .filter((row) =>
        canManageCourse(req.user, queryOne('SELECT * FROM courses WHERE id = ?', [row.courseId])),
      )
      .map((row) => ({
        id: row.id,
        studentName: row.studentName,
        lessonTitle: row.lessonTitle,
        submittedAt: row.criado_em,
        answers: JSON.parse(row.respostas),
        quiz: publicAssessment(loadAssessment(row.id_aula)),
      })),
  );
});
router.put('/reviews/:id', authenticate, requireRole('CREATOR', 'ADMIN'), (req, res) => {
  const attempt = queryOne('SELECT * FROM submissoes_questionario WHERE id = ?', [req.params.id]);
  if (!attempt) return res.status(404).json({ error: 'Submissão não encontrada.' });
  const quiz = loadAssessment(attempt.id_aula);
  if (
    !quiz ||
    !canManageCourse(req.user, queryOne('SELECT * FROM courses WHERE id = ?', [quiz.courseId]))
  )
    return res.status(403).json({ error: 'Sem permissão para avaliar esta submissão.' });
  const score = req.body.score;
  if (!Number.isInteger(score) || score < 0 || score > 100)
    return res.status(400).json({ error: 'A nota deve ser um número inteiro entre 0 e 100.' });
  const result = {
    ...JSON.parse(attempt.resultado),
    score,
    passed: score >= quiz.passingScore,
    pendingTeacherReviewCount: 0,
  };
  transaction(() => {
    execute(
      'UPDATE submissoes_questionario SET nota = ?, aprovado = ?, pendente = 0, resultado = ?, revisto_por = ?, revisto_em = ? WHERE id = ?',
      [
        score,
        result.passed ? 1 : 0,
        JSON.stringify(result),
        req.user.id,
        new Date().toISOString(),
        attempt.id,
      ],
    );
    if (result.passed) completeLesson({ id: attempt.id_utilizador }, quiz.courseId, quiz.lessonId);
  });
  return res.json(result);
});
router.get('/lesson/:lessonId', authenticate, (req, res) => {
  const quiz = loadAssessment(req.params.lessonId);
  if (!quiz) return res.status(404).json({ error: 'Questionário não encontrado.' });
  if (!canStudyCourse(req.user, queryOne('SELECT * FROM courses WHERE id = ?', [quiz.courseId])))
    return res.status(403).json({ error: 'Inscreva-se no curso para aceder ao questionário.' });
  const latest = queryOne(
    'SELECT resultado FROM submissoes_questionario WHERE id_utilizador = ? AND id_aula = ? ORDER BY criado_em DESC LIMIT 1',
    [req.user.id, quiz.lessonId],
  );
  return res.json({
    ...publicAssessment(quiz),
    latestAttempt: latest ? JSON.parse(latest.resultado) : null,
  });
});
router.post('/:quizId/submit', authenticate, (req, res) => {
  const stored = queryOne('SELECT lessonId FROM quizzes WHERE id = ?', [req.params.quizId]);
  const quiz = loadAssessment(stored?.lessonId || req.params.quizId);
  if (!quiz) return res.status(404).json({ error: 'Questionário não encontrado.' });
  if (!canStudyCourse(req.user, queryOne('SELECT * FROM courses WHERE id = ?', [quiz.courseId])))
    return res.status(403).json({ error: 'Sem acesso a este questionário.' });
  try {
    const result = gradeAssessment(quiz, req.body.answers);
    const attemptId = recordAssessment(req.user.id, quiz, req.body.answers, result);
    return res.json({ ...result, attemptId });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
export default router;
