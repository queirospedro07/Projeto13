const { createReport } = require('../controllers/report.controller.js');
const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth.js');
const {
  getAdminStats,
  getAdminUsers,
  putAdminUserRole,
  putAdminUsersByIdSuspend,
  getAdminCreatorApplications,
  putAdminCreatorApplicationsByIdApprove,
  putAdminCreatorApplicationsByIdReject,
  getAdminCourses,
  putAdminCoursesByIdApprove,
  putAdminCoursesByIdReject,
  getAdminReports,
  putAdminReportsById,
} = require('../controllers/admin.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();

// ==============================================================
// ROTAS DE GESTÃO EXCLUSIVAS DE ADMINISTRADORES
// ==============================================================
// ROTAS DE GESTÃO EXCLUSIVAS DE ADMINISTRADORES

router.use(authenticate, requireRole('ADMIN'));
router.get('/stats', asyncHandler(getAdminStats));
router.get('/users', asyncHandler(getAdminUsers));
router.put('/users/:id/role', asyncHandler(putAdminUserRole));
router.put('/users/:id/suspend', asyncHandler(putAdminUsersByIdSuspend));

// Candidaturas a Criador
router.get('/creator-applications', asyncHandler(getAdminCreatorApplications));
router.put(
  '/creator-applications/:id/approve',
  asyncHandler(putAdminCreatorApplicationsByIdApprove),
);
router.put('/creator-applications/:id/reject', asyncHandler(putAdminCreatorApplicationsByIdReject));

// Moderação de Cursos
router.get('/courses', asyncHandler(getAdminCourses));
router.put('/courses/:id/approve', asyncHandler(putAdminCoursesByIdApprove));
router.put('/courses/:id/reject', asyncHandler(putAdminCoursesByIdReject));
router.get('/reports', asyncHandler(getAdminReports));
router.post('/report', asyncHandler(createReport));
router.put('/reports/:id', asyncHandler(putAdminReportsById));
module.exports = router;
