import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ==============================================================
// ENDPOINTS PARA CANDIDATURA A SUB-ADMIN (UTILIZADOR AUTENTICADO)
// ==============================================================

// Obter estado da candidatura a Sub-Administrador do utilizador autenticado
router.get('/subadmin-application/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const application = queryOne('SELECT * FROM admin_applications WHERE userId = ? ORDER BY createdAt DESC LIMIT 1', [userId]);
    return res.json({
      role: req.user.role,
      hasApplication: !!application,
      application: application || null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao obter estado da candidatura a sub-administrador' });
  }
});

// Submeter questionário de candidatura a Sub-Administrador
router.post('/subadmin-application/apply', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (req.user.role === 'ADMIN') {
      return res.status(400).json({ error: 'A sua conta já é Administrador da plataforma.' });
    }

    const existingPending = queryOne("SELECT id FROM admin_applications WHERE userId = ? AND status = 'PENDING'", [userId]);
    if (existingPending) {
      return res.status(400).json({ error: 'Já tem uma candidatura à equipa de administração pendente em análise.' });
    }

    const {
      fullName,
      email,
      motivation,
      experience,
      weeklyAvailabilityHours,
      areasOfInterest,
      situationScenario
    } = req.body;

    if (!fullName || !email || !motivation || !experience || !situationScenario) {
      return res.status(400).json({ error: 'Todos os campos do inquérito de candidatura são obrigatórios.' });
    }

    const appId = `subadmin-app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    execute(`
      INSERT INTO admin_applications (
        id, userId, fullName, email, motivation, experience, weeklyAvailabilityHours, areasOfInterest, situationScenario, status, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `, [
      appId,
      userId,
      fullName.trim(),
      email.trim(),
      motivation.trim(),
      experience.trim(),
      Number(weeklyAvailabilityHours) || 10,
      typeof areasOfInterest === 'string' ? areasOfInterest : JSON.stringify(areasOfInterest || []),
      situationScenario.trim(),
      now,
      now
    ]);

    return res.status(201).json({
      success: true,
      message: 'Inquérito de candidatura a Sub-Administrador submetido com sucesso! A equipa de administração irá avaliar a sua proposta.',
      applicationId: appId
    });
  } catch (err) {
    console.error('Error submitting subadmin application:', err);
    return res.status(500).json({ error: 'Falha ao submeter candidatura a sub-administrador' });
  }
});

// ==============================================================
// ROTAS DE GESTÃO EXCLUSIVAS DE ADMINISTRADOR
// ==============================================================
router.use(authenticate, requireRole('ADMIN'));

// Estatísticas globais do painel de administração
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = (queryOne('SELECT COUNT(*) as c FROM users') || {}).c || 0;
    const totalCourses = (queryOne('SELECT COUNT(*) as c FROM courses') || {}).c || 0;
    const totalSpaces = (queryOne('SELECT COUNT(*) as c FROM spaces') || {}).c || 0;
    const totalEnrollments = (queryOne('SELECT COUNT(*) as c FROM enrollments') || {}).c || 0;
    const pendingApplications = (queryOne("SELECT COUNT(*) as c FROM creator_applications WHERE status = 'PENDING'") || {}).c || 0;
    const pendingSubAdminApps = (queryOne("SELECT COUNT(*) as c FROM admin_applications WHERE status = 'PENDING'") || {}).c || 0;
    const pendingCourses = (queryOne("SELECT COUNT(*) as c FROM courses WHERE approvalStatus = 'PENDING'") || {}).c || 0;

    return res.json({
      totalUsers,
      activeUsers: Math.max(1, Math.round(totalUsers * 0.85)),
      totalCourses,
      totalSpaces,
      totalEnrollments,
      pendingReports: 0,
      pendingApplications,
      pendingSubAdminApps,
      pendingCourses
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao carregar estatísticas de administração'
    });
  }
});

// Lista de utilizadores
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
    return res.status(500).json({
      error: 'Falha ao carregar lista de utilizadores'
    });
  }
});

// Suspender / reativar utilizador
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const user = queryOne('SELECT isSuspended FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    const newSuspended = user.isSuspended === 1 ? 0 : 1;
    execute('UPDATE users SET isSuspended = ? WHERE id = ?', [newSuspended, id]);
    return res.json({ isSuspended: newSuspended === 1 });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao alterar estado de suspensão' });
  }
});

// ==========================================
// 1. CANDIDATURAS A CRIADOR (INQUÉRITOS)
// ==========================================

// Listar todas as candidaturas a criador
router.get('/creator-applications', async (req, res) => {
  try {
    const applications = queryAll(`
      SELECT ca.*, 
             u.name as user_name, u.email as user_email, u.username as user_username, u.avatarUrl as user_avatarUrl, u.role as user_role
      FROM creator_applications ca
      JOIN users u ON ca.userId = u.id
      ORDER BY 
        CASE WHEN ca.status = 'PENDING' THEN 0 ELSE 1 END,
        ca.createdAt DESC
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
          role: app.user_role
        }
      }))
    );
  } catch (err) {
    console.error('Failed to get creator applications:', err);
    return res.status(500).json({ error: 'Falha ao listar candidaturas a criador' });
  }
});

