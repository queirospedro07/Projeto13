import { createReport } from './report.routes.js';
import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../database/connection.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ==============================================================
// ROTAS DE GESTÃO EXCLUSIVAS DE ADMINISTRADORES
// ==============================================================
router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = (queryOne('SELECT COUNT(*) as c FROM users') || {}).c || 0;
    const totalCourses = (queryOne('SELECT COUNT(*) as c FROM courses') || {}).c || 0;
    const totalSpaces = (queryOne('SELECT COUNT(*) as c FROM spaces') || {}).c || 0;
    const totalEnrollments = (queryOne('SELECT COUNT(*) as c FROM enrollments') || {}).c || 0;
    const pendingApplications =
      (queryOne("SELECT COUNT(*) as c FROM creator_applications WHERE status = 'PENDING'") || {})
        .c || 0;
    const pendingCourses =
      (queryOne("SELECT COUNT(*) as c FROM courses WHERE approvalStatus = 'PENDING'") || {}).c || 0;

    return res.json({
      totalUsers,
      activeUsers: Math.max(1, Math.round(totalUsers * 0.85)),
      totalCourses,
      totalSpaces,
      totalEnrollments,
      pendingReports: 0,
      pendingApplications,
      pendingCourses,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao carregar estatísticas de administração' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = queryAll(`
      SELECT id, name, username, email, role, avatarUrl, isSuspended, createdAt,
             (SELECT COUNT(*) FROM enrollments WHERE userId = users.id) as enrollmentsCount,
             (SELECT COUNT(*) FROM courses WHERE creatorId = users.id) as createdCoursesCount
      FROM users
      ORDER BY createdAt DESC
    `);
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
    return res.status(500).json({ error: 'Falha ao carregar lista de utilizadores' });
  }
});

router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não pode suspender a sua própria conta.' });
    }
    const targetUser = queryOne('SELECT role, isSuspended FROM users WHERE id = ?', [id]);
    if (!targetUser) return res.status(404).json({ error: 'Utilizador não encontrado' });

    if (targetUser.role === 'ADMIN') {
      return res.status(403).json({ error: 'Não é permitido suspender contas de administrador.' });
    }

    const newSuspended = Number(targetUser.isSuspended) === 1 ? 0 : 1;
    execute(
      'UPDATE utilizadores SET esta_suspenso = ?, versao_sessao = versao_sessao + 1 WHERE id = ?',
      [newSuspended, id],
    );
    req.app
      .get('io')
      ?.in('user_' + id)
      .disconnectSockets(true);
    return res.json({ isSuspended: newSuspended === 1 });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao alterar estado de suspensão' });
  }
});

// Candidaturas a Criador
router.get('/creator-applications', async (req, res) => {
  try {
    const applications = queryAll(`
      SELECT ca.*,
             u.name as user_name, u.email as user_email, u.username as user_username, u.avatarUrl as user_avatarUrl, u.role as user_role
      FROM creator_applications ca
      JOIN users u ON ca.userId = u.id
      ORDER BY CASE WHEN ca.status = 'PENDING' THEN 0 ELSE 1 END, ca.createdAt DESC
    `);
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
    return res.status(500).json({ error: 'Falha ao listar candidaturas a criador' });
  }
});

router.put('/creator-applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const application = queryOne('SELECT * FROM creator_applications WHERE id = ?', [id]);
    if (!application) return res.status(404).json({ error: 'Candidatura não encontrada' });

    const now = new Date().toISOString();
    transaction(() => {
      execute(
        `UPDATE creator_applications SET status = 'APPROVED', reviewedBy = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`,
        [req.user.id, now, now, id],
      );
      execute(
        `UPDATE users SET role = CASE WHEN role = 'ADMIN' THEN role ELSE 'CREATOR' END, updatedAt = ? WHERE id = ?`,
        [now, application.userId],
      );
      execute(
        `INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'achievement', 'Candidatura a Criador Aprovada!', 'Parabéns! A sua candidatura foi aprovada. Já tem acesso ao Estúdio do Criador.', '/creator', 0, ?)`,
        [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, now],
      );
    });
    return res.json({
      success: true,
      message: 'Candidatura aprovada com sucesso!',
      status: 'APPROVED',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao aprovar candidatura' });
  }
});

router.put('/creator-applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const application = queryOne('SELECT * FROM creator_applications WHERE id = ?', [id]);
    if (!application) return res.status(404).json({ error: 'Candidatura não encontrada' });

    const now = new Date().toISOString();
    const adminFeedback =
      feedback || 'A sua candidatura não cumpre todos os critérios necessários neste momento.';
    transaction(() => {
      execute(
        `UPDATE creator_applications SET status = 'REJECTED', adminFeedback = ?, reviewedBy = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`,
        [adminFeedback, req.user.id, now, now, id],
      );
      execute(
        `INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'system', 'Atualização da Candidatura a Criador', ?, '/creator/apply', 0, ?)`,
        [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          application.userId,
          `A sua candidatura foi revista: ${adminFeedback}`,
          now,
        ],
      );
    });
    return res.json({ success: true, message: 'Candidatura rejeitada.', status: 'REJECTED' });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao rejeitar candidatura' });
  }
});

// Moderação de Cursos
router.get('/courses', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT c.*,
             u.id as creator_id, u.name as creator_name, u.email as creator_email, u.avatarUrl as creator_avatarUrl,
             (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount,
             (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount
      FROM courses c
      JOIN users u ON c.creatorId = u.id
    `;
    const params = [];
    if (status && status !== 'all') {
      sql += ` WHERE c.approvalStatus = ?`;
      params.push(status);
    }
    sql += ` ORDER BY CASE WHEN c.approvalStatus = 'PENDING' THEN 0 ELSE 1 END, c.createdAt DESC`;

    const courses = queryAll(sql, params);
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
    return res.status(500).json({ error: 'Falha ao listar cursos para moderação' });
  }
});

