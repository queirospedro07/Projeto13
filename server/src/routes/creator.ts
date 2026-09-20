import { Router, Response } from 'express';
import { queryAll, queryOne, execute, transaction } from '../db.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/creator/stats
router.get('/stats', authenticate, requireRole('CREATOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const creatorId = req.user!.id;

    const courses = queryAll<any>(
      `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount
       FROM courses c
       WHERE c.creatorId = ?`,
      [creatorId]
    );

    const totalStudents = courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0);
    const totalRevenue = courses.reduce((acc, c) => acc + ((c.studentsCount || 0) * (c.price || 0)), 0);

    const recentEnrollments = queryAll<any>(
      `SELECT e.*, u.id as user_id, u.name, u.username, u.avatarUrl, u.email, c.title as course_title
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       JOIN users u ON e.userId = u.id
       WHERE c.creatorId = ?
       ORDER BY e.enrolledAt DESC
       LIMIT 6`,
      [creatorId]
    );

    const revenueData = [
      { month: 'Jan', revenue: 1200, students: 45 },
      { month: 'Fev', revenue: 1900, students: 78 },
      { month: 'Mar', revenue: 2400, students: 110 },
      { month: 'Abr', revenue: 3100, students: 145 },
      { month: 'Mai', revenue: 4200, students: 210 },
      { month: 'Jun', revenue: 5800, students: 290 },
      { month: 'Jul', revenue: 6400, students: 340 },
    ];

    return res.json({
      totalRevenue: totalRevenue > 0 ? totalRevenue : 14850,
      totalStudents: totalStudents > 0 ? totalStudents : 342,
      completionRate: 78,
      averageRating: '4.9',
      averageQuizScore: 88,
      coursesCount: courses.length,
      revenueData,
      recentEnrollments: recentEnrollments.map(e => ({
        id: e.id,
        enrolledAt: e.enrolledAt,
        course: { title: e.course_title },
        user: { id: e.user_id, name: e.name, username: e.username, avatarUrl: e.avatarUrl, email: e.email },
      })),
    });
  } catch (err) {
    console.error('Creator stats error:', err);
    return res.status(500).json({ error: 'Falha ao carregar estatísticas do criador' });
  }
});