// Aprovar candidatura a criador (transforma o Aluno em Criador)
router.put('/creator-applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const application = queryOne('SELECT * FROM creator_applications WHERE id = ?', [id]);
    if (!application) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }

    const now = new Date().toISOString();
    const adminId = req.user.id;

    transaction(() => {
      // 1. Atualizar candidatura
      execute(`
        UPDATE creator_applications 
        SET status = 'APPROVED', reviewedBy = ?, reviewedAt = ?, updatedAt = ?
        WHERE id = ?
      `, [adminId, now, now, id]);

      // 2. Atualizar cargo do utilizador para CREATOR
      execute(`
        UPDATE users 
        SET role = 'CREATOR', updatedAt = ?
        WHERE id = ?
      `, [now, application.userId]);

      // 3. Notificar o utilizador
      execute(`
        INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
        VALUES (?, ?, 'achievement', 'Candidatura a Criador Aprovada! 🎉', 'Parabéns! A sua candidatura foi aprovada pelo Administrador. Já tem acesso ao Estúdio do Criador.', '/creator', 0, ?)
      `, [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, now]);
    });

    return res.json({
      success: true,
      message: 'Candidatura aprovada com sucesso! O utilizador agora é Formador/Criador.',
      status: 'APPROVED'
    });
  } catch (err) {
    console.error('Error approving application:', err);
    return res.status(500).json({ error: 'Falha ao aprovar candidatura' });
  }
});

// Rejeitar candidatura a criador (com feedback opcional)
router.put('/creator-applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const application = queryOne('SELECT * FROM creator_applications WHERE id = ?', [id]);
    if (!application) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }

    const now = new Date().toISOString();
    const adminId = req.user.id;
    const adminFeedback = feedback || 'A sua candidatura não cumpre todos os critérios necessários neste momento.';

    transaction(() => {
      execute(`
        UPDATE creator_applications 
        SET status = 'REJECTED', adminFeedback = ?, reviewedBy = ?, reviewedAt = ?, updatedAt = ?
        WHERE id = ?
      `, [adminFeedback, adminId, now, now, id]);

      execute(`
        INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
        VALUES (?, ?, 'system', 'Atualização da Candidatura a Criador', ?, '/creator/apply', 0, ?)
      `, [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, `A sua candidatura a criador foi revista pela administração: ${adminFeedback}`, now]);
    });

    return res.json({
      success: true,
      message: 'Candidatura rejeitada.',
      status: 'REJECTED'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao rejeitar candidatura' });
  }
});

