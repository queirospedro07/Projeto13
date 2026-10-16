const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth.js');
const {
  getQuizReviews,
  putQuizReviewsById,
  getQuizLessonByLessonId,
  postQuizByQuizIdSubmit,
} = require('../controllers/quiz.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();
router.get('/reviews', authenticate, requireRole('CREATOR', 'ADMIN'), asyncHandler(getQuizReviews));
router.put(
  '/reviews/:id',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(putQuizReviewsById),
);
router.get('/lesson/:lessonId', authenticate, asyncHandler(getQuizLessonByLessonId));
router.post('/:quizId/submit', authenticate, asyncHandler(postQuizByQuizIdSubmit));
module.exports = router;
