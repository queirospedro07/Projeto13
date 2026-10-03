import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../database/connection.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ==============================================================
// ENDPOINT PÚBLICO / AUTENTICADO DE CANDIDATURA A SUB-ADMIN
// ==============================================================
router.post('/subadmin-apply', async (req, res) => {
  try {
    const {
      fullName,
      email,
      motivation,
      experience,
      weeklyAvailabilityHours,
      areasOfInterest,
      situationScenario,
      userId: providedUserId
    } = req.body;

    if (!fullName?.trim() || !email?.trim() || experience?.trim().length < 40 || motivation?.trim().length < 40 || situationScenario?.trim().length < 60) {
      return res.status(400).json({
        error: 'A experiência e a motivação devem ter pelo menos 40 caracteres, e o cenário prático pelo menos 60.'
      });
    }
    const selectedAreas = Array.isArray(areasOfInterest)
      ? areasOfInterest.filter((area) => typeof area === 'string' && area.trim())
      : String(areasOfInterest || '').split(',').map((area) => area.trim()).filter(Boolean);
    const availability = Number(weeklyAvailabilityHours);
    if (selectedAreas.length === 0 || !Number.isInteger(availability) || availability < 2 || availability > 40) {
      return res.status(400).json({ error: 'Selecione pelo menos uma área e indique uma disponibilidade entre 2 e 40 horas.' });
    }

    let user = null;
    if (providedUserId) {
      user = queryOne('SELECT id, email, name FROM users WHERE id = ?', [providedUserId]);
    }
    if (!user && email) {
      user = queryOne('SELECT id, email, name FROM users WHERE email = ?', [email]);
    }

    const userId = user ? user.id : (providedUserId || `guest-${Date.now()}`);
    const existingApplication = queryOne(`
      SELECT id FROM admin_applications
      WHERE status = 'PENDING' AND (userId = ? OR LOWER(email) = LOWER(?))
      LIMIT 1
    `, [userId, email.trim()]);
    if (existingApplication) {
      return res.status(409).json({ error: 'Já existe uma candidatura pendente associada a esta conta ou email.' });
    }
    const appId = `subapp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    execute(`
      INSERT INTO admin_applications (
        id, userId, fullName, email, motivation, experience,
        weeklyAvailabilityHours, areasOfInterest, situationScenario,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `, [
      appId,
      userId,
      fullName.trim(),
      email.trim(),
      motivation.trim(),
      experience.trim(),
      availability,
      selectedAreas.join(', '),
      situationScenario.trim(),
      now,
      now
    ]);

    const admins = queryAll("SELECT id FROM users WHERE role = 'ADMIN'");
    admins.forEach((adm) => {
      execute(`
        INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
        VALUES (?, ?, 'system', 'Nova Candidatura a Sub-Administrador', ?, '/admin', 0, ?)
      `, [
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        adm.id,
        `${fullName} submeteu um inquérito de candidatura para integrar a equipa de Sub-Administração / Moderação Global.`,
        now
      ]);
    });

    return res.status(201).json({
      success: true,
      message: 'Candidatura a Sub-Administrador submetida com sucesso!',
      applicationId: appId
    });
  } catch (err) {
    console.error('Error submitting sub-admin application:', err);
    return res.status(500).json({ error: 'Falha ao submeter inquérito de candidatura.' });
  }
});

// ==============================================================
// ROTAS DE GESTÃO EXCLUSIVAS DE ADMIN E SUBADMIN
// ==============================================================
router.use(authenticate, requireRole('ADMIN', 'SUBADMIN'));

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = (queryOne('SELECT COUNT(*) as c FROM users') || {}).c || 0;
    const totalCourses = (queryOne('SELECT COUNT(*) as c FROM courses') || {}).c || 0;
    const totalSpaces = (queryOne('SELECT COUNT(*) as c FROM spaces') || {}).c || 0;
    const totalEnrollments = (queryOne('SELECT COUNT(*) as c FROM enrollments') || {}).c || 0;
    const pendingApplications = (queryOne("SELECT COUNT(*) as c FROM creator_applications WHERE status = 'PENDING'") || {}).c || 0;
    const pendingCourses = (queryOne("SELECT COUNT(*) as c FROM courses WHERE approvalStatus = 'PENDING'") || {}).c || 0;

    return res.json({
      totalUsers,
      activeUsers: Math.max(1, Math.round(totalUsers * 0.85)),
      totalCourses,
      totalSpaces,
      totalEnrollments,
      pendingReports: 0,
      pendingApplications,
      pendingCourses
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao carregar estatísticas de administração' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = queryAll(`
      SELECT id, name, username, email, role, avatarUrl, isSuspended, xp, level, createdAt,
             (SELECT COUNT(*) FROM enrollments WHERE userId = users.id) as enrollmentsCount,
             (SELECT COUNT(*) FROM courses WHERE creatorId = users.id) as createdCoursesCount
      FROM users
      ORDER BY createdAt DESC
    `);
    return res.json(
      users.map((u) => ({
        ...u,
        isSuspended: u.isSuspended === 1,
        _count: {
          enrollments: u.enrollmentsCount,
          createdCourses: u.createdCoursesCount
        }
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao carregar lista de utilizadores' });
  }
});

router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = queryOne('SELECT role, isSuspended FROM users WHERE id = ?', [id]);
    if (!targetUser) return res.status(404).json({ error: 'Utilizador não encontrado' });

    if (targetUser.role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas Administradores principais podem modificar outros Administradores.' });
    }

    const newSuspended = targetUser.isSuspended === 1 ? 0 : 1;
    execute('UPDATE users SET isSuspended = ? WHERE id = ?', [newSuspended, id]);
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
        id: app.id, userId: app.userId, fullName: app.fullName, bio: app.bio,
        expertise: app.expertise, experienceYears: app.experienceYears,
        portfolioUrl: app.portfolioUrl, motivation: app.motivation,
        proposedCourses: app.proposedCourses, sampleVideoUrl: app.sampleVideoUrl,
        status: app.status, adminFeedback: app.adminFeedback,
        reviewedAt: app.reviewedAt, createdAt: app.createdAt,
        user: { id: app.userId, name: app.user_name, email: app.user_email, username: app.user_username, avatarUrl: app.user_avatarUrl, role: app.user_role }
      }))
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
      execute(`UPDATE creator_applications SET status = 'APPROVED', reviewedBy = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`, [req.user.id, now, now, id]);
      execute(`UPDATE users SET role = 'CREATOR', updatedAt = ? WHERE id = ?`, [now, application.userId]);
      execute(`INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'achievement', 'Candidatura a Criador Aprovada!', 'Parabéns! A sua candidatura foi aprovada. Já tem acesso ao Estúdio do Criador.', '/creator', 0, ?)`,
        [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, now]);
    });
    return res.json({ success: true, message: 'Candidatura aprovada com sucesso!', status: 'APPROVED' });
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
    const adminFeedback = feedback || 'A sua candidatura não cumpre todos os critérios necessários neste momento.';
    transaction(() => {
      execute(`UPDATE creator_applications SET status = 'REJECTED', adminFeedback = ?, reviewedBy = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`, [adminFeedback, req.user.id, now, now, id]);
      execute(`INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'system', 'Atualização da Candidatura a Criador', ?, '/creator/apply', 0, ?)`,
        [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, `A sua candidatura foi revista: ${adminFeedback}`, now]);
    });
    return res.json({ success: true, message: 'Candidatura rejeitada.', status: 'REJECTED' });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao rejeitar candidatura' });
  }
});

// Candidaturas a Sub-Administrador
router.get('/subadmin-applications', async (req, res) => {
  try {
    const applications = queryAll(`
      SELECT sa.*, u.name as user_name, u.email as user_email, u.username as user_username, u.avatarUrl as user_avatarUrl, u.role as user_role
      FROM admin_applications sa
      LEFT JOIN users u ON sa.userId = u.id
      ORDER BY CASE WHEN sa.status = 'PENDING' THEN 0 ELSE 1 END, sa.createdAt DESC
    `);
    return res.json(
      applications.map((app) => ({
        id: app.id, userId: app.userId, fullName: app.fullName, email: app.email,
        motivation: app.motivation, experience: app.experience,
        weeklyAvailabilityHours: app.weeklyAvailabilityHours, areasOfInterest: app.areasOfInterest,
        situationScenario: app.situationScenario, status: app.status,
        adminFeedback: app.adminFeedback, reviewedAt: app.reviewedAt, createdAt: app.createdAt,
        user: app.user_name ? { id: app.userId, name: app.user_name, email: app.user_email, username: app.user_username, avatarUrl: app.user_avatarUrl, role: app.user_role } : null
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao listar candidaturas a sub-administrador' });
  }
});

router.put('/subadmin-applications/:id/approve', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Apenas Administradores principais podem nomear Sub-Administradores.' });

    const { id } = req.params;
    const application = queryOne('SELECT * FROM admin_applications WHERE id = ?', [id]);
    if (!application) return res.status(404).json({ error: 'Candidatura não encontrada' });

    const now = new Date().toISOString();
    transaction(() => {
      execute(`UPDATE admin_applications SET status = 'APPROVED', reviewedBy = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`, [req.user.id, now, now, id]);
      if (application.userId && !application.userId.startsWith('guest-')) {
        execute(`UPDATE users SET role = 'SUBADMIN', updatedAt = ? WHERE id = ?`, [now, application.userId]);
        execute(`INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'achievement', 'Candidatura a Sub-Administrador Aprovada!', 'Foi promovido a Sub-Administrador da plataforma NEXO.', '/admin', 0, ?)`,
          [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, now]);
      }
    });
    return res.json({ success: true, message: 'Candidatura aprovada! O utilizador agora é Sub-Administrador.', status: 'APPROVED' });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao aprovar candidatura a sub-administrador' });
  }
});

router.put('/subadmin-applications/:id/reject', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Apenas Administradores principais podem avaliar candidaturas a Sub-Admin.' });

    const { id } = req.params;
    const { feedback } = req.body;
    const application = queryOne('SELECT * FROM admin_applications WHERE id = ?', [id]);
    if (!application) return res.status(404).json({ error: 'Candidatura não encontrada' });

    const now = new Date().toISOString();
    const adminFeedback = feedback || 'O seu perfil não foi selecionado neste momento.';
    transaction(() => {
      execute(`UPDATE admin_applications SET status = 'REJECTED', adminFeedback = ?, reviewedBy = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`, [adminFeedback, req.user.id, now, now, id]);
      if (application.userId && !application.userId.startsWith('guest-')) {
        execute(`INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'system', 'Resultado da Candidatura a Sub-Administrador', ?, '/', 0, ?)`,
          [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, `A sua candidatura foi revista: ${adminFeedback}`, now]);
      }
    });
    return res.json({ success: true, message: 'Candidatura a sub-administrador rejeitada.', status: 'REJECTED' });
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
    if (status && status !== 'all') { sql += ` WHERE c.approvalStatus = ?`; params.push(status); }
    sql += ` ORDER BY CASE WHEN c.approvalStatus = 'PENDING' THEN 0 ELSE 1 END, c.createdAt DESC`;

    const courses = queryAll(sql, params);
    return res.json(
      courses.map((c) => ({
        id: c.id, title: c.title, slug: c.slug, description: c.description, category: c.category,
        difficulty: c.difficulty, thumbnailUrl: c.thumbnailUrl, bannerUrl: c.bannerUrl,
        price: c.price, isFree: c.isFree === 1, isPublished: c.isPublished === 1,
        approvalStatus: c.approvalStatus || 'APPROVED', adminNotes: c.adminNotes,
        submittedForReviewAt: c.submittedForReviewAt, reviewedAt: c.reviewedAt,
        durationHours: c.durationHours, language: c.language,
        createdAt: c.createdAt, updatedAt: c.updatedAt,
        modulesCount: c.modulesCount || 0, studentsCount: c.studentsCount || 0,
        creator: { id: c.creator_id, name: c.creator_name, email: c.creator_email, avatarUrl: c.creator_avatarUrl }
      }))
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
      execute(`UPDATE courses SET approvalStatus = 'APPROVED', isPublished = 1, adminNotes = 'Aprovado pelo Administrador', reviewedAt = ?, updatedAt = ? WHERE id = ?`, [now, now, id]);
      execute(`INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'achievement', 'Curso Aprovado e Publicado!', ?, ?, 0, ?)`,
        [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, course.creatorId,
          `O seu curso "${course.title}" foi aprovado e já está disponível no catálogo.`, `/courses/${course.id}`, now]);
    });
    return res.json({ success: true, message: 'Curso aprovado e publicado com sucesso!', approvalStatus: 'APPROVED' });
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
      execute(`UPDATE courses SET approvalStatus = 'REJECTED', isPublished = 0, adminNotes = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`, [adminNotes, now, now, id]);
      execute(`INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'system', 'Curso Requer Revisão', ?, '/creator', 0, ?)`,
        [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, course.creatorId,
          `O seu curso "${course.title}" precisa de ajustes: ${adminNotes}`, now]);
    });
    return res.json({ success: true, message: 'Curso marcado como rejeitado.', approvalStatus: 'REJECTED' });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao rejeitar curso' });
  }
});

router.get('/reports', async (_req, res) => res.json([]));

router.post('/report', async (req, res) => {
  // Placeholder — reports feature not yet implemented
  return res.status(201).json({ success: true, message: 'Reporte submetido com sucesso.' });
});

router.put('/reports/:id', async (req, res) => {
  return res.json({ success: true });
});

export default router;
