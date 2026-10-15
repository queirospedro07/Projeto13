import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { queryOne, queryAll, execute, transaction } from '../database/connection.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { canStudyCourse, canManageCourse, lessonWithCourse } from '../services/courseAccess.js';
import { completeLesson } from '../services/progress.js';
const router = Router();
router.use(authenticate);
router.get('/reviews', requireRole('CREATOR', 'ADMIN'), (req, res) => {
  const rows = queryAll(
    `SELECT s.*, u.name AS studentName, l.title AS lessonTitle, m.courseId FROM submissoes_projeto s JOIN users u ON u.id = s.id_utilizador JOIN lessons l ON l.id = s.id_aula JOIN course_modules m ON m.id = l.moduleId WHERE s.estado = 'SUBMITTED' ORDER BY s.criado_em LIMIT 200`,
  );
  return res.json(
    rows.filter((r) =>
      canManageCourse(req.user, queryOne('SELECT * FROM courses WHERE id = ?', [r.courseId])),
    ),
  );
});
router.put('/reviews/:id', requireRole('CREATOR', 'ADMIN'), (req, res) => {
  const row = queryOne('SELECT * FROM submissoes_projeto WHERE id = ?', [req.params.id]);
  const lesson = row && lessonWithCourse(row.id_aula);
  if (!lesson) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (!canManageCourse(req.user, queryOne('SELECT * FROM courses WHERE id = ?', [lesson.courseId])))
    return res.status(403).json({ error: 'Sem permissão para avaliar este projeto.' });
  if (
    !['APPROVED', 'CHANGES_REQUESTED'].includes(req.body.status) ||
    typeof req.body.feedback !== 'string' ||
    req.body.feedback.length > 2000
  )
    return res
      .status(400)
      .json({ error: 'Avaliação inválida. Inclua um parecer com até 2000 caracteres.' });
  transaction(() => {
    execute(
      'UPDATE submissoes_projeto SET estado = ?, parecer = ?, revisto_por = ?, revisto_em = ? WHERE id = ?',
      [req.body.status, req.body.feedback.trim(), req.user.id, new Date().toISOString(), row.id],
    );
    if (req.body.status === 'APPROVED')
      completeLesson({ id: row.id_utilizador }, lesson.courseId, lesson.id);
  });
  return res.json({ status: req.body.status, feedback: req.body.feedback.trim() });
});
router.get('/lesson/:id', (req, res) => {
  const lesson = lessonWithCourse(req.params.id);
  if (!lesson || lesson.type !== 'project')
    return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (!canStudyCourse(req.user, queryOne('SELECT * FROM courses WHERE id = ?', [lesson.courseId])))
    return res.status(403).json({ error: 'Sem acesso ao projeto.' });
  return res.json(
    queryOne(
      'SELECT id, url, estado AS status, parecer AS feedback FROM submissoes_projeto WHERE id_utilizador = ? AND id_aula = ? ORDER BY criado_em DESC LIMIT 1',
      [req.user.id, lesson.id],
    ) || null,
  );
});
router.post('/lesson/:id', (req, res) => {
  const lesson = lessonWithCourse(req.params.id);
  if (!lesson || lesson.type !== 'project')
    return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (!canStudyCourse(req.user, queryOne('SELECT * FROM courses WHERE id = ?', [lesson.courseId])))
    return res.status(403).json({ error: 'Sem acesso ao projeto.' });
  let url;
  try {
    url = new URL(req.body.url);
  } catch {
    return res.status(400).json({ error: 'Use um link http ou https para o seu projeto.' });
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.href.length > 2000
  )
    return res.status(400).json({ error: 'Link de projeto inválido.' });
  const id = randomUUID();
  execute(
    'INSERT INTO submissoes_projeto (id, id_utilizador, id_aula, url, criado_em) VALUES (?, ?, ?, ?, ?)',
    [id, req.user.id, lesson.id, url.href, new Date().toISOString()],
  );
  return res.status(201).json({ id, url: url.href, status: 'SUBMITTED', feedback: '' });
});
export default router;