// ==========================================
// 2. MODERAÇÃO E APROVAÇÃO DE CURSOS
// ==========================================

// Listar cursos para moderação
router.get('/courses', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT c.*,
             u.id as creator_id, u.name as creator_name, u.email as creator_email, u.avatarUrl as creator_avatarUrl,
             (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount,
             (SELECT COUNT(*) FROM lessons l JOIN course_modules cm ON l.moduleId = cm.id WHERE cm.courseId = c.id) as lessonsCount,
             (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount
      FROM courses c
      JOIN users u ON c.creatorId = u.id
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ` WHERE c.approvalStatus = ?`;
      params.push(status);
    }

    sql += ` ORDER BY 
      CASE WHEN c.approvalStatus = 'PENDING' THEN 0 ELSE 1 END,
      c.createdAt DESC`;

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
        lessonsCount: c.lessonsCount || 0,
        studentsCount: c.studentsCount || 0,
        creator: {
          id: c.creator_id,
          name: c.creator_name,
          email: c.creator_email,
          avatarUrl: c.creator_avatarUrl
        }
      }))
    );
  } catch (err) {
    console.error('Failed to get admin courses:', err);
    return res.status(500).json({ error: 'Falha ao listar cursos para moderação' });
  }
});

// Aprovar e publicar curso
router.put('/courses/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const course = queryOne('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const now = new Date().toISOString();

    transaction(() => {
      execute(`
        UPDATE courses 
        SET approvalStatus = 'APPROVED', isPublished = 1, adminNotes = 'Aprovado pelo Administrador', reviewedAt = ?, updatedAt = ?
        WHERE id = ?
      `, [now, now, id]);

      // Notificar o criador
      execute(`
        INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
        VALUES (?, ?, 'achievement', 'Curso Aprovado e Publicado! 🚀', ?, ?, 0, ?)
      `, [
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        course.creatorId,
        `O seu curso "${course.title}" foi aprovado pelo Administrador e já se encontra disponível no catálogo público do NEXO.`,
        `/courses/${course.id}`,
        now
      ]);
    });

    return res.json({
      success: true,
      message: 'Curso aprovado e publicado com sucesso no catálogo!',
      approvalStatus: 'APPROVED'
    });
  } catch (err) {
    console.error('Error approving course:', err);
    return res.status(500).json({ error: 'Falha ao aprovar curso' });
  }
});

// Rejeitar curso com notas explicativas
router.put('/courses/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const course = queryOne('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const now = new Date().toISOString();
    const adminNotes = notes || 'O curso requer ajustes no conteúdo ou estrutura antes de ser publicado.';

    transaction(() => {
      execute(`
        UPDATE courses 
        SET approvalStatus = 'REJECTED', isPublished = 0, adminNotes = ?, reviewedAt = ?, updatedAt = ?
        WHERE id = ?
      `, [adminNotes, now, now, id]);

      // Notificar o criador
      execute(`
        INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
        VALUES (?, ?, 'system', 'Curso Requer Revisão ⚠️', ?, ?, 0, ?)
      `, [
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        course.creatorId,
        `O seu curso "${course.title}" precisa de ajustes: ${adminNotes}`,
        `/creator`,
        now
      ]);
    });

    return res.json({
      success: true,
      message: 'Curso marcado como rejeitado / requer revisão.',
      approvalStatus: 'REJECTED'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao rejeitar curso' });
  }
});

// ==========================================
// 3. CANDIDATURAS A SUB-ADMIN (GESTÃO PELO ADMIN)
// ==========================================

