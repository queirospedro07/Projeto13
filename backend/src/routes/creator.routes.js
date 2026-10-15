import { canManageCourse } from '../services/courseAccess.js';
import { randomUUID } from 'node:crypto';
import { validateCourseBody } from '../validation/content.js';
import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../database/connection.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();

// Obter estado da candidatura a criador do utilizador autenticado
router.get('/application-status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const application = queryOne(
      'SELECT * FROM creator_applications WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
      [userId],
    );
    return res.json({
      role: req.user.role,
      hasApplication: !!application,
      application: application || null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao obter estado da candidatura' });
  }
});

// Submeter inquérito de candidatura a criador / formador
router.post('/apply', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (req.user.role === 'CREATOR' || req.user.role === 'ADMIN') {
      return res
        .status(400)
        .json({ error: 'A sua conta já tem estatuto de Formador ou Administrador.' });
    }

    const existingPending = queryOne(
      "SELECT id FROM creator_applications WHERE userId = ? AND status = 'PENDING'",
      [userId],
    );
    if (existingPending) {
      return res
        .status(400)
        .json({ error: 'Já tem uma candidatura pendente em análise pela administração.' });
    }

    const {
      fullName,
      bio,
      expertise,
      experienceYears,
      portfolioUrl,
      motivation,
      proposedCourses,
      sampleVideoUrl,
    } = req.body;

    if (!fullName || !expertise || !motivation || !proposedCourses) {
      return res.status(400).json({
        error: 'Nome completo, especialização, motivação e proposta de cursos são obrigatórios.',
      });
    }

    const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    execute(
      `
      INSERT INTO creator_applications (id, userId, fullName, bio, expertise, experienceYears, portfolioUrl, motivation, proposedCourses, sampleVideoUrl, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `,
      [
        appId,
        userId,
        fullName.trim(),
        bio?.trim() || '',
        expertise.trim(),
        Number(experienceYears) || 0,
        portfolioUrl?.trim() || '',
        motivation.trim(),
        proposedCourses.trim(),
        sampleVideoUrl?.trim() || '',
        now,
        now,
      ],
    );

    // Notificar administradores
    const admins = queryAll("SELECT id FROM users WHERE role = 'ADMIN'");
    for (const admin of admins) {
      execute(
        `
        INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
        VALUES (?, ?, 'admin', 'Nova Candidatura a Formador', ?, '/admin', 0, ?)
      `,
        [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          admin.id,
          `${fullName} submeteu um inquérito de candidatura para lecionar no NEXO.`,
          now,
        ],
      );
    }

    const application = queryOne('SELECT * FROM creator_applications WHERE id = ?', [appId]);
    return res.status(201).json({
      message: 'Candidatura submetida com sucesso! A aguardar revisão do Administrador.',
      application,
    });
  } catch (err) {
    console.error('Error submitting creator application:', err);
    return res.status(500).json({ error: 'Falha ao submeter candidatura a criador' });
  }
});

router.get('/stats', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const creatorId = req.user.id;
    const courses = queryAll(
      `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id AND userId != ? AND userId != COALESCE(c.creatorId, '')) as studentsCount
       FROM courses c
      WHERE c.creatorId = ?`,
      [creatorId, creatorId],
    );
    const totalStudents = courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0);
    const totalRevenue = null;
    const recentEnrollments = queryAll(
      `SELECT e.*, u.id as user_id, u.name, u.username, u.avatarUrl, u.email, c.title as course_title
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       JOIN users u ON e.userId = u.id
       WHERE c.creatorId = ? AND e.userId != ?
       ORDER BY e.enrolledAt DESC
       LIMIT 6`,
      [creatorId, creatorId],
    );
    const completedEnrollments =
      queryOne(
        `SELECT COUNT(*) as c FROM enrollments e JOIN courses c ON e.courseId = c.id WHERE c.creatorId = ? AND e.userId != ? AND e.progressPercent >= 100`,
        [creatorId, creatorId],
      )?.c || 0;
    const completionRate =
      totalStudents > 0 ? Math.round((completedEnrollments / totalStudents) * 100) : 0;

    const ratingRow = queryOne(
      `SELECT AVG(r.rating) as avgRating FROM reviews r JOIN courses c ON r.courseId = c.id WHERE c.creatorId = ?`,
      [creatorId],
    );
    const averageRating = ratingRow?.avgRating ? Number(ratingRow.avgRating).toFixed(1) : '0.0';

    const quizRow = queryOne(
      `SELECT AVG(qa.nota) as avgScore FROM submissoes_questionario qa JOIN lessons l ON qa.id_aula = l.id JOIN course_modules cm ON l.moduleId = cm.id JOIN courses c ON cm.courseId = c.id WHERE c.creatorId = ? AND qa.pendente = 0`,
      [creatorId],
    );
    const averageQuizScore = quizRow?.avgScore ? Math.round(Number(quizRow.avgScore)) : 0;

    return res.json({
      totalRevenue,
      totalStudents: totalStudents || 0,
      completionRate,
      averageRating,
      averageQuizScore,
      coursesCount: courses.length,
      revenueData: [],
      recentEnrollments: recentEnrollments.map((e) => ({
        id: e.id,
        enrolledAt: e.enrolledAt,
        course: {
          title: e.course_title,
        },
        user: {
          id: e.user_id,
          name: e.name,
          username: e.username,
          avatarUrl: e.avatarUrl,
          email: e.email,
        },
      })),
    });
  } catch (err) {
    console.error('Creator stats error:', err);
    return res.status(500).json({
      error: 'Falha ao carregar estatísticas do criador',
    });
  }
});
router.get(
  '/courses/:courseId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const creatorId = req.user.id;
      const course = queryOne(
        `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount,
              (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount
       FROM courses c
       WHERE c.id = ? AND (c.creatorId = ? OR ? = 'ADMIN' OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = c.id AND id_utilizador = ?))`,
        [courseId, creatorId, req.user.role, creatorId],
      );
      if (!course)
        return res.status(404).json({
          error: 'Curso não encontrado ou sem permissão',
        });
      const modules = queryAll(
        `SELECT * FROM course_modules WHERE courseId = ? ORDER BY orderIndex ASC`,
        [courseId],
      );
      for (const mod of modules) {
        mod.lessons = queryAll(`SELECT * FROM lessons WHERE moduleId = ? ORDER BY orderIndex ASC`, [
          mod.id,
        ]);
        for (const les of mod.lessons) {
          if (
            typeof les.content === 'string' &&
            (les.content.startsWith('{') || les.content.startsWith('['))
          ) {
            try {
              const parsed = JSON.parse(les.content);
              if (les.type === 'quiz') les.quiz = parsed;
              else if (les.type === 'article' || les.type === 'text') les.richArticle = parsed;
              else les.customData = parsed;
            } catch {}
          }
          if (les.type === 'quiz' && !les.quiz) {
            const q = queryOne('SELECT * FROM quizzes WHERE lessonId = ?', [les.id]);
            if (q) {
              const questions = queryAll(
                'SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex ASC',
                [q.id],
              );
              q.questions = questions.map((qq) => ({
                ...qq,
                options: (() => {
                  try {
                    return typeof qq.options === 'string'
                      ? JSON.parse(qq.options)
                      : qq.options || [];
                  } catch (_) {
                    return [];
                  }
                })(),
              }));
              les.quiz = q;
            }
          }
        }
      }
      const spaceId = course.spaceId;
      const channels = spaceId
        ? queryAll(`SELECT * FROM channels WHERE spaceId = ? ORDER BY orderIndex ASC`, [spaceId])
        : [];
      let parsedOutcomes = [];
      try {
        parsedOutcomes = course.learningOutcomes
          ? typeof course.learningOutcomes === 'string'
            ? JSON.parse(course.learningOutcomes)
            : course.learningOutcomes
          : [];
      } catch (_) {
        parsedOutcomes = course.learningOutcomes ? [course.learningOutcomes] : [];
      }

      let parsedRequirements = [];
      try {
        parsedRequirements = course.requirements
          ? typeof course.requirements === 'string'
            ? JSON.parse(course.requirements)
            : course.requirements
          : [];
      } catch (_) {
        parsedRequirements = course.requirements ? [course.requirements] : [];
      }

      let parsedDocuments = [];
      try {
        parsedDocuments = course.documents
          ? typeof course.documents === 'string'
            ? JSON.parse(course.documents)
            : course.documents
          : [];
      } catch (_) {
        parsedDocuments = [];
      }

      return res.json({
        ...course,
        learningOutcomes: parsedOutcomes,
        requirements: parsedRequirements,
        documents: parsedDocuments,
        isFree: course.isFree === 1,
        isPublished: course.isPublished === 1,
        allowStudentScreenShare: course.allowStudentScreenShare === 1,
        allowStudentCamera: course.allowStudentCamera === 1,
        modules,
        channels,
        customRoles: [],
      });
    } catch (err) {
      return res.status(500).json({
        error: 'Falha ao carregar curso',
      });
    }
  },
);
router.put(
  '/courses/:courseId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  validateCourseBody,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const creatorId = req.user.id;
      let owned = null;
      if (req.user.role !== 'ADMIN') {
        owned = queryOne(
          `SELECT * FROM courses WHERE id = ? AND (creatorId = ? OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = ? AND id_utilizador = ?))`,
          [courseId, creatorId, courseId, creatorId],
        );
        if (!owned)
          return res.status(403).json({
            error: 'Sem permissão para editar este curso',
          });
      } else {
        owned = queryOne('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!owned)
          return res.status(404).json({
            error: 'Curso não encontrado',
          });
      }
      const {
        title,
        description,
        category,
        difficulty,
        language,
        price,
        isFree,
        isPublished,
        thumbnailUrl,
        thumbnailPosition,
        bannerUrl,
        bannerPosition,
        durationHours,
        defaultCallMode,
        allowStudentScreenShare,
        allowStudentCamera,
        learningOutcomes,
        requirements,
        documents,
        modules,
        channels,
      } = req.body;
      const now = new Date().toISOString();

      const outcomesStr =
        learningOutcomes !== undefined
          ? typeof learningOutcomes === 'string'
            ? learningOutcomes
            : JSON.stringify(learningOutcomes)
          : null;
      const requirementsStr =
        requirements !== undefined
          ? typeof requirements === 'string'
            ? requirements
            : JSON.stringify(requirements)
          : null;
      const documentsStr =
        documents !== undefined
          ? typeof documents === 'string'
            ? documents
            : JSON.stringify(documents)
          : null;
      const safeIsPublished =
        req.user.role !== 'ADMIN' ? 0 : isPublished !== undefined ? (isPublished ? 1 : 0) : null;

      transaction(() => {
        execute(
          `UPDATE courses SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          difficulty = COALESCE(?, difficulty),
          language = COALESCE(?, language),
          price = ?,
          isFree = ?,
          isPublished = COALESCE(?, isPublished),
          approvalStatus = ${req.user.role === 'ADMIN' ? 'approvalStatus' : "'DRAFT'"},
          thumbnailUrl = COALESCE(?, thumbnailUrl),
          thumbnailPosition = COALESCE(?, thumbnailPosition),
          bannerUrl = COALESCE(?, bannerUrl),
          bannerPosition = COALESCE(?, bannerPosition),
          durationHours = ?,
          defaultCallMode = COALESCE(?, defaultCallMode),
          allowStudentScreenShare = ?,
          allowStudentCamera = ?,
          learningOutcomes = ?,
          requirements = ?,
          documents = ?,
          updatedAt = ?
         WHERE id = ?`,
          [
            title && title.trim() ? title.trim() : null,
            description !== undefined ? description.trim() : null,
            category && category.trim() ? category.trim() : null,
            difficulty && difficulty.trim() ? difficulty.trim() : null,
            language && language.trim() ? language.trim() : null,
            (isFree ?? owned.isFree) ? 0 : Number(price ?? owned.price),
            (isFree ?? owned.isFree) ? 1 : 0,
            safeIsPublished,
            thumbnailUrl !== undefined ? thumbnailUrl : null,
            thumbnailPosition || null,
            bannerUrl !== undefined ? bannerUrl : null,
            bannerPosition || null,
            durationHours !== undefined ? Number(durationHours) : owned.durationHours,
            defaultCallMode || 'open',
            allowStudentScreenShare !== undefined ? (allowStudentScreenShare ? 1 : 0) : 1,
            allowStudentCamera !== undefined ? (allowStudentCamera ? 1 : 0) : 1,
            outcomesStr,
            requirementsStr,
            documentsStr,
            now,
            courseId,
          ],
        );

        if (owned?.spaceId && title) {
          execute('UPDATE spaces SET name = ?, description = ? WHERE id = ?', [
            title.trim(),
            description || '',
            owned.spaceId,
          ]);
        }

        if (Array.isArray(modules)) {
          const existingModules = queryAll('SELECT id FROM course_modules WHERE courseId = ?', [
            courseId,
          ]);
          const incomingModIds = new Set(
            modules.filter((m) => m.id && !String(m.id).startsWith('mod-temp-')).map((m) => m.id),
          );

          for (const exMod of existingModules) {
            if (!incomingModIds.has(exMod.id)) {
              const exLessons = queryAll('SELECT id FROM lessons WHERE moduleId = ?', [exMod.id]);
              for (const el of exLessons) {
                execute(
                  'DELETE FROM quiz_questions WHERE quizId IN (SELECT id FROM quizzes WHERE lessonId = ?)',
                  [el.id],
                );
                execute('DELETE FROM quizzes WHERE lessonId = ?', [el.id]);
                execute('DELETE FROM lesson_progress WHERE lessonId = ?', [el.id]);
                execute('DELETE FROM notes WHERE lessonId = ?', [el.id]);
              }
              execute('DELETE FROM lessons WHERE moduleId = ?', [exMod.id]);
              execute('DELETE FROM course_modules WHERE id = ?', [exMod.id]);
            }
          }

          modules.forEach((mod, mIdx) => {
            let modId = mod.id;
            const drip = mod.dripMode === 'sequential' ? 'sequential' : 'instant';
            const exists = modId
              ? queryOne('SELECT id FROM course_modules WHERE id = ? AND courseId = ?', [
                  modId,
                  courseId,
                ])
              : null;
            if (exists) {
              execute(
                'UPDATE course_modules SET title = ?, description = ?, orderIndex = ?, dripMode = ? WHERE id = ? AND courseId = ?',
                [
                  mod.title || `Módulo ${mIdx + 1}`,
                  mod.description || '',
                  mIdx,
                  drip,
                  modId,
                  courseId,
                ],
              );
            } else {
              modId =
                modId && !queryOne('SELECT id FROM course_modules WHERE id = ?', [modId])
                  ? modId
                  : randomUUID();
              execute(
                'INSERT INTO course_modules (id, courseId, title, description, orderIndex, dripMode) VALUES (?, ?, ?, ?, ?, ?)',
                [
                  modId,
                  courseId,
                  mod.title || `Módulo ${mIdx + 1}`,
                  mod.description || '',
                  mIdx,
                  drip,
                ],
              );
            }

            if (Array.isArray(mod.lessons)) {
              const existingLessons = queryAll('SELECT id FROM lessons WHERE moduleId = ?', [
                modId,
              ]);
              const incomingLesIds = new Set(
                mod.lessons
                  .filter((l) => l.id && !String(l.id).startsWith('les-temp-'))
                  .map((l) => l.id),
              );

              for (const exLes of existingLessons) {
                if (!incomingLesIds.has(exLes.id)) {
                  execute(
                    'DELETE FROM quiz_questions WHERE quizId IN (SELECT id FROM quizzes WHERE lessonId = ?)',
                    [exLes.id],
                  );
                  execute('DELETE FROM quizzes WHERE lessonId = ?', [exLes.id]);
                  execute('DELETE FROM lesson_progress WHERE lessonId = ?', [exLes.id]);
                  execute('DELETE FROM notes WHERE lessonId = ?', [exLes.id]);
                  execute('DELETE FROM lessons WHERE id = ?', [exLes.id]);
                }
              }

              mod.lessons.forEach((les, lIdx) => {
                let lesId = les.id;
                const contentToStore = les.quiz
                  ? JSON.stringify(les.quiz)
                  : les.richArticle
                    ? JSON.stringify(les.richArticle)
                    : typeof les.content === 'object'
                      ? JSON.stringify(les.content)
                      : les.customData
                        ? JSON.stringify(les.customData)
                        : les.content || '';
                const lesExists = lesId
                  ? queryOne('SELECT id FROM lessons WHERE id = ? AND moduleId = ?', [lesId, modId])
                  : null;

                if (lesExists) {
                  execute(
                    'UPDATE lessons SET title = ?, type = ?, content = ?, videoUrl = ?, durationMin = ?, orderIndex = ?, xpReward = ? WHERE id = ? AND moduleId = ?',
                    [
                      les.title || `Aula ${lIdx + 1}`,
                      les.type || 'video',
                      contentToStore,
                      les.videoUrl || '',
                      Number(les.durationMin || 15),
                      lIdx,
                      Number(les.xpReward || 25),
                      lesId,
                      modId,
                    ],
                  );
                } else {
                  lesId =
                    lesId && !queryOne('SELECT id FROM lessons WHERE id = ?', [lesId])
                      ? lesId
                      : randomUUID();
                  execute(
                    'INSERT INTO lessons (id, moduleId, title, type, content, videoUrl, durationMin, orderIndex, xpReward) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                      lesId,
                      modId,
                      les.title || `Aula ${lIdx + 1}`,
                      les.type || 'video',
                      contentToStore,
                      les.videoUrl || '',
                      Number(les.durationMin || 15),
                      lIdx,
                      Number(les.xpReward || 25),
                    ],
                  );
                }

                if (les.quiz) {
                  const quizId = `quiz-${lesId}`;
                  const qExists = queryOne('SELECT id FROM quizzes WHERE lessonId = ?', [lesId]);
                  if (qExists) {
                    execute(
                      'UPDATE quizzes SET title = ?, description = ?, passingScore = ?, xpReward = ? WHERE id = ?',
                      [
                        les.quiz.title || `Questionário: ${les.title}`,
                        les.quiz.description || '',
                        Number(les.quiz.passingScore || 70),
                        Number(les.quiz.xpReward || 50),
                        qExists.id,
                      ],
                    );
                    execute('DELETE FROM quiz_questions WHERE quizId = ?', [qExists.id]);
                  } else {
                    execute(
                      'INSERT INTO quizzes (id, lessonId, title, description, passingScore, xpReward) VALUES (?, ?, ?, ?, ?, ?)',
                      [
                        quizId,
                        lesId,
                        les.quiz.title || `Questionário: ${les.title}`,
                        les.quiz.description || '',
                        Number(les.quiz.passingScore || 70),
                        Number(les.quiz.xpReward || 50),
                      ],
                    );
                  }
                  const activeQuizId = qExists ? qExists.id : quizId;
                  if (Array.isArray(les.quiz.questions)) {
                    les.quiz.questions.forEach((q, qIdx) => {
                      const qId = randomUUID();
                      const optionsArray = Array.isArray(q.options)
                        ? q.options.map((opt) => (typeof opt === 'string' ? opt : opt.text))
                        : ['Opção A', 'Opção B'];
                      let correctOptionIndex = 0;
                      if (Array.isArray(q.options)) {
                        const idx = q.options.findIndex((opt) => opt && opt.isCorrect);
                        if (idx >= 0) correctOptionIndex = idx;
                      } else if (q.correctOptionIndex !== undefined) {
                        correctOptionIndex = Number(q.correctOptionIndex);
                      }
                      execute(
                        'INSERT INTO quiz_questions (id, quizId, question, options, correctOptionIndex, explanation, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [
                          qId,
                          activeQuizId,
                          q.question || `Questão ${qIdx + 1}`,
                          JSON.stringify(optionsArray),
                          correctOptionIndex,
                          q.explanation || '',
                          qIdx,
                        ],
                      );
                    });
                  }
                }
              });
            }
          });
        }

        if (Array.isArray(channels) && owned?.spaceId) {
          channels.forEach((ch, chIdx) => {
            const isVoiceChan = ch.type === 'voice' || ch.isVoice ? 1 : 0;
            const chanAccess =
              ch.accessMode || (ch.type === 'announcement' ? 'announcement' : 'discussion');
            const chanVoiceMode = ch.voiceMode || defaultCallMode || 'open';
            const chExists = ch.id
              ? queryOne('SELECT id FROM channels WHERE id = ? AND spaceId = ?', [
                  ch.id,
                  owned.spaceId,
                ])
              : null;
            if (chExists) {
              execute(
                'UPDATE channels SET name = ?, type = ?, topic = ?, orderIndex = ?, isVoice = ?, accessMode = ?, voiceMode = ? WHERE id = ?',
                [
                  ch.name,
                  ch.type || 'text',
                  ch.topic || '',
                  chIdx,
                  isVoiceChan,
                  chanAccess,
                  chanVoiceMode,
                  ch.id,
                ],
              );
            } else {
              const newChId = ch.id || `ch-${Date.now()}-${chIdx}`;
              execute(
                'INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines, accessMode, voiceMode) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)',
                [
                  newChId,
                  owned.spaceId,
                  ch.name || `canal-${chIdx + 1}`,
                  ch.type || 'text',
                  ch.topic || '',
                  chIdx,
                  isVoiceChan,
                  ch.guidingQuestion || '',
                  ch.guidelines || '',
                  chanAccess,
                  chanVoiceMode,
                ],
              );
            }
          });
        }
      });

      return res.json({
        success: true,
        id: courseId,
      });
    } catch (err) {
      console.error('Update course error:', err);
      return res.status(500).json({
        error: 'Falha ao atualizar curso',
      });
    }
  },
);
router.get('/courses', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const creatorId = req.user.id;
    const courses = queryAll(
      `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount,
              (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount,
              (SELECT COUNT(*) FROM reviews WHERE courseId = c.id) as reviewsCount,
              CASE WHEN c.creatorId = ? THEN 1 ELSE 0 END as isOwner
       FROM courses c
       WHERE c.creatorId = ?
          OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = c.id AND id_utilizador = ?)
       ORDER BY c.createdAt DESC`,
      [creatorId, creatorId, creatorId],
    );
    return res.json(
      courses.map((c) => ({
        ...c,
        isFree: c.isFree === 1,
        isOwner: c.isOwner === 1,
        _count: {
          enrollments: c.studentsCount || 0,
          modules: c.modulesCount || 0,
          reviews: c.reviewsCount || 0,
        },
      })),
    );
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao carregar cursos do criador',
    });
  }
});
router.delete(
  '/courses/:courseId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = queryOne(
        `
      SELECT c.id, c.creatorId, c.spaceId, s.ownerId AS spaceOwnerId
      FROM courses c
      LEFT JOIN spaces s ON s.id = c.spaceId
      WHERE c.id = ?
    `,
        [courseId],
      );

      if (!course) {
        return res.status(404).json({ error: 'Curso não encontrado' });
      }
      if (req.user.role !== 'ADMIN' && course.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'Só pode eliminar cursos que criou' });
      }

      const otherCourseUsesSpace =
        course.spaceId &&
        queryOne('SELECT id FROM courses WHERE spaceId = ? AND id != ? LIMIT 1', [
          course.spaceId,
          courseId,
        ]);
      const deleteOwnedSpace =
        course.spaceId && course.spaceOwnerId === course.creatorId && !otherCourseUsesSpace;

      transaction(() => {
        execute('DELETE FROM courses WHERE id = ?', [courseId]);
        if (deleteOwnedSpace) {
          execute('DELETE FROM spaces WHERE id = ? AND ownerId = ?', [
            course.spaceId,
            course.creatorId,
          ]);
        }
      });

      return res.json({ success: true, id: courseId });
    } catch (err) {
      console.error('Delete course error:', err);
      return res.status(500).json({ error: 'Falha ao eliminar curso' });
    }
  },
);
router.post(
  '/courses',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  validateCourseBody,
  async (req, res) => {
    try {
      const creatorId = req.user.id;
      const {
        title,
        description,
        category,
        difficulty,
        language,
        price,
        isFree,
        isPublished,
        thumbnailUrl,
        thumbnailPosition,
        bannerUrl,
        bannerPosition,
        durationHours,
        spaceId: customSpaceId,
        channels,
        modules,
        defaultCallMode,
        allowStudentScreenShare,
        allowStudentCamera,
        learningOutcomes,
        requirements,
        documents,
        customRoles,
      } = req.body;
      if (!title || !category) {
        return res.status(400).json({
          error: 'Título e categoria são obrigatórios',
        });
      }
      const courseId = randomUUID();
      const slug = `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();
      let resolvedSpaceId = customSpaceId || null;
      if (resolvedSpaceId) {
        const space = queryOne('SELECT ownerId FROM spaces WHERE id = ?', [resolvedSpaceId]);
        if (!space || (req.user.role !== 'ADMIN' && space.ownerId !== creatorId))
          return res.status(403).json({ error: 'Só pode associar comunidades que administra.' });
        if (queryOne('SELECT id FROM courses WHERE spaceId = ?', [resolvedSpaceId]))
          return res.status(409).json({ error: 'Esta comunidade já pertence a outro curso.' });
      }

      const outcomesStr = learningOutcomes
        ? typeof learningOutcomes === 'string'
          ? learningOutcomes
          : JSON.stringify(learningOutcomes)
        : null;
      const requirementsStr = requirements
        ? typeof requirements === 'string'
          ? requirements
          : JSON.stringify(requirements)
        : null;
      const documentsStr = documents
        ? typeof documents === 'string'
          ? documents
          : JSON.stringify(documents)
        : null;

      transaction(() => {
        if (!resolvedSpaceId) {
          resolvedSpaceId = randomUUID();
          const spaceSlug = `${slug}-comunidade`;
          execute(
            `INSERT INTO spaces (id, name, slug, description, iconUrl, bannerUrl, isPrivate, category, ownerId, memberCount, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?)`,
            [
              resolvedSpaceId,
              `Comunidade ${title}`,
              spaceSlug,
              description || `Espaço comunitário e salas de estudo do curso ${title}`,
              thumbnailUrl ||
                'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&auto=format&fit=crop&q=80',
              bannerUrl ||
                'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
              category,
              creatorId,
              now,
            ],
          );
          execute(
            `INSERT INTO memberships (id, userId, spaceId, role, joinedAt) VALUES (?, ?, ?, 'OWNER', ?)`,
            [randomUUID(), creatorId, resolvedSpaceId, now],
          );
          const channelsToInsert =
            Array.isArray(channels) && channels.length > 0
              ? channels
              : [
                  {
                    name: 'geral',
                    type: 'text',
                    topic: '',
                    guidingQuestion: '',
                    guidelines: '',
                  },
                ];
          channelsToInsert.forEach((ch, chIdx) => {
            const chId = randomUUID();
            const isVoiceChan = ch.type === 'voice' || ch.isVoice ? 1 : 0;
            const chanAccess =
              ch.accessMode || (ch.type === 'announcement' ? 'announcement' : 'discussion');
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
              ],
            );
          });
        }
        const defCallMode = defaultCallMode || 'open';
        const allowScreen = allowStudentScreenShare !== false ? 1 : 0;
        const allowCam = allowStudentCamera !== false ? 1 : 0;
        const approvalStatus = req.user.role === 'ADMIN' ? 'APPROVED' : 'DRAFT';
        const isPub = req.user.role === 'ADMIN' && isPublished ? 1 : 0;
        execute(
          `INSERT INTO courses (id, title, slug, description, category, difficulty, thumbnailUrl, thumbnailPosition, bannerUrl, bannerPosition, price, isFree, isPublished, approvalStatus, adminNotes, submittedForReviewAt, featured, durationHours, language, creatorId, spaceId, defaultCallMode, allowStudentScreenShare, allowStudentCamera, learningOutcomes, requirements, documents, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            courseId,
            title,
            slug,
            description || '',
            category,
            difficulty || 'Intermédio',
            thumbnailUrl ||
              'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
            thumbnailPosition || '50% 50%',
            bannerUrl || null,
            bannerPosition || '50% 50%',
            isFree ? 0 : Number(price || 0),
            isFree ? 1 : 0,
            isPub,
            approvalStatus,
            now,
            durationHours ? Number(durationHours) : 10.0,
            language || 'Português',
            creatorId,
            resolvedSpaceId,
            defCallMode,
            allowScreen,
            allowCam,
            outcomesStr,
            requirementsStr,
            documentsStr,
            now,
            now,
          ],
        );

        if (Array.isArray(modules)) {
          modules.forEach((mod, mIdx) => {
            const modId = randomUUID();
            const drip = mod.dripMode === 'sequential' ? 'sequential' : 'instant';
            execute(
              `INSERT INTO course_modules (id, courseId, title, description, orderIndex, dripMode) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                modId,
                courseId,
                mod.title || `Módulo ${mIdx + 1}`,
                mod.description || '',
                mIdx,
                drip,
              ],
            );
            if (Array.isArray(mod.lessons)) {
              mod.lessons.forEach((les, lIdx) => {
                const lesId = randomUUID();
                const contentToStore = les.quiz
                  ? JSON.stringify(les.quiz)
                  : les.richArticle
                    ? JSON.stringify(les.richArticle)
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
                    les.title || `Aula ${lIdx + 1}`,
                    les.type || 'video',
                    contentToStore,
                    les.videoUrl || '',
                    Number(les.durationMin || 15),
                    lIdx,
                    Number(les.xpReward || 25),
                  ],
                );
                if (les.quiz) {
                  const quizId = randomUUID();
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
                    ],
                  );
                  if (Array.isArray(les.quiz.questions)) {
                    les.quiz.questions.forEach((q, qIdx) => {
                      const qId = randomUUID();
                      const optionsArray = Array.isArray(q.options)
                        ? q.options.map((opt) => (typeof opt === 'string' ? opt : opt.text))
                        : ['Opção A', 'Opção B', 'Opção C', 'Opção D'];
                      let correctOptionIndex = 0;
                      if (Array.isArray(q.options)) {
                        const idx = q.options.findIndex((opt) => opt && opt.isCorrect);
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
                        ],
                      );
                    });
                  }
                }
              });
            }
          });
        }
        execute(
          `INSERT OR IGNORE INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 0)`,
          [randomUUID(), creatorId, courseId, now],
        );
      });
      const createdCourse = queryOne('SELECT * FROM courses WHERE id = ?', [courseId]);
      return res.status(201).json(createdCourse);
    } catch (err) {
      console.error('Create course error:', err);
      return res.status(500).json({
        error: 'Falha ao criar curso',
      });
    }
  },
);
router.get('/members', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const creatorId = req.user.id;
    const members = queryAll(
      `SELECT e.id, e.userId, e.courseId, e.enrolledAt, e.progressPercent,
              u.id as user_id, u.name, u.username, u.avatarUrl, u.email,
              c.id as course_id, c.title as course_title,
              s.name as space_name,
              CASE WHEN col.userId IS NOT NULL THEN 'COLABORADOR' ELSE 'ALUNO' END as member_type
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       JOIN users u ON e.userId = u.id
       LEFT JOIN spaces s ON c.spaceId = s.id
       LEFT JOIN course_collaborators col ON col.courseId = c.id AND col.userId = u.id
       WHERE (c.creatorId = ? OR c.id IN (SELECT courseId FROM course_collaborators WHERE userId = ?)) AND e.userId != ?
       ORDER BY e.enrolledAt DESC`,
      [creatorId, creatorId, creatorId],
    );
    const formatted = members.map((m) => ({
      id: m.id,
      role: m.member_type,
      progressPercent: m.progressPercent,
      enrolledAt: m.enrolledAt,
      course: {
        id: m.course_id,
        title: m.course_title,
      },
      space: {
        name: m.space_name || m.course_title,
      },
      user: {
        id: m.user_id,
        name: m.name,
        username: m.username,
        avatarUrl: m.avatarUrl,
        email: m.email,
        level: m.level,
        xp: m.xp,
      },
    }));
    return res.json(formatted);
  } catch (err) {
    console.error('Get creator members error:', err);
    return res.status(500).json({
      error: 'Falha ao carregar lista de membros',
    });
  }
});

router.get(
  '/courses/:courseId/collaborators',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;
      if (req.user.role !== 'ADMIN') {
        const access = queryOne(
          `
        SELECT id FROM courses WHERE id = ? AND (creatorId = ? OR id IN (SELECT courseId FROM course_collaborators WHERE userId = ?))
      `,
          [courseId, userId, userId],
        );
        if (!access) return res.status(403).json({ error: 'Acesso negado a este curso' });
      }
      const collaborators = queryAll(
        `
      SELECT cc.id, cc.courseId, cc.userId, cc.createdAt,
             u.name, u.username, u.email, u.avatarUrl
      FROM course_collaborators cc
      JOIN users u ON cc.userId = u.id
      WHERE cc.courseId = ?
      ORDER BY cc.createdAt ASC
    `,
        [courseId],
      );
      return res.json(collaborators);
    } catch (err) {
      console.error('Get collaborators error:', err);
      return res.status(500).json({ error: 'Falha ao carregar colaboradores do curso' });
    }
  },
);

router.post(
  '/courses/:courseId/collaborators',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;
      const course = queryOne('SELECT id, title, creatorId FROM courses WHERE id = ?', [courseId]);
      if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

      if (req.user.role !== 'ADMIN' && course.creatorId !== userId) {
        return res
          .status(403)
          .json({ error: 'Apenas o proprietário do curso pode adicionar colaboradores' });
      }

      const { identifier } = req.body;
      if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
        return res
          .status(400)
          .json({ error: 'Indique o nome de utilizador ou email do colaborador' });
      }

      const cleanIdent = identifier.trim().toLowerCase();
      const targetUser = queryOne(
        `
      SELECT id, name, username, email, avatarUrl, role 
      FROM users 
      WHERE LOWER(email) = ? OR LOWER(username) = ?
    `,
        [cleanIdent, cleanIdent],
      );

      if (!targetUser) {
        return res.status(404).json({ error: 'Utilizador não encontrado com este email/username' });
      }

      if (targetUser.id === course.creatorId) {
        return res.status(400).json({ error: 'O criador já é o proprietário do curso' });
      }

      const existing = queryOne(
        'SELECT id FROM course_collaborators WHERE courseId = ? AND userId = ?',
        [courseId, targetUser.id],
      );
      if (existing) {
        return res.status(400).json({ error: 'Este utilizador já é colaborador deste curso' });
      }

      const collabId = `collab-${Date.now()}`;
      const now = new Date().toISOString();
      execute(
        `INSERT INTO course_collaborators (id, courseId, userId, createdAt) VALUES (?, ?, ?, ?)`,
        [collabId, courseId, targetUser.id, now],
      );

      const enrolled = queryOne('SELECT id FROM enrollments WHERE courseId = ? AND userId = ?', [
        courseId,
        targetUser.id,
      ]);
      if (!enrolled) {
        execute(
          `INSERT INTO enrollments (id, userId, courseId, progressPercent, enrolledAt) VALUES (?, ?, ?, 100, ?)`,
          [
            `enr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            targetUser.id,
            courseId,
            now,
          ],
        );
      }

      execute(
        `
      INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
      VALUES (?, ?, 'course', 'Adicionado como Colaborador', ?, ?, 0, ?)
    `,
        [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          targetUser.id,
          `Foi adicionado como colaborador do curso "${course.title}". Agora pode ajudar a gerir os conteúdos.`,
          `/creator/courses/${courseId}/edit`,
          now,
        ],
      );

      return res.status(201).json({
        id: collabId,
        courseId,
        userId: targetUser.id,
        createdAt: now,
        name: targetUser.name,
        username: targetUser.username,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        level: targetUser.level,
      });
    } catch (err) {
      console.error('Add collaborator error:', err);
      return res.status(500).json({ error: 'Falha ao adicionar colaborador' });
    }
  },
);