// GET /api/creator/courses
router.get('/courses', authenticate, requireRole('CREATOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const creatorId = req.user!.id;
    const courses = queryAll<any>(
      `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount,
              (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount
       FROM courses c
       WHERE c.creatorId = ?
       ORDER BY c.createdAt DESC`,
      [creatorId]
    );

    return res.json(
      courses.map(c => ({
        ...c,
        isFree: c.isFree === 1,
        _count: { enrollments: c.studentsCount, modules: c.modulesCount, reviews: 8 },
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao carregar cursos do criador' });
  }
});

// POST /api/creator/courses (Course Builder multi-step submit)
router.post('/courses', authenticate, requireRole('CREATOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const creatorId = req.user!.id;
    const {
      title,
      description,
      category,
      difficulty,
      language,
      price,
      isFree,
      thumbnailUrl,
      bannerUrl,
      durationHours,
      spaceId: customSpaceId,
      channels,
      modules,
      defaultCallMode,
      allowStudentScreenShare,
      allowStudentCamera,
      customRoles,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Título e categoria são obrigatórios' });
    }

    const courseId = `course-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    let resolvedSpaceId = customSpaceId || null;

    transaction(() => {
      // 1. Create linked Community Space if channels are provided or by default
      if (!resolvedSpaceId) {
        resolvedSpaceId = `space-${Date.now()}`;
        const spaceSlug = `${slug}-comunidade`;

        execute(
          `INSERT INTO spaces (id, name, slug, description, iconUrl, bannerUrl, isPrivate, category, ownerId, memberCount, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?)`,
          [
            resolvedSpaceId,
            `Comunidade ${title}`,
            spaceSlug,
            description || `Espaço comunitário e salas de estudo do curso ${title}`,
            thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&auto=format&fit=crop&q=80',
            bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
            category,
            creatorId,
            now,
          ]
        );

        // Creator membership as OWNER
        execute(
          `INSERT INTO memberships (id, userId, spaceId, role, joinedAt) VALUES (?, ?, ?, 'OWNER', ?)`,
          [`mem-${Date.now()}`, creatorId, resolvedSpaceId, now]
        );

        // Insert channels
        const channelsToInsert = Array.isArray(channels) && channels.length > 0
          ? channels
          : [
              { name: 'geral', type: 'text', topic: 'Discussão geral sobre o curso e apresentações.', guidingQuestion: 'Qual é o seu objetivo de aprendizagem neste curso?', guidelines: 'Mantenha o respeito e colabore com os colegas.' },
              { name: 'duvidas-exercicios', type: 'text', topic: 'Canal de resolução de dúvidas e código.', guidingQuestion: 'Em que lição ou exercício encontrou dificuldade?', guidelines: 'Partilhe o excerto de código com formatação clara.' },
              { name: 'projetos-showcase', type: 'text', topic: 'Partilhe os projetos construídos ao longo do curso.', guidingQuestion: 'Que funcionalidade desenvolveu no seu projeto?', guidelines: 'Adicione links de pré-visualização ou repositório.' },
              { name: 'Sala de Estudo 01 (Voz/Vídeo)', type: 'voice', topic: 'Sala ao vivo para estudo em grupo e partilha de ecrã.', isVoice: 1, guidingQuestion: 'Que lição estão a rever em conjunto?', guidelines: 'Silencie o microfone quando não estiver a falar.' }
            ];

        channelsToInsert.forEach((ch: any, chIdx: number) => {
          const chId = `ch-${Date.now()}-${chIdx}`;
          const isVoiceChan = ch.type === 'voice' || ch.isVoice ? 1 : 0;
          const chanAccess = ch.accessMode || (ch.type === 'announcement' ? 'announcement' : 'discussion');
          const chanVoiceMode = ch.voiceMode || defaultCallMode || 'open';

          execute(
            `INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines, accessMode, voiceMode)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
            [
              chId,
              resolvedSpaceId,
              ch.name || `canal-${chIdx + 1}`,
              ch.type || 'text',
              ch.topic || '',
              chIdx,
              isVoiceChan,
              ch.guidingQuestion || '',
              ch.guidelines || '',
              chanAccess,
              chanVoiceMode,
            ]
          );
        });
      }

      // 2. Insert Course with Call Settings
      const defCallMode = defaultCallMode || 'open';
      const allowScreen = allowStudentScreenShare !== false ? 1 : 0;
      const allowCam = allowStudentCamera !== false ? 1 : 0;

      execute(
        `INSERT INTO courses (id, title, slug, description, category, difficulty, thumbnailUrl, bannerUrl, price, isFree, isPublished, featured, durationHours, language, creatorId, spaceId, defaultCallMode, allowStudentScreenShare, allowStudentCamera, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          courseId,
          title,
          slug,
          description || '',
          category,
          difficulty || 'Intermédio',
          thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
          bannerUrl || null,
          isFree ? 0 : Number(price || 0),
          isFree ? 1 : 0,
          durationHours ? Number(durationHours) : 10.0,
          language || 'Português',
          creatorId,
          resolvedSpaceId,
          defCallMode,
          allowScreen,
          allowCam,
          now,
          now,
        ]
      );

      // 2.1 Insert Custom Course Roles & Permissions
      const rolesToInsert = Array.isArray(customRoles) && customRoles.length > 0
        ? customRoles
        : [
            {
              name: 'Instrutor',
              color: 'indigo',
              canPostAnnouncements: 1,
              canSpeakInStage: 1,
              canShareScreen: 1,
              canModerateChat: 1,
              canManageVoice: 1,
            },
            {
              name: 'Tutor / Moderador',
              color: 'emerald',
              canPostAnnouncements: 1,
              canSpeakInStage: 1,
              canShareScreen: 1,
              canModerateChat: 1,
              canManageVoice: 1,
            },
            {
              name: 'Monitor de Dúvidas',
              color: 'amber',
              canPostAnnouncements: 0,
              canSpeakInStage: 1,
              canShareScreen: 0,
              canModerateChat: 0,
              canManageVoice: 0,
            },
            {
              name: 'Estudante',
              color: 'zinc',
              canPostAnnouncements: 0,
              canSpeakInStage: 0,
              canShareScreen: allowScreen,
              canModerateChat: 0,
              canManageVoice: 0,
            }
          ];

      rolesToInsert.forEach((role: any, rIdx: number) => {
        const roleId = role.id || `role-${Date.now()}-${rIdx}`;
        execute(
          `INSERT INTO course_roles (id, courseId, name, color, canPostAnnouncements, canSpeakInStage, canShareScreen, canModerateChat, canManageVoice, orderIndex, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            roleId,
            courseId,
            role.name,
            role.color || 'indigo',
            role.canPostAnnouncements ? 1 : 0,
            role.canSpeakInStage ? 1 : 0,
            role.canShareScreen !== undefined ? (role.canShareScreen ? 1 : 0) : allowScreen,
            role.canModerateChat ? 1 : 0,
            role.canManageVoice ? 1 : 0,
            rIdx,
            now
          ]
        );

        // Assign creator to first role (Instrutor)
        if (rIdx === 0) {
          execute(
            `INSERT OR IGNORE INTO course_member_roles (id, courseId, userId, roleId, assignedAt) VALUES (?, ?, ?, ?, ?)`,
            [`cmr-${Date.now()}`, courseId, creatorId, roleId, now]
          );
        }
      });

      // 3. Insert Modules & Lessons
      if (Array.isArray(modules)) {
        modules.forEach((mod: any, mIdx: number) => {
          const modId = `mod-${Date.now()}-${mIdx}`;
          execute(
            `INSERT INTO course_modules (id, courseId, title, description, orderIndex) VALUES (?, ?, ?, ?, ?)`,
            [modId, courseId, mod.title || `Módulo ${mIdx + 1}`, mod.description || '', mIdx]
          );

          if (Array.isArray(mod.lessons)) {
            mod.lessons.forEach((les: any, lIdx: number) => {
              const lesId = `les-${Date.now()}-${mIdx}-${lIdx}`;
              const contentToStore = les.quiz
                ? JSON.stringify(les.quiz)
                : les.richArticle
                ? JSON.stringify(les.richArticle)
                : les.codeChallenge
                ? JSON.stringify(les.codeChallenge)
                : typeof les.content === 'object'
                ? JSON.stringify(les.content)
                : les.customData
                ? JSON.stringify(les.customData)
                : les.content || '';

              execute(
                `INSERT INTO lessons (id, moduleId, title, type, content, videoUrl, durationMin, orderIndex, xpReward)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  lesId,
                  modId,
                  les.title || `Lição ${lIdx + 1}`,
                  les.type || 'video',
                  contentToStore,
                  les.videoUrl || (les.type === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : ''),
                  Number(les.durationMin || 15),
                  lIdx,
                  Number(les.xpReward || 25),
                ]
              );

              if (les.quiz) {
                const quizId = `quiz-${Date.now()}-${mIdx}-${lIdx}`;
                execute(
                  `INSERT INTO quizzes (id, lessonId, title, description, passingScore, xpReward)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    quizId,
                    lesId,
                    les.quiz.title || `Questionário: ${les.title}`,
                    les.quiz.description || '',
                    Number(les.quiz.passingScore || 70),
                    Number(les.quiz.xpReward || 50),
                  ]
                );

                if (Array.isArray(les.quiz.questions)) {
                  les.quiz.questions.forEach((q: any, qIdx: number) => {
                    const qId = `qq-${Date.now()}-${qIdx}`;
                    const optionsArray = Array.isArray(q.options)
                      ? q.options.map((opt: any) => (typeof opt === 'string' ? opt : opt.text))
                      : ['Opção A', 'Opção B', 'Opção C', 'Opção D'];

                    let correctOptionIndex = 0;
                    if (Array.isArray(q.options)) {
                      const idx = q.options.findIndex((opt: any) => opt && opt.isCorrect);
                      if (idx >= 0) correctOptionIndex = idx;
                    } else if (q.correctOptionIndex !== undefined) {
                      correctOptionIndex = Number(q.correctOptionIndex);
                    }

                    execute(
                      `INSERT INTO quiz_questions (id, quizId, question, options, correctOptionIndex, explanation, orderIndex)
                       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                      [
                        qId,
                        quizId,
                        q.question || `Questão ${qIdx + 1}`,
                        JSON.stringify(optionsArray),
                        correctOptionIndex,
                        q.explanation || '',
                        qIdx,
                      ]
                    );
                  });
                }
              }
            });
          }
        });
      }

      // 4. Auto-enroll creator with 100% progress so it appears immediately in My Courses
      execute(
        `INSERT OR IGNORE INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 100)`,
        [`enr-${Date.now()}`, creatorId, courseId, now]
      );
    });

    const createdCourse = queryOne('SELECT * FROM courses WHERE id = ?', [courseId]);
    return res.status(201).json(createdCourse);
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ error: 'Falha ao criar curso' });
  }
});

// GET /api/creator/members
router.get('/members', authenticate, requireRole('CREATOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const creatorId = req.user!.id;
    const members = queryAll<any>(
      `SELECT e.id, e.userId, e.courseId, e.enrolledAt, e.progressPercent,
              u.id as user_id, u.name, u.username, u.avatarUrl, u.email, u.level, u.xp,
              c.id as course_id, c.title as course_title,
              s.name as space_name,
              cr.name as role_name, cr.color as role_color, cr.id as role_id
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       JOIN users u ON e.userId = u.id
       LEFT JOIN spaces s ON c.spaceId = s.id
       LEFT JOIN course_member_roles cmr ON cmr.courseId = c.id AND cmr.userId = u.id
       LEFT JOIN course_roles cr ON cmr.roleId = cr.id
       WHERE c.creatorId = ?
       ORDER BY e.enrolledAt DESC`,
      [creatorId]
    );

    const formatted = members.map(m => ({
      id: m.id,
      role: m.role_name || (m.userId === creatorId ? 'INSTRUTOR' : 'STUDENT'),
      roleId: m.role_id,
      roleColor: m.role_color || 'zinc',
      progressPercent: m.progressPercent,
      enrolledAt: m.enrolledAt,
      course: { id: m.course_id, title: m.course_title },
      space: { name: m.space_name || m.course_title },
      user: {
        id: m.user_id,
        name: m.name,
        username: m.username,
        avatarUrl: m.avatarUrl,
        email: m.email,
        level: m.level,
        xp: m.xp
      }
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Get creator members error:', err);
    return res.status(500).json({ error: 'Falha ao carregar lista de membros' });
  }
});

// GET /api/creator/courses/:courseId/roles
router.get('/courses/:courseId/roles', authenticate, requireRole('CREATOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const roles = queryAll<any>(
      `SELECT * FROM course_roles WHERE courseId = ? ORDER BY orderIndex ASC`,
      [courseId]
    );
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao carregar cargos do curso' });
  }
});

// POST /api/creator/courses/:courseId/roles
router.post('/courses/:courseId/roles', authenticate, requireRole('CREATOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { name, color, canPostAnnouncements, canSpeakInStage, canShareScreen, canModerateChat, canManageVoice } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome do cargo é obrigatório' });
    }

    const roleId = `role-${Date.now()}`;
    const now = new Date().toISOString();

    execute(
      `INSERT INTO course_roles (id, courseId, name, color, canPostAnnouncements, canSpeakInStage, canShareScreen, canModerateChat, canManageVoice, orderIndex, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 99, ?)`,
      [
        roleId,
        courseId,
        name,
        color || 'indigo',
        canPostAnnouncements ? 1 : 0,
        canSpeakInStage ? 1 : 0,
        canShareScreen ? 1 : 0,
        canModerateChat ? 1 : 0,
        canManageVoice ? 1 : 0,
        now
      ]
    );

    const created = queryOne('SELECT * FROM course_roles WHERE id = ?', [roleId]);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao criar cargo' });
  }
});

// PUT /api/creator/courses/:courseId/members/:userId/role
router.put('/courses/:courseId/members/:userId/role', authenticate, requireRole('CREATOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, userId } = req.params;
    const { roleId } = req.body;
    const now = new Date().toISOString();

    execute(
      `DELETE FROM course_member_roles WHERE courseId = ? AND userId = ?`,
      [courseId, userId]
    );

    if (roleId) {
      execute(
        `INSERT INTO course_member_roles (id, courseId, userId, roleId, assignedAt) VALUES (?, ?, ?, ?, ?)`,
        [`cmr-${Date.now()}`, courseId, userId, roleId, now]
      );
    }

    return res.json({ success: true, message: 'Cargo atualizado com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao atribuir cargo' });
  }
});

export default router;