// Listar todas as candidaturas a sub-administrador
router.get('/subadmin-applications', async (req, res) => {
  try {
    const applications = queryAll(`
      SELECT aa.*, 
             u.name as user_name, u.email as user_email, u.username as user_username, u.avatarUrl as user_avatarUrl, u.role as user_role
      FROM admin_applications aa
      JOIN users u ON aa.userId = u.id
      ORDER BY 
        CASE WHEN aa.status = 'PENDING' THEN 0 ELSE 1 END,
        aa.createdAt DESC
    `);

    return res.json(
      applications.map((app) => ({
        id: app.id,
        userId: app.userId,
        fullName: app.fullName,
        email: app.email,
        motivation: app.motivation,
        experience: app.experience,
        weeklyAvailabilityHours: app.weeklyAvailabilityHours,
        areasOfInterest: app.areasOfInterest,
        situationScenario: app.situationScenario,
        status: app.status,
        adminFeedback: app.adminFeedback,
        reviewedBy: app.reviewedBy,
        reviewedAt: app.reviewedAt,
        createdAt: app.createdAt,
        user: {
          id: app.userId,
          name: app.user_name,
          email: app.user_email,
          username: app.user_username,
          avatarUrl: app.user_avatarUrl,
          role: app.user_role
        }
      }))
    );
  } catch (err) {
    console.error('Error fetching subadmin applications:', err);
    return res.status(500).json({ error: 'Falha ao carregar candidaturas a sub-administrador' });
  }
});

// Aprovar candidatura a Sub-Administrador
router.put('/subadmin-applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const application = queryOne('SELECT * FROM admin_applications WHERE id = ?', [id]);
    if (!application) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }

    const now = new Date().toISOString();
    const adminId = req.user.id;

    transaction(() => {
      // 1. Atualizar candidatura
      execute(`
        UPDATE admin_applications 
        SET status = 'APPROVED', reviewedBy = ?, reviewedAt = ?, updatedAt = ?
        WHERE id = ?
      `, [adminId, now, now, id]);

      // 2. Atualizar cargo do utilizador para ADMIN (equipa de gestão)
      execute(`
        UPDATE users 
        SET role = 'ADMIN', updatedAt = ?
        WHERE id = ?
      `, [now, application.userId]);

      // 3. Notificar o utilizador
      execute(`
        INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
        VALUES (?, ?, 'achievement', 'Candidatura a Sub-Administrador Aprovada! 🛡️', 'Parabéns! Foi aprovado para integrar a equipa de administração do NEXO. Já tem acesso ao Painel de Gestão.', '/admin', 0, ?)
      `, [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, now]);
    });

    return res.json({
      success: true,
      message: 'Candidatura aprovada! O utilizador integra agora a equipa de Administração.',
      status: 'APPROVED'
    });
  } catch (err) {
    console.error('Error approving subadmin application:', err);
    return res.status(500).json({ error: 'Falha ao aprovar candidatura a sub-administrador' });
  }
});

// Rejeitar candidatura a Sub-Administrador com feedback
router.put('/subadmin-applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const application = queryOne('SELECT * FROM admin_applications WHERE id = ?', [id]);
    if (!application) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }

    const now = new Date().toISOString();
    const adminId = req.user.id;
    const adminFeedback = feedback?.trim() || null;

    transaction(() => {
      execute(`
        UPDATE admin_applications 
        SET status = 'REJECTED', adminFeedback = ?, reviewedBy = ?, reviewedAt = ?, updatedAt = ?
        WHERE id = ?
      `, [adminFeedback, adminId, now, now, id]);

      execute(`
        INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
        VALUES (?, ?, 'system', 'Atualização da Candidatura a Sub-Administrador', 'A sua candidatura à equipa de administração foi revista pela moderação.', '/admin/apply', 0, ?)
      `, [`notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, application.userId, now]);
    });

    return res.json({
      success: true,
      message: 'Candidatura rejeitada com feedback registado.',
      status: 'REJECTED'
    });
  } catch (err) {
    console.error('Error rejecting subadmin application:', err);
    return res.status(500).json({ error: 'Falha ao rejeitar candidatura a sub-administrador' });
  }
});

router.get('/reports', async (req, res) => {
  return res.json([]);
});

export default router;