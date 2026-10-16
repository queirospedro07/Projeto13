const Project = require('../models/Project.js');
const { asyncFilter } = require('../utils/asyncCollections.js');
const { randomUUID } = require('node:crypto');
const { transaction } = require('../database/connection.js');
const {
  canStudyCourse,
  canManageCourse,
  lessonWithCourse,
} = require('../services/courseAccess.js');
const { completeLesson } = require('../services/progress.js');
const getProjectReviews = async (req, res) => {
  const rows = await Project.listSubmissoesProjeto();
  return res.json(
    await asyncFilter(
      rows,
      async (r) => await canManageCourse(req.user, await Project.findCoursesById([r.courseId])),
    ),
  );
};
const putProjectReviewsById = async (req, res) => {
  const row = await Project.findSubmissoesProjetoById([req.params.id]);
  const lesson = row && (await lessonWithCourse(row.id_aula));
  if (!lesson)
    return res.status(404).json({
      error: 'Projeto não encontrado.',
    });
  if (!(await canManageCourse(req.user, await Project.findCoursesById([lesson.courseId]))))
    return res.status(403).json({
      error: 'Sem permissão para avaliar este projeto.',
    });
  if (
    !['APPROVED', 'CHANGES_REQUESTED'].includes(req.body.status) ||
    typeof req.body.feedback !== 'string' ||
    req.body.feedback.length > 2000
  )
    return res.status(400).json({
      error: 'Avaliação inválida. Inclua um parecer com até 2000 caracteres.',
    });
  await transaction(async () => {
    await Project.reviewProjectSubmission([
      req.body.status,
      req.body.feedback.trim(),
      req.user.id,
      new Date().toISOString(),
      row.id,
    ]);
    if (req.body.status === 'APPROVED')
      await completeLesson(
        {
          id: row.id_utilizador,
        },
        lesson.courseId,
        lesson.id,
      );
  });
  return res.json({
    status: req.body.status,
    feedback: req.body.feedback.trim(),
  });
};
const getProjectLessonById = async (req, res) => {
  const lesson = await lessonWithCourse(req.params.id);
  if (!lesson || lesson.type !== 'project')
    return res.status(404).json({
      error: 'Projeto não encontrado.',
    });
  if (!(await canStudyCourse(req.user, await Project.findCoursesById([lesson.courseId]))))
    return res.status(403).json({
      error: 'Sem acesso ao projeto.',
    });
  return res.json(
    (await Project.findSubmissoesProjetoByIdUtilizadorAndIdAula([req.user.id, lesson.id])) || null,
  );
};
const postProjectLessonById = async (req, res) => {
  const lesson = await lessonWithCourse(req.params.id);
  if (!lesson || lesson.type !== 'project')
    return res.status(404).json({
      error: 'Projeto não encontrado.',
    });
  if (!(await canStudyCourse(req.user, await Project.findCoursesById([lesson.courseId]))))
    return res.status(403).json({
      error: 'Sem acesso ao projeto.',
    });
  let url;
  try {
    url = new URL(req.body.url);
  } catch {
    return res.status(400).json({
      error: 'Use um link http ou https para o seu projeto.',
    });
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.href.length > 2000
  )
    return res.status(400).json({
      error: 'Link de projeto inválido.',
    });
  const id = randomUUID();
  await Project.insertSubmissoesProjeto([
    id,
    req.user.id,
    lesson.id,
    url.href,
    new Date().toISOString(),
  ]);
  return res.status(201).json({
    id,
    url: url.href,
    status: 'SUBMITTED',
    feedback: '',
  });
};
exports.getProjectReviews = getProjectReviews;
exports.putProjectReviewsById = putProjectReviewsById;
exports.getProjectLessonById = getProjectLessonById;
exports.postProjectLessonById = postProjectLessonById;
