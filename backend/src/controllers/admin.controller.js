const { reviewCourse } = require('../services/coursePublication');
const Admin = require('../models/Admin.js');
const { changeUserRole } = require('../services/userRoles');
const { transaction, lockTransaction } = require('../database/connection.js');
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
  } catch {
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
const putAdminUserRole = async (req, res) => {
  const user = await changeUserRole(req.user.id, req.params.id, req.body);
  req.app
    .get('io')
    ?.in('user_' + user.id)
    .disconnectSockets(true);
  res.json({ user, message: 'Cargo atualizado. O utilizador deve iniciar sessão novamente.' });
};
exports.putAdminUserRole = putAdminUserRole;
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
  } catch {
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
  } catch {
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
      await lockTransaction(`creator-application:${id}`);
      const current = await Admin.findApplicationById([id]);
      if (!current || current.status !== 'PENDING')
        throw Object.assign(new Error('Esta candidatura já foi revista. Atualize a lista.'), {
          status: 409,
        });
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
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Falha ao aprovar candidatura',
    });
  }
};
const putAdminCreatorApplicationsByIdReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    if (typeof feedback !== 'string' || !feedback.trim() || feedback.length > 2000)
      return res.status(400).json({ error: 'Escreva um feedback entre 1 e 2000 caracteres.' });
    const application = await Admin.findApplicationById([id]);
    if (!application)
      return res.status(404).json({
        error: 'Candidatura não encontrada',
      });
    const now = new Date().toISOString();
    const adminFeedback =
      feedback || 'A sua candidatura não cumpre todos os critérios necessários neste momento.';
    await transaction(async () => {
      await lockTransaction(`creator-application:${id}`);
      const current = await Admin.findApplicationById([id]);
      if (!current || current.status !== 'PENDING')
        throw Object.assign(new Error('Esta candidatura já foi revista. Atualize a lista.'), {
          status: 409,
        });
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
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Falha ao rejeitar candidatura',
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
  } catch {
    return res.status(500).json({
      error: 'Falha ao listar cursos para moderação',
    });
  }
};
const putAdminCoursesByIdApprove = async (req, res) => {
  try {
    res.json(await reviewCourse(req.params.id, 'APPROVED', req.body));
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.status ? error.message : 'Falha ao aprovar curso.' });
  }
};
const putAdminCoursesByIdReject = async (req, res) => {
  try {
    res.json(await reviewCourse(req.params.id, 'REJECTED', req.body));
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.status ? error.message : 'Falha ao pedir alterações.' });
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
