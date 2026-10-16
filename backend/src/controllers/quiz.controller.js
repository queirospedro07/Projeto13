const Quiz = require('../models/Quiz.js');
const { asyncFilter, asyncMap } = require('../utils/asyncCollections.js');
const { completeLesson } = require('../services/progress.js');
const { transaction } = require('../database/connection.js');
const { canManageCourse, canStudyCourse } = require('../services/courseAccess.js');
const {
  loadAssessment,
  publicAssessment,
  gradeAssessment,
  recordAssessment,
} = require('../services/assessments.js');
const getQuizReviews = async (req, res) => {
  const rows = await Quiz.listSubmissoesQuestionario();
  return res.json(
    await asyncMap(
      await asyncFilter(
        rows,
        async (row) => await canManageCourse(req.user, await Quiz.findCoursesById([row.courseId])),
      ),
      async (row) => ({
        id: row.id,
        studentName: row.studentName,
        lessonTitle: row.lessonTitle,
        submittedAt: row.criado_em,
        answers: JSON.parse(row.respostas),
        quiz: publicAssessment(await loadAssessment(row.id_aula)),
      }),
    ),
  );
};
const putQuizReviewsById = async (req, res) => {
  const attempt = await Quiz.findAttemptById([req.params.id]);
  if (!attempt)
    return res.status(404).json({
      error: 'Submissão não encontrada.',
    });
  const quiz = await loadAssessment(attempt.id_aula);
  if (!quiz || !(await canManageCourse(req.user, await Quiz.findCoursesById([quiz.courseId]))))
    return res.status(403).json({
      error: 'Sem permissão para avaliar esta submissão.',
    });
  const score = req.body.score;
  if (!Number.isInteger(score) || score < 0 || score > 100)
    return res.status(400).json({
      error: 'A nota deve ser um número inteiro entre 0 e 100.',
    });
  const result = {
    ...JSON.parse(attempt.resultado),
    score,
    passed: score >= quiz.passingScore,
    pendingTeacherReviewCount: 0,
  };
  await transaction(async () => {
    await Quiz.reviewQuizSubmission([
      score,
      result.passed ? 1 : 0,
      JSON.stringify(result),
      req.user.id,
      new Date().toISOString(),
      attempt.id,
    ]);
    if (result.passed)
      await completeLesson(
        {
          id: attempt.id_utilizador,
        },
        quiz.courseId,
        quiz.lessonId,
      );
  });
  return res.json(result);
};
const getQuizLessonByLessonId = async (req, res) => {
  const quiz = await loadAssessment(req.params.lessonId);
  if (!quiz)
    return res.status(404).json({
      error: 'Questionário não encontrado.',
    });
  if (!(await canStudyCourse(req.user, await Quiz.findCoursesById([quiz.courseId]))))
    return res.status(403).json({
      error: 'Inscreva-se no curso para aceder ao questionário.',
    });
  const latest = await Quiz.findLatestByIdUtilizadorAndIdAula([req.user.id, quiz.lessonId]);
  return res.json({
    ...publicAssessment(quiz),
    latestAttempt: latest ? JSON.parse(latest.resultado) : null,
  });
};
const postQuizByQuizIdSubmit = async (req, res) => {
  const stored = await Quiz.findStoredById([req.params.quizId]);
  const quiz = await loadAssessment(stored?.lessonId || req.params.quizId);
  if (!quiz)
    return res.status(404).json({
      error: 'Questionário não encontrado.',
    });
  if (!(await canStudyCourse(req.user, await Quiz.findCoursesById([quiz.courseId]))))
    return res.status(403).json({
      error: 'Sem acesso a este questionário.',
    });
  try {
    const result = gradeAssessment(quiz, req.body.answers);
    const attemptId = await recordAssessment(req.user.id, quiz, req.body.answers, result);
    return res.json({
      ...result,
      attemptId,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
};
exports.getQuizReviews = getQuizReviews;
exports.putQuizReviewsById = putQuizReviewsById;
exports.getQuizLessonByLessonId = getQuizLessonByLessonId;
exports.postQuizByQuizIdSubmit = postQuizByQuizIdSubmit;
