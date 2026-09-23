import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
router.get('/stats', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const creatorId = req.user.id;
    const courses = queryAll(`SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount
       FROM courses c
       WHERE c.creatorId = ?`, [creatorId]);
    const totalStudents = courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0);
    const totalRevenue = courses.reduce((acc, c) => acc + (c.studentsCount || 0) * (c.price || 0), 0);
    const recentEnrollments = queryAll(`SELECT e.*, u.id as user_id, u.name, u.username, u.avatarUrl, u.email, c.title as course_title
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       JOIN users u ON e.userId = u.id
       WHERE c.creatorId = ?
       ORDER BY e.enrolledAt DESC
       LIMIT 6`, [creatorId]);
    const completedEnrollments = queryOne(`SELECT COUNT(*) as c FROM enrollments e JOIN courses c ON e.courseId = c.id WHERE c.creatorId = ? AND e.progressPercent >= 100`, [creatorId])?.c || 0;
    const completionRate = totalStudents > 0 ? Math.round((completedEnrollments / totalStudents) * 100) : 0;

    const ratingRow = queryOne(`SELECT AVG(r.rating) as avgRating FROM reviews r JOIN courses c ON r.courseId = c.id WHERE c.creatorId = ?`, [creatorId]);
    const averageRating = ratingRow?.avgRating ? Number(ratingRow.avgRating).toFixed(1) : '0.0';

    const quizRow = queryOne(`SELECT AVG(qa.score) as avgScore FROM quiz_attempts qa JOIN quizzes q ON qa.quizId = q.id JOIN lessons l ON q.lessonId = l.id JOIN course_modules cm ON l.moduleId = cm.id JOIN courses c ON cm.courseId = c.id WHERE c.creatorId = ?`, [creatorId]);
    const averageQuizScore = quizRow?.avgScore ? Math.round(Number(quizRow.avgScore)) : 0;

    return res.json({
      totalRevenue: totalRevenue || 0,
      totalStudents: totalStudents || 0,
      completionRate,
      averageRating,
      averageQuizScore,
      coursesCount: courses.length,
      revenueData: [],
      recentEnrollments: recentEnrollments.map(e => ({
        id: e.id,
        enrolledAt: e.enrolledAt,
        course: {
          title: e.course_title
        },
        user: {
          id: e.user_id,
          name: e.name,
          username: e.username,
          avatarUrl: e.avatarUrl,
          email: e.email
        }
      }))
    });
  } catch (err) {
    console.error('Creator stats error:', err);
    return res.status(500).json({
      error: 'Falha ao carregar estatísticas do criador'
    });
  }
});
router.get('/courses/:courseId', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const {
      courseId
    } = req.params;
    const creatorId = req.user.id;
    const course = queryOne(`SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount,
              (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount
       FROM courses c
       WHERE c.id = ? AND (c.creatorId = ? OR ? = 'ADMIN')`, [courseId, creatorId, req.user.role]);
    if (!course) return res.status(404).json({
      error: 'Curso não encontrado ou sem permissão'
    });
    const modules = queryAll(`SELECT * FROM course_modules WHERE courseId = ? ORDER BY orderIndex ASC`, [courseId]);
    for (const mod of modules) {
      mod.lessons = queryAll(`SELECT * FROM lessons WHERE moduleId = ? ORDER BY orderIndex ASC`, [mod.id]);
      for (const les of mod.lessons) {
        if (typeof les.content === 'string' && (les.content.startsWith('{') || les.content.startsWith('['))) {
          try {
            const parsed = JSON.parse(les.content);
            if (les.type === 'quiz') les.quiz = parsed;
            else if (les.type === 'article') les.richArticle = parsed;
            else if (les.type === 'code') les.codeChallenge = parsed;
            else les.customData = parsed;
          } catch {}
        }
        if (les.type === 'quiz' && !les.quiz) {
          const q = queryOne('SELECT * FROM quizzes WHERE lessonId = ?', [les.id]);
          if (q) {
            const questions = queryAll('SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex ASC', [q.id]);
            q.questions = questions.map(qq => ({
              ...qq,
              options: typeof qq.options === 'string' ? JSON.parse(qq.options) : qq.options
            }));
            les.quiz = q;
          }
        }
      }
    }
    const spaceId = course.spaceId;
    const channels = spaceId ? queryAll(`SELECT * FROM channels WHERE spaceId = ? ORDER BY orderIndex ASC`, [spaceId]) : [];
    const customRoles = queryAll(`SELECT * FROM course_roles WHERE courseId = ? ORDER BY orderIndex ASC`, [courseId]);
    return res.json({
      ...course,
      isFree: course.isFree === 1,
      isPublished: course.isPublished === 1,
      allowStudentScreenShare: course.allowStudentScreenShare === 1,
      allowStudentCamera: course.allowStudentCamera === 1,
      modules,
      channels,
      customRoles: customRoles.map(r => ({
        ...r,
        canPostAnnouncements: r.canPostAnnouncements === 1,
        canSpeakInStage: r.canSpeakInStage === 1,
        canShareScreen: r.canShareScreen === 1,
        canModerateChat: r.canModerateChat === 1,
        canManageVoice: r.canManageVoice === 1,
      }))
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao carregar curso'
    });
  }
});
router.put('/courses/:courseId', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const {
      courseId
    } = req.params;
    const creatorId = req.user.id;
    let owned = null;
    if (req.user.role !== 'ADMIN') {
      owned = queryOne('SELECT id, spaceId FROM courses WHERE id = ? AND creatorId = ?', [courseId, creatorId]);
      if (!owned) return res.status(403).json({
        error: 'Sem permissão para editar este curso'
      });
    } else {
      owned = queryOne('SELECT id, spaceId FROM courses WHERE id = ?', [courseId]);
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
      bannerUrl,
      durationHours,
      defaultCallMode,
      allowStudentScreenShare,
      allowStudentCamera,
      modules,
      channels
    } = req.body;
    const now = new Date().toISOString();

    transaction(() => {
      execute(`UPDATE courses SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          difficulty = COALESCE(?, difficulty),
          language = COALESCE(?, language),
          price = COALESCE(?, price),
          isFree = COALESCE(?, isFree),
          isPublished = COALESCE(?, isPublished),
          thumbnailUrl = COALESCE(?, thumbnailUrl),
          bannerUrl = COALESCE(?, bannerUrl),
          durationHours = COALESCE(?, durationHours),
          defaultCallMode = COALESCE(?, defaultCallMode),
          allowStudentScreenShare = COALESCE(?, allowStudentScreenShare),
          allowStudentCamera = COALESCE(?, allowStudentCamera),
          updatedAt = ?
         WHERE id = ?`, [title || null, description || null, category || null, difficulty || null, language || null, price !== undefined ? price : null, isFree !== undefined ? isFree ? 1 : 0 : null, isPublished !== undefined ? isPublished ? 1 : 0 : null, thumbnailUrl || null, bannerUrl || null, durationHours !== undefined ? Number(durationHours) : null, defaultCallMode || null, allowStudentScreenShare !== undefined ? allowStudentScreenShare ? 1 : 0 : null, allowStudentCamera !== undefined ? allowStudentCamera ? 1 : 0 : null, now, courseId]);

      if (Array.isArray(modules)) {
        const existingModules = queryAll('SELECT id FROM course_modules WHERE courseId = ?', [courseId]);
        const incomingModIds = new Set(modules.filter(m => m.id && !String(m.id).startsWith('mod-temp-')).map(m => m.id));

        for (const exMod of existingModules) {
          if (!incomingModIds.has(exMod.id)) {
            const exLessons = queryAll('SELECT id FROM lessons WHERE moduleId = ?', [exMod.id]);
            for (const el of exLessons) {
              execute('DELETE FROM quiz_questions WHERE quizId IN (SELECT id FROM quizzes WHERE lessonId = ?)', [el.id]);
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
          const exists = modId ? queryOne('SELECT id FROM course_modules WHERE id = ?', [modId]) : null;
          if (exists) {
            execute('UPDATE course_modules SET title = ?, description = ?, orderIndex = ? WHERE id = ?', [mod.title || `Módulo ${mIdx + 1}`, mod.description || '', mIdx, modId]);
          } else {
            modId = modId || `mod-${Date.now()}-${mIdx}`;
            execute('INSERT INTO course_modules (id, courseId, title, description, orderIndex) VALUES (?, ?, ?, ?, ?)', [modId, courseId, mod.title || `Módulo ${mIdx + 1}`, mod.description || '', mIdx]);
          }

          if (Array.isArray(mod.lessons)) {
            const existingLessons = queryAll('SELECT id FROM lessons WHERE moduleId = ?', [modId]);
            const incomingLesIds = new Set(mod.lessons.filter(l => l.id && !String(l.id).startsWith('les-temp-')).map(l => l.id));

            for (const exLes of existingLessons) {
              if (!incomingLesIds.has(exLes.id)) {
                execute('DELETE FROM quiz_questions WHERE quizId IN (SELECT id FROM quizzes WHERE lessonId = ?)', [exLes.id]);
                execute('DELETE FROM quizzes WHERE lessonId = ?', [exLes.id]);
                execute('DELETE FROM lesson_progress WHERE lessonId = ?', [exLes.id]);
                execute('DELETE FROM notes WHERE lessonId = ?', [exLes.id]);
                execute('DELETE FROM lessons WHERE id = ?', [exLes.id]);
              }
            }

            mod.lessons.forEach((les, lIdx) => {
              let lesId = les.id;
              const contentToStore = les.quiz ? JSON.stringify(les.quiz) : les.richArticle ? JSON.stringify(les.richArticle) : les.codeChallenge ? JSON.stringify(les.codeChallenge) : typeof les.content === 'object' ? JSON.stringify(les.content) : les.customData ? JSON.stringify(les.customData) : les.content || '';
              const lesExists = lesId ? queryOne('SELECT id FROM lessons WHERE id = ?', [lesId]) : null;

              if (lesExists) {
                execute('UPDATE lessons SET title = ?, type = ?, content = ?, videoUrl = ?, durationMin = ?, orderIndex = ?, xpReward = ? WHERE id = ?', [les.title || `Lição ${lIdx + 1}`, les.type || 'video', contentToStore, les.videoUrl || '', Number(les.durationMin || 15), lIdx, Number(les.xpReward || 25), lesId]);
              } else {
                lesId = lesId || `les-${Date.now()}-${mIdx}-${lIdx}`;
                execute('INSERT INTO lessons (id, moduleId, title, type, content, videoUrl, durationMin, orderIndex, xpReward) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [lesId, modId, les.title || `Lição ${lIdx + 1}`, les.type || 'video', contentToStore, les.videoUrl || '', Number(les.durationMin || 15), lIdx, Number(les.xpReward || 25)]);
              }

              if (les.quiz) {
                const quizId = `quiz-${lesId}`;
                const qExists = queryOne('SELECT id FROM quizzes WHERE lessonId = ?', [lesId]);
                if (qExists) {
                  execute('UPDATE quizzes SET title = ?, description = ?, passingScore = ?, xpReward = ? WHERE id = ?', [les.quiz.title || `Questionário: ${les.title}`, les.quiz.description || '', Number(les.quiz.passingScore || 70), Number(les.quiz.xpReward || 50), qExists.id]);
                  execute('DELETE FROM quiz_questions WHERE quizId = ?', [qExists.id]);
                } else {
                  execute('INSERT INTO quizzes (id, lessonId, title, description, passingScore, xpReward) VALUES (?, ?, ?, ?, ?, ?)', [quizId, lesId, les.quiz.title || `Questionário: ${les.title}`, les.quiz.description || '', Number(les.quiz.passingScore || 70), Number(les.quiz.xpReward || 50)]);
                }
                const activeQuizId = qExists ? qExists.id : quizId;
                if (Array.isArray(les.quiz.questions)) {
                  les.quiz.questions.forEach((q, qIdx) => {
                    const qId = `qq-${Date.now()}-${qIdx}`;
                    const optionsArray = Array.isArray(q.options) ? q.options.map(opt => typeof opt === 'string' ? opt : opt.text) : ['Opção A', 'Opção B'];
                    let correctOptionIndex = 0;
                    if (Array.isArray(q.options)) {
                      const idx = q.options.findIndex(opt => opt && opt.isCorrect);
                      if (idx >= 0) correctOptionIndex = idx;
                    } else if (q.correctOptionIndex !== undefined) {
                      correctOptionIndex = Number(q.correctOptionIndex);
                    }
                    execute('INSERT INTO quiz_questions (id, quizId, question, options, correctOptionIndex, explanation, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?)', [qId, activeQuizId, q.question || `Questão ${qIdx + 1}`, JSON.stringify(optionsArray), correctOptionIndex, q.explanation || '', qIdx]);
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
          const chanAccess = ch.accessMode || (ch.type === 'announcement' ? 'announcement' : 'discussion');
          const chanVoiceMode = ch.voiceMode || defaultCallMode || 'open';
          const chExists = ch.id ? queryOne('SELECT id FROM channels WHERE id = ? AND spaceId = ?', [ch.id, owned.spaceId]) : null;
          if (chExists) {
            execute('UPDATE channels SET name = ?, type = ?, topic = ?, orderIndex = ?, isVoice = ?, accessMode = ?, voiceMode = ? WHERE id = ?', [ch.name, ch.type || 'text', ch.topic || '', chIdx, isVoiceChan, chanAccess, chanVoiceMode, ch.id]);
          } else {
            const newChId = ch.id || `ch-${Date.now()}-${chIdx}`;
            execute('INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines, accessMode, voiceMode) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)', [newChId, owned.spaceId, ch.name || `canal-${chIdx + 1}`, ch.type || 'text', ch.topic || '', chIdx, isVoiceChan, ch.guidingQuestion || '', ch.guidelines || '', chanAccess, chanVoiceMode]);
          }
        });
      }
    });

    return res.json({
      success: true,
      id: courseId
    });
  } catch (err) {
    console.error('Update course error:', err);
    return res.status(500).json({
      error: 'Falha ao atualizar curso'
    });
  }
});
router.get('/courses', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const creatorId = req.user.id;
    const courses = queryAll(`SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount,
              (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount,
              (SELECT COUNT(*) FROM reviews WHERE courseId = c.id) as reviewsCount
       FROM courses c
       WHERE c.creatorId = ?
       ORDER BY c.createdAt DESC`, [creatorId]);
    return res.json(courses.map(c => ({
      ...c,
      isFree: c.isFree === 1,
      _count: {
        enrollments: c.studentsCount || 0,
        modules: c.modulesCount || 0,
        reviews: c.reviewsCount || 0
      }
    })));
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao carregar cursos do criador'
    });
  }
});
router.post('/courses', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
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
      thumbnailUrl,
      bannerUrl,
      durationHours,
      spaceId: customSpaceId,
      channels,
      modules,
      defaultCallMode,
      allowStudentScreenShare,
      allowStudentCamera,
      customRoles
    } = req.body;
    if (!title || !category) {
      return res.status(400).json({
        error: 'Título e categoria são obrigatórios'
      });
    }
    const courseId = `course-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    let resolvedSpaceId = customSpaceId || null;
    transaction(() => {
      if (!resolvedSpaceId) {
        resolvedSpaceId = `space-${Date.now()}`;
        const spaceSlug = `${slug}-comunidade`;
        execute(`INSERT INTO spaces (id, name, slug, description, iconUrl, bannerUrl, isPrivate, category, ownerId, memberCount, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?)`, [resolvedSpaceId, `Comunidade ${title}`, spaceSlug, description || `Espaço comunitário e salas de estudo do curso ${title}`, thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&auto=format&fit=crop&q=80', bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80', category, creatorId, now]);
        execute(`INSERT INTO memberships (id, userId, spaceId, role, joinedAt) VALUES (?, ?, ?, 'OWNER', ?)`, [`mem-${Date.now()}`, creatorId, resolvedSpaceId, now]);
        const channelsToInsert = Array.isArray(channels) && channels.length > 0 ? channels : [{
          name: 'geral',
          type: 'text',
          topic: '',
          guidingQuestion: '',
          guidelines: ''
        }];
        channelsToInsert.forEach((ch, chIdx) => {
          const chId = `ch-${Date.now()}-${chIdx}`;
          const isVoiceChan = ch.type === 'voice' || ch.isVoice ? 1 : 0;
          const chanAccess = ch.accessMode || (ch.type === 'announcement' ? 'announcement' : 'discussion');
          const chanVoiceMode = ch.voiceMode || defaultCallMode || 'open';
          execute(`INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines, accessMode, voiceMode)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`, [chId, resolvedSpaceId, ch.name || `canal-${chIdx + 1}`, ch.type || 'text', ch.topic || '', chIdx, isVoiceChan, ch.guidingQuestion || '', ch.guidelines || '', chanAccess, chanVoiceMode]);
        });
      }
      const defCallMode = defaultCallMode || 'open';
      const allowScreen = allowStudentScreenShare !== false ? 1 : 0;
      const allowCam = allowStudentCamera !== false ? 1 : 0;
      execute(`INSERT INTO courses (id, title, slug, description, category, difficulty, thumbnailUrl, bannerUrl, price, isFree, isPublished, featured, durationHours, language, creatorId, spaceId, defaultCallMode, allowStudentScreenShare, allowStudentCamera, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [courseId, title, slug, description || '', category, difficulty || 'Intermédio', thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80', bannerUrl || null, isFree ? 0 : Number(price || 0), isFree ? 1 : 0, durationHours ? Number(durationHours) : 10.0, language || 'Português', creatorId, resolvedSpaceId, defCallMode, allowScreen, allowCam, now, now]);
      const rolesToInsert = Array.isArray(customRoles) && customRoles.length > 0 ? customRoles : [{
        name: 'Instrutor',
        color: 'indigo',
        canPostAnnouncements: 1,
        canSpeakInStage: 1,
        canShareScreen: 1,
        canModerateChat: 1,
        canManageVoice: 1
      }, {
        name: 'Tutor / Moderador',
        color: 'emerald',
        canPostAnnouncements: 1,
        canSpeakInStage: 1,
        canShareScreen: 1,
        canModerateChat: 1,
        canManageVoice: 1
      }, {
        name: 'Monitor de Dúvidas',
        color: 'amber',
        canPostAnnouncements: 0,
        canSpeakInStage: 1,
        canShareScreen: 0,
        canModerateChat: 0,
        canManageVoice: 0
      }, {
        name: 'Estudante',
        color: 'zinc',
        canPostAnnouncements: 0,
        canSpeakInStage: 0,
        canShareScreen: allowScreen,
        canModerateChat: 0,
        canManageVoice: 0
      }];
      rolesToInsert.forEach((role, rIdx) => {
        const roleId = role.id || `role-${Date.now()}-${rIdx}`;
        execute(`INSERT INTO course_roles (id, courseId, name, color, canPostAnnouncements, canSpeakInStage, canShareScreen, canModerateChat, canManageVoice, orderIndex, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [roleId, courseId, role.name, role.color || 'indigo', role.canPostAnnouncements ? 1 : 0, role.canSpeakInStage ? 1 : 0, role.canShareScreen !== undefined ? role.canShareScreen ? 1 : 0 : allowScreen, role.canModerateChat ? 1 : 0, role.canManageVoice ? 1 : 0, rIdx, now]);
        if (rIdx === 0) {
          execute(`INSERT OR IGNORE INTO course_member_roles (id, courseId, userId, roleId, assignedAt) VALUES (?, ?, ?, ?, ?)`, [`cmr-${Date.now()}`, courseId, creatorId, roleId, now]);
        }
      });
      if (Array.isArray(modules)) {
        modules.forEach((mod, mIdx) => {
          const modId = `mod-${Date.now()}-${mIdx}`;
          execute(`INSERT INTO course_modules (id, courseId, title, description, orderIndex) VALUES (?, ?, ?, ?, ?)`, [modId, courseId, mod.title || `Módulo ${mIdx + 1}`, mod.description || '', mIdx]);
          if (Array.isArray(mod.lessons)) {
            mod.lessons.forEach((les, lIdx) => {
              const lesId = `les-${Date.now()}-${mIdx}-${lIdx}`;
              const contentToStore = les.quiz ? JSON.stringify(les.quiz) : les.richArticle ? JSON.stringify(les.richArticle) : les.codeChallenge ? JSON.stringify(les.codeChallenge) : typeof les.content === 'object' ? JSON.stringify(les.content) : les.customData ? JSON.stringify(les.customData) : les.content || '';
              execute(`INSERT INTO lessons (id, moduleId, title, type, content, videoUrl, durationMin, orderIndex, xpReward)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [lesId, modId, les.title || `Lição ${lIdx + 1}`, les.type || 'video', contentToStore, les.videoUrl || '', Number(les.durationMin || 15), lIdx, Number(les.xpReward || 25)]);
              if (les.quiz) {
                const quizId = `quiz-${Date.now()}-${mIdx}-${lIdx}`;
                execute(`INSERT INTO quizzes (id, lessonId, title, description, passingScore, xpReward)
                   VALUES (?, ?, ?, ?, ?, ?)`, [quizId, lesId, les.quiz.title || `Questionário: ${les.title}`, les.quiz.description || '', Number(les.quiz.passingScore || 70), Number(les.quiz.xpReward || 50)]);
                if (Array.isArray(les.quiz.questions)) {
                  les.quiz.questions.forEach((q, qIdx) => {
                    const qId = `qq-${Date.now()}-${qIdx}`;
                    const optionsArray = Array.isArray(q.options) ? q.options.map(opt => typeof opt === 'string' ? opt : opt.text) : ['Opção A', 'Opção B', 'Opção C', 'Opção D'];
                    let correctOptionIndex = 0;
                    if (Array.isArray(q.options)) {
                      const idx = q.options.findIndex(opt => opt && opt.isCorrect);
                      if (idx >= 0) correctOptionIndex = idx;
                    } else if (q.correctOptionIndex !== undefined) {
                      correctOptionIndex = Number(q.correctOptionIndex);
                    }
                    execute(`INSERT INTO quiz_questions (id, quizId, question, options, correctOptionIndex, explanation, orderIndex)
                       VALUES (?, ?, ?, ?, ?, ?, ?)`, [qId, quizId, q.question || `Questão ${qIdx + 1}`, JSON.stringify(optionsArray), correctOptionIndex, q.explanation || '', qIdx]);
                  });
                }
              }
            });
          }
        });
      }
      execute(`INSERT OR IGNORE INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 100)`, [`enr-${Date.now()}`, creatorId, courseId, now]);
    });
    const createdCourse = queryOne('SELECT * FROM courses WHERE id = ?', [courseId]);
    return res.status(201).json(createdCourse);
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({
      error: 'Falha ao criar curso'
    });
  }
});
router.get('/members', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const creatorId = req.user.id;
    const members = queryAll(`SELECT e.id, e.userId, e.courseId, e.enrolledAt, e.progressPercent,
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
       ORDER BY e.enrolledAt DESC`, [creatorId]);
    const formatted = members.map(m => ({
      id: m.id,
      role: m.role_name || (m.userId === creatorId ? 'INSTRUTOR' : 'STUDENT'),
      roleId: m.role_id,
      roleColor: m.role_color || 'zinc',
      progressPercent: m.progressPercent,
      enrolledAt: m.enrolledAt,
      course: {
        id: m.course_id,
        title: m.course_title
      },
      space: {
        name: m.space_name || m.course_title
      },
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
    return res.status(500).json({
      error: 'Falha ao carregar lista de membros'
    });
  }
});
router.get('/courses/:courseId/roles', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const {
      courseId
    } = req.params;
    const creatorId = req.user.id;
    if (req.user.role !== 'ADMIN') {
      const owned = queryOne('SELECT id FROM courses WHERE id = ? AND creatorId = ?', [courseId, creatorId]);
      if (!owned) return res.status(403).json({
        error: 'Acesso negado a este curso'
      });
    }
    const roles = queryAll(`SELECT * FROM course_roles WHERE courseId = ? ORDER BY orderIndex ASC`, [courseId]);
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao carregar cargos do curso'
    });
  }
});
router.post('/courses/:courseId/roles', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const {
      courseId
    } = req.params;
    const creatorId = req.user.id;
    if (req.user.role !== 'ADMIN') {
      const owned = queryOne('SELECT id FROM courses WHERE id = ? AND creatorId = ?', [courseId, creatorId]);
      if (!owned) return res.status(403).json({
        error: 'Acesso negado a este curso'
      });
    }
    const {
      name,
      color,
      canPostAnnouncements,
      canSpeakInStage,
      canShareScreen,
      canModerateChat,
      canManageVoice
    } = req.body;
    if (!name) {
      return res.status(400).json({
        error: 'Nome do cargo é obrigatório'
      });
    }
    const roleId = `role-${Date.now()}`;
    const now = new Date().toISOString();
    execute(`INSERT INTO course_roles (id, courseId, name, color, canPostAnnouncements, canSpeakInStage, canShareScreen, canModerateChat, canManageVoice, orderIndex, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 99, ?)`, [roleId, courseId, name, color || 'indigo', canPostAnnouncements ? 1 : 0, canSpeakInStage ? 1 : 0, canShareScreen ? 1 : 0, canModerateChat ? 1 : 0, canManageVoice ? 1 : 0, now]);
    const created = queryOne('SELECT * FROM course_roles WHERE id = ?', [roleId]);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao criar cargo'
    });
  }
});
router.put('/courses/:courseId/members/:userId/role', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const {
      courseId,
      userId
    } = req.params;
    const creatorId = req.user.id;
    if (req.user.role !== 'ADMIN') {
      const owned = queryOne('SELECT id FROM courses WHERE id = ? AND creatorId = ?', [courseId, creatorId]);
      if (!owned) return res.status(403).json({
        error: 'Acesso negado a este curso'
      });
    }
    const {
      roleId
    } = req.body;
    const now = new Date().toISOString();
    execute(`DELETE FROM course_member_roles WHERE courseId = ? AND userId = ?`, [courseId, userId]);
    if (roleId) {
      execute(`INSERT INTO course_member_roles (id, courseId, userId, roleId, assignedAt) VALUES (?, ?, ?, ?, ?)`, [`cmr-${Date.now()}`, courseId, userId, roleId, now]);
    }
    return res.json({
      success: true,
      message: 'Cargo atualizado com sucesso'
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao atribuir cargo'
    });
  }
});

router.delete('/courses/:courseId/members/:userId', authenticate, requireRole('CREATOR', 'ADMIN'), async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    const creatorId = req.user.id;
    if (req.user.role !== 'ADMIN') {
      const owned = queryOne('SELECT id FROM courses WHERE id = ? AND creatorId = ?', [courseId, creatorId]);
      if (!owned) return res.status(403).json({ error: 'Acesso negado a este curso' });
    }
    execute('DELETE FROM enrollments WHERE courseId = ? AND userId = ?', [courseId, userId]);
    execute('DELETE FROM course_member_roles WHERE courseId = ? AND userId = ?', [courseId, userId]);
    return res.json({ success: true, message: 'Membro removido do curso com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao remover membro do curso' });
  }
});

export default router;