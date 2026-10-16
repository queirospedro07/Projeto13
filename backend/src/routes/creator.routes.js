const { validateCourseBody } = require('../validation/content.js');
const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth.js');
const {
  getCreatorApplicationStatus,
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

// Obter estado da candidatura a criador do utilizador autenticado
router.get('/application-status', authenticate, asyncHandler(getCreatorApplicationStatus));

// Submeter inquérito de candidatura a criador / formador
router.post('/apply', authenticate, asyncHandler(postCreatorApply));
router.get('/stats', authenticate, requireRole('CREATOR', 'ADMIN'), asyncHandler(getCreatorStats));
router.get(
  '/courses/:courseId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(getCreatorCoursesByCourseId),
);
router.put(
  '/courses/:courseId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  validateCourseBody,
  asyncHandler(putCreatorCoursesByCourseId),
);
router.get(
  '/courses',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(getCreatorCourses),
);
router.delete(
  '/courses/:courseId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(deleteCreatorCoursesByCourseId),
);
router.post(
  '/courses',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  validateCourseBody,
  asyncHandler(postCreatorCourses),
);
router.get(
  '/members',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(getCreatorMembers),
);
router.get(
  '/courses/:courseId/collaborators',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(getCreatorCoursesByCourseIdCollaborators),
);
router.post(
  '/courses/:courseId/collaborators',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(postCreatorCoursesByCourseIdCollaborators),
);
router.delete(
  '/courses/:courseId/collaborators/:targetUserId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(deleteCreatorCoursesByCourseIdCollaboratorsByTargetUserId),
);
router.delete(
  '/courses/:courseId/members/:userId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(deleteCreatorCoursesByCourseIdMembersByUserId),
);
router.post(
  '/courses/:courseId/enrollments',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(postCreatorCoursesByCourseIdEnrollments),
);
router.post(
  '/courses/:courseId/submit-review',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  asyncHandler(postCreatorCoursesByCourseIdSubmitReview),
);
module.exports = router;