router.delete(
  '/courses/:courseId/collaborators/:targetUserId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  async (req, res) => {
    try {
      const { courseId, targetUserId } = req.params;
      const userId = req.user.id;

      const course = queryOne('SELECT id, creatorId FROM courses WHERE id = ?', [courseId]);
      if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

      if (req.user.role !== 'ADMIN' && course.creatorId !== userId && targetUserId !== userId) {
        return res.status(403).json({ error: 'Sem permissão para remover este colaborador' });
      }

      execute('DELETE FROM course_collaborators WHERE courseId = ? AND userId = ?', [
        courseId,
        targetUserId,
      ]);
      return res.json({ success: true, message: 'Colaborador removido com sucesso' });
    } catch (err) {
      console.error('Delete collaborator error:', err);
      return res.status(500).json({ error: 'Falha ao remover colaborador' });
    }
  },
);

router.delete(
  '/courses/:courseId/members/:userId',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  async (req, res) => {
    try {
      const { courseId, userId } = req.params;
      const creatorId = req.user.id;
      if (req.user.role !== 'ADMIN') {
        const owned = queryOne(
          'SELECT id FROM courses WHERE id = ? AND (creatorId = ? OR id IN (SELECT courseId FROM course_collaborators WHERE userId = ?))',
          [courseId, creatorId, creatorId],
        );
        if (!owned) return res.status(403).json({ error: 'Acesso negado a este curso' });
      }
      execute('DELETE FROM enrollments WHERE courseId = ? AND userId = ?', [courseId, userId]);
      req.app
        .get('io')
        ?.in('user_' + userId)
        .disconnectSockets(true);
      return res.json({ success: true, message: 'Membro removido do curso com sucesso' });
    } catch (err) {
      return res.status(500).json({ error: 'Falha ao remover membro' });
    }
  },
);

