const { validateCourseBody } = require('../validation/content.js');
const { Router } = require('express');
const { authenticate, requireRole, requireTeaching } = require('../middleware/auth.js');
const {
  getCreatorApplicationStatus,
  postCreatorCourseCommunity,
  postCreatorApply,
  getCreatorStats,
  getCreatorCoursesByCourseId,
  putCreatorCoursesByCourseId,
  getCreatorCourses,
  deleteCreatorCoursesByCourseId,
  postCreatorCourses,
  getCreatorMembers,
  getCreatorCoursesByCourseIdCollaborators,
  postCreatorCoursesByCourseIdCollaborators,
  deleteCreatorCoursesByCourseIdCollaboratorsByTargetUserId,
  deleteCreatorCoursesByCourseIdMembersByUserId,
  postCreatorCoursesByCourseIdEnrollments,
  postCreatorCoursesByCourseIdSubmitReview,
} = require('../controllers/creator.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();
router.post(
  '/courses/:courseId/community',
  authenticate,
  requireTeaching,
  asyncHandler(postCreatorCourseCommunity),
);

// Obter estado da candidatura a criador do utilizador autenticado
router.get('/application-status', authenticate, asyncHandler(getCreatorApplicationStatus));

// Submeter inquérito de candidatura a criador / formador
router.post('/apply', authenticate, asyncHandler(postCreatorApply));
router.get('/stats', authenticate, requireTeaching, asyncHandler(getCreatorStats));
router.get(
  '/courses/:courseId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(getCreatorCoursesByCourseId),
);
router.put(
  '/courses/:courseId',
  authenticate,
  requireTeaching,
  validateCourseBody,
  asyncHandler(putCreatorCoursesByCourseId),
);
router.get('/courses', authenticate, requireTeaching, asyncHandler(getCreatorCourses));
router.delete(
  '/courses/:courseId',
  authenticate,
  requireTeaching,
  asyncHandler(deleteCreatorCoursesByCourseId),
);
router.post(
  '/courses',
  authenticate,
  requireTeaching,
  validateCourseBody,
  asyncHandler(postCreatorCourses),
);
router.get('/members', authenticate, requireTeaching, asyncHandler(getCreatorMembers));
router.get(
  '/courses/:courseId/collaborators',
  authenticate,
  requireTeaching,
  asyncHandler(getCreatorCoursesByCourseIdCollaborators),
);
router.post(
  '/courses/:courseId/collaborators',
  authenticate,
  requireTeaching,
  asyncHandler(postCreatorCoursesByCourseIdCollaborators),
);
router.delete(
  '/courses/:courseId/collaborators/:targetUserId',
  authenticate,
  requireTeaching,
  asyncHandler(deleteCreatorCoursesByCourseIdCollaboratorsByTargetUserId),
);
router.delete(
  '/courses/:courseId/members/:userId',
  authenticate,
  requireTeaching,
  asyncHandler(deleteCreatorCoursesByCourseIdMembersByUserId),
);
router.post(
  '/courses/:courseId/enrollments',
  authenticate,
  requireTeaching,
  asyncHandler(postCreatorCoursesByCourseIdEnrollments),
);
router.post(
  '/courses/:courseId/submit-review',
  authenticate,
  requireTeaching,
  asyncHandler(postCreatorCoursesByCourseIdSubmitReview),
);
module.exports = router;
