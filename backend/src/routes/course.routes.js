const { Router } = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.js');
const {
  getCourseMyLearning,
  postCourseByCourseIdToggleHide,
  getCourse,
  getCourseById,
  getCourseByIdClassmates,
  postCourseByIdEnroll,
  postCourseByIdLessonsByLessonIdComplete,
  postCourseByCourseIdReviews,
} = require('../controllers/course.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();
router.get('/my-learning', authenticate, asyncHandler(getCourseMyLearning));
router.post('/:courseId/toggle-hide', authenticate, asyncHandler(postCourseByCourseIdToggleHide));
router.get('/', optionalAuth, asyncHandler(getCourse));
router.get('/:id', optionalAuth, asyncHandler(getCourseById));
router.get('/:id/classmates', optionalAuth, asyncHandler(getCourseByIdClassmates));
router.post('/:id/enroll', authenticate, asyncHandler(postCourseByIdEnroll));
router.post(
  '/:id/lessons/:lessonId/complete',
  authenticate,
  asyncHandler(postCourseByIdLessonsByLessonIdComplete),
);
router.post('/:courseId/reviews', authenticate, asyncHandler(postCourseByCourseIdReviews));
module.exports = router;