router.put('/courses/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const course = queryOne('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

    const now = new Date().toISOString();
    transaction(() => {
      execute(
        `UPDATE courses SET approvalStatus = 'APPROVED', isPublished = 1, adminNotes = 'Aprovado pelo Administrador', reviewedAt = ?, updatedAt = ? WHERE id = ?`,
        [now, now, id],
      );
      execute(
        `INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'achievement', 'Curso Aprovado e Publicado!', ?, ?, 0, ?)`,
        [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          course.creatorId,
          `O seu curso "${course.title}" foi aprovado e já está disponível no catálogo.`,
          `/courses/${course.id}`,
          now,
        ],
      );
    });
    return res.json({
      success: true,
      message: 'Curso aprovado e publicado com sucesso!',
      approvalStatus: 'APPROVED',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao aprovar curso' });
  }
});

router.put('/courses/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const course = queryOne('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

    const now = new Date().toISOString();
    const adminNotes = notes || 'O curso requer ajustes antes de ser publicado.';
    transaction(() => {
      execute(
        `UPDATE courses SET approvalStatus = 'REJECTED', isPublished = 0, adminNotes = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`,
        [adminNotes, now, now, id],
      );
      execute(
        `INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'system', 'Curso Requer Revisão', ?, '/creator', 0, ?)`,
        [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          course.creatorId,
          `O seu curso "${course.title}" precisa de ajustes: ${adminNotes}`,
          now,
        ],
      );
    });
    return res.json({
      success: true,
      message: 'Curso marcado como rejeitado.',
      approvalStatus: 'REJECTED',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao rejeitar curso' });
  }
});

router.get('/reports', (req, res) =>
  res.json(
    queryAll(
      'SELECT d.*, u.name AS reporterName FROM denuncias d JOIN users u ON u.id = d.id_utilizador ORDER BY d.criado_em DESC LIMIT 200',
    ),
  ),
);
router.post('/report', createReport);
router.put('/reports/:id', (req, res) => {
  const { status, feedback = '' } = req.body;
  if (
    !['OPEN', 'RESOLVED', 'DISMISSED'].includes(status) ||
    typeof feedback !== 'string' ||
    feedback.length > 2000
  )
    return res.status(400).json({ error: 'Estado ou parecer inválido.' });
  if (!queryOne('SELECT id FROM denuncias WHERE id = ?', [req.params.id]))
    return res.status(404).json({ error: 'Denúncia não encontrada.' });
  execute('UPDATE denuncias SET estado = ?, parecer = ?, atualizado_em = ? WHERE id = ?', [
    status,
    feedback.trim(),
    new Date().toISOString(),
    req.params.id,
  ]);
  return res.json({ success: true, status });
});

export default router;
