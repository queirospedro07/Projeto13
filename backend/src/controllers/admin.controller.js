const Admin = require('../models/Admin.js');
const { transaction } = require('../database/connection.js');
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = ((await Admin.countUsers()) || {}).c || 0;
    const activeUsers = (await Admin.countActiveUsers()).c;
    const pendingReports = (await Admin.countOpenReports()).c;
    const totalCourses = ((await Admin.countCourses()) || {}).c || 0;
    const totalSpaces = ((await Admin.countSpaces()) || {}).c || 0;
    const totalEnrollments = ((await Admin.countEnrollments()) || {}).c || 0;
    const pendingApplications = ((await Admin.countCreatorApplications()) || {}).c || 0;
    const pendingCourses = ((await Admin.countCoursesForGetAdminStats()) || {}).c || 0;
    return res.json({
      totalUsers,
      activeUsers,
      totalCourses,
      totalSpaces,
      totalEnrollments,
      pendingReports,
      pendingApplications,
      pendingCourses,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao carregar estatísticas de administração',
    });
  }
};
const getAdminUsers = async (req, res) => {
  try {
    const users = await Admin.countUsersForGetAdminUsers();
    return res.json(
      users.map((u) => ({
        ...u,
        isSuspended: u.role !== 'ADMIN' && Number(u.isSuspended) === 1,
        _count: {
          enrollments: u.enrollmentsCount,
          createdCourses: u.createdCoursesCount,
        },
      })),
    );
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return res.status(500).json({
      error: 'Falha ao carregar lista de utilizadores',
    });
  }
};
const putAdminUsersByIdSuspend = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Não pode suspender a sua própria conta.',
      });
    }
    const targetUser = await Admin.findTargetUserById([id]);
    if (!targetUser)
      return res.status(404).json({
        error: 'Utilizador não encontrado',
      });
    if (targetUser.role === 'ADMIN') {
      return res.status(403).json({
        error: 'Não é permitido suspender contas de administrador.',
      });
    }
    const newSuspended = Number(targetUser.isSuspended) === 1 ? 0 : 1;
    await Admin.updateUtilizadoresByEstaSuspensoAndId([newSuspended, id]);
    req.app
      .get('io')
      ?.in('user_' + id)
      .disconnectSockets(true);
    return res.json({
      isSuspended: newSuspended === 1,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao alterar estado de suspensão',
    });
  }
};
const getAdminCreatorApplications = async (req, res) => {
  try {
    const applications = await Admin.listApplications();
    return res.json(
      applications.map((app) => ({
        id: app.id,
        userId: app.userId,
        fullName: app.fullName,
        bio: app.bio,
        expertise: app.expertise,
        experienceYears: app.experienceYears,
        portfolioUrl: app.portfolioUrl,
        motivation: app.motivation,
        proposedCourses: app.proposedCourses,
        sampleVideoUrl: app.sampleVideoUrl,
        status: app.status,
        adminFeedback: app.adminFeedback,
        reviewedAt: app.reviewedAt,
        createdAt: app.createdAt,
        user: {
          id: app.userId,
          name: app.user_name,
          email: app.user_email,
          username: app.user_username,
          avatarUrl: app.user_avatarUrl,
          role: app.user_role,
        },
      })),
    );
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao listar candidaturas a criador',
    });
  }
};
const putAdminCreatorApplicationsByIdApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Admin.findApplicationById([id]);
    if (!application)
      return res.status(404).json({
        error: 'Candidatura não encontrada',
      });
    const now = new Date().toISOString();
    await transaction(async () => {
      await Admin.updateCreatorApplicationsByReviewedByAndReviewedAtAndUpdatedAtAndId([
        req.user.id,
        now,
        now,
        id,
      ]);
      await Admin.updateUsersByUpdatedAtAndId([now, application.userId]);
      await Admin.insertNotifications([
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        application.userId,
        now,
      ]);
    });
    return res.json({
      success: true,
      message: 'Candidatura aprovada com sucesso!',
      status: 'APPROVED',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao aprovar candidatura',
    });
  }
};
const putAdminCreatorApplicationsByIdReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const application = await Admin.findApplicationById([id]);
    if (!application)
      return res.status(404).json({
        error: 'Candidatura não encontrada',
      });
    const now = new Date().toISOString();
    const adminFeedback =
      feedback || 'A sua candidatura não cumpre todos os critérios necessários neste momento.';
    await transaction(async () => {
      await Admin.rejectCreatorApplication([adminFeedback, req.user.id, now, now, id]);
      await Admin.insertNotificationsForLookup([
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        application.userId,
        `A sua candidatura foi revista: ${adminFeedback}`,
        now,
      ]);
    });
    return res.json({
      success: true,
      message: 'Candidatura rejeitada.',
      status: 'REJECTED',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao rejeitar candidatura',
    });
  }
};
const getAdminCourses = async (req, res) => {
  try {
    const courses = await Admin.search(req.query);
    return res.json(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        thumbnailUrl: c.thumbnailUrl,
        bannerUrl: c.bannerUrl,
        price: c.price,
        isFree: c.isFree === 1,
        isPublished: c.isPublished === 1,
        approvalStatus: c.approvalStatus || 'APPROVED',
        adminNotes: c.adminNotes,
        submittedForReviewAt: c.submittedForReviewAt,
        reviewedAt: c.reviewedAt,
        durationHours: c.durationHours,
        language: c.language,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        modulesCount: c.modulesCount || 0,
        studentsCount: c.studentsCount || 0,
        creator: {
          id: c.creator_id,
          name: c.creator_name,
          email: c.creator_email,
          avatarUrl: c.creator_avatarUrl,
        },
      })),
    );
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao listar cursos para moderação',
    });
  }
};
const putAdminCoursesByIdApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Admin.findCourseById([id]);
    if (!course)
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    const now = new Date().toISOString();
    await transaction(async () => {
      await Admin.updateCoursesByReviewedAtAndUpdatedAtAndId([now, now, id]);
      await Admin.createCourseApprovalNotification([
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        course.creatorId,
        `O seu curso "${course.title}" foi aprovado e já está disponível no catálogo.`,
        `/courses/${course.id}`,
        now,
      ]);
    });
    return res.json({
      success: true,
      message: 'Curso aprovado e publicado com sucesso!',
      approvalStatus: 'APPROVED',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao aprovar curso',
    });
  }
};
const putAdminCoursesByIdReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const course = await Admin.findCourseById([id]);
    if (!course)
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    const now = new Date().toISOString();
    const adminNotes = notes || 'O curso requer ajustes antes de ser publicado.';
    await transaction(async () => {
      await Admin.updateCoursesByAdminNotesAndReviewedAtAndUpdatedAtAndId([
        adminNotes,
        now,
        now,
        id,
      ]);
      await Admin.createCourseRejectionNotification([
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        course.creatorId,
        `O seu curso "${course.title}" precisa de ajustes: ${adminNotes}`,
        now,
      ]);
    });
    return res.json({
      success: true,
      message: 'Curso marcado como rejeitado.',
      approvalStatus: 'REJECTED',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao rejeitar curso',
    });
  }
};
const getAdminReports = async (req, res) => res.json(await Admin.listDenuncias());
const putAdminReportsById = async (req, res) => {
  const { status, feedback = '' } = req.body;
  if (
    !['OPEN', 'RESOLVED', 'DISMISSED'].includes(status) ||
    typeof feedback !== 'string' ||
    feedback.length > 2000
  )
    return res.status(400).json({
      error: 'Estado ou parecer inválido.',
    });
  if (!(await Admin.findDenunciasById([req.params.id])))
    return res.status(404).json({
      error: 'Denúncia não encontrada.',
    });
  await Admin.updateDenunciasByEstadoAndParecerAndAtualizadoEmAndId([
    status,
    feedback.trim(),
    new Date().toISOString(),
    req.params.id,
  ]);
  return res.json({
    success: true,
    status,
  });
};
exports.getAdminStats = getAdminStats;
exports.getAdminUsers = getAdminUsers;
exports.putAdminUsersByIdSuspend = putAdminUsersByIdSuspend;
exports.getAdminCreatorApplications = getAdminCreatorApplications;
exports.putAdminCreatorApplicationsByIdApprove = putAdminCreatorApplicationsByIdApprove;
exports.putAdminCreatorApplicationsByIdReject = putAdminCreatorApplicationsByIdReject;
exports.getAdminCourses = getAdminCourses;
exports.putAdminCoursesByIdApprove = putAdminCoursesByIdApprove;
exports.putAdminCoursesByIdReject = putAdminCoursesByIdReject;
exports.getAdminReports = getAdminReports;
exports.putAdminReportsById = putAdminReportsById;