router.post(
  '/courses/:courseId/enrollments',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  (req, res) => {
    const course = queryOne('SELECT * FROM courses WHERE id = ?', [req.params.courseId]);
    if (!course) return res.status(404).json({ error: 'Curso não encontrado.' });
    if (!canManageCourse(req.user, course))
      return res.status(403).json({ error: 'Sem permissão para gerir inscrições.' });
    const identifier = req.body.identifier;
    if (typeof identifier !== 'string' || !identifier.trim() || identifier.length > 254)
      return res.status(400).json({ error: 'Indique um email ou nome de utilizador.' });
    const student = queryOne(
      'SELECT id FROM users WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND isSuspended = 0',
      [identifier.trim().toLowerCase(), identifier.trim().toLowerCase()],
    );
    if (!student) return res.status(404).json({ error: 'Utilizador não encontrado.' });
    transaction(() => {
      if (
        !queryOne('SELECT id FROM enrollments WHERE courseId = ? AND userId = ?', [
          course.id,
          student.id,
        ])
      )
        execute(
          'INSERT INTO enrollments (id,userId,courseId,enrolledAt,progressPercent) VALUES (?,?,?,?,0)',
          [randomUUID(), student.id, course.id, new Date().toISOString()],
        );
      if (
        course.spaceId &&
        !queryOne('SELECT id FROM memberships WHERE spaceId = ? AND userId = ?', [
          course.spaceId,
          student.id,
        ])
      )
        execute(
          "INSERT INTO memberships (id,userId,spaceId,role,joinedAt) VALUES (?,?,?,'MEMBER',?)",
          [randomUUID(), student.id, course.spaceId, new Date().toISOString()],
        );
    });
    return res.json({ message: 'Acesso concedido.', userId: student.id, courseId: course.id });
  },
);

router.post(
  '/courses/:courseId/submit-review',
  authenticate,
  requireRole('CREATOR', 'ADMIN'),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const creatorId = req.user.id;
      const course = queryOne('SELECT * FROM courses WHERE id = ?', [courseId]);
      if (course && !canManageCourse(req.user, course))
        return res.status(403).json({ error: 'Sem permissão para submeter este curso.' });
      if (!course) {
        return res.status(404).json({ error: 'Curso não encontrado ou sem permissão' });
      }

      const now = new Date().toISOString();
      execute(
        `
      UPDATE courses 
      SET approvalStatus = 'PENDING', isPublished = 0, submittedForReviewAt = ?, updatedAt = ?
      WHERE id = ?
    `,
        [now, now, courseId],
      );

      return res.json({
        message: 'Curso enviado para revisão.',
        approvalStatus: 'PENDING',
      });
    } catch (err) {
      return res.status(500).json({ error: 'Falha ao publicar curso' });
    }
  },
);

export default router;
