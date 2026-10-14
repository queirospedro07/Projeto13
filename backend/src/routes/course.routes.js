import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../database/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

export const resolveCourseAccessState = ({ user, course, enrollmentRow, isCollaborator = false }) => {
  const isCreator = Boolean(user && course && (user.role === 'ADMIN' || user.id === course.creatorId || user.id === course.creator_id || isCollaborator));
  const userEnrollment = enrollmentRow || null;
  return {
    isCreator,
    isEnrolled: isCreator || Boolean(userEnrollment),
    userEnrollment,
    userProgress: userEnrollment ? (userEnrollment.progressPercent ?? 0) : isCreator ? 100 : 0,
  };
};

const router = Router();
router.get('/my-learning', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = queryAll(`SELECT DISTINCT 
              c.id as course_id, c.title, c.slug, c.description, c.category, c.difficulty, c.thumbnailUrl, c.bannerUrl, c.price, c.isFree, c.durationHours, c.language, c.creatorId, c.spaceId,
              e.id as enrollment_id, e.userId as enrollment_userId, e.enrolledAt, e.completedAt, e.progressPercent, e.lastLessonId, e.isHidden,
              u.id as creator_id, u.name as creator_name, u.username as creator_username, u.avatarUrl as creator_avatarUrl
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       LEFT JOIN users u ON c.creatorId = u.id
       WHERE e.userId = ?
       ORDER BY e.enrolledAt DESC`, [userId]);

    const formatted = rows.map(r => {
      const courseId = r.course_id;
      const isCreator = r.creatorId === userId;
      const enrollmentId = r.enrollment_id;
      const progressPercent = r.progressPercent !== null && r.progressPercent !== undefined ? r.progressPercent : 0;
      const modules = queryAll(`SELECT m.id, m.title, m.description, m.orderIndex
         FROM course_modules m
         WHERE m.courseId = ?
         ORDER BY m.orderIndex ASC`, [courseId]);
      const modulesWithLessons = modules.map(m => {
        const lessons = queryAll(`SELECT id, title, durationMin, type, orderIndex FROM lessons WHERE moduleId = ? ORDER BY orderIndex ASC`, [m.id]);
        return {
          ...m,
          lessons
        };
      });
      const lessonProgresses = queryAll(`SELECT * FROM lesson_progress WHERE enrollmentId = ?`, [enrollmentId]).map(lp => ({
        ...lp,
        isCompleted: Boolean(lp.completed)
      }));
      return {
        id: enrollmentId,
        userId: userId,
        courseId: courseId,
        enrolledAt: r.enrolledAt,
        completedAt: r.completedAt,
        progressPercent: progressPercent,
        lastLessonId: r.lastLessonId,
        isHidden: r.isHidden === 1,
        isCreator: isCreator,
        course: {
          id: r.course_id,
          title: r.title,
          slug: r.slug,
          description: r.description,
          category: r.category,
          difficulty: r.difficulty,
          thumbnailUrl: r.thumbnailUrl,
          bannerUrl: r.bannerUrl,
          price: r.price,
          isFree: r.isFree === 1,
          durationHours: r.durationHours,
          language: r.language,
          creator: {
            id: r.creator_id,
            name: r.creator_name,
            username: r.creator_username,
            avatarUrl: r.creator_avatarUrl
          },
          modules: modulesWithLessons
        },
        lessonProgresses
      };
    });
    return res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch my-learning:', err);
    return res.status(500).json({
      error: 'Falha ao carregar cursos inscritos'
    });
  }
});

router.post('/:courseId/toggle-hide', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const enrollment = queryOne('SELECT * FROM enrollments WHERE userId = ? AND (courseId = ? OR courseId IN (SELECT id FROM courses WHERE slug = ?))', [userId, courseId, courseId]);
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }
    const nextHidden = enrollment.isHidden === 1 ? 0 : 1;
    execute('UPDATE enrollments SET isHidden = ? WHERE id = ?', [nextHidden, enrollment.id]);
    return res.json({ success: true, isHidden: nextHidden === 1, courseId: enrollment.courseId });
  } catch (err) {
    console.error('Failed to toggle hide course:', err);
    return res.status(500).json({ error: 'Falha ao alterar visibilidade do curso' });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      category,
      difficulty,
      isFree,
      sort
    } = req.query;
    let sql = `
      SELECT c.*,
             u.id as creator_id, u.name as creator_name, u.username as creator_username, u.avatarUrl as creator_avatarUrl,
             (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount,
             (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount,
             (SELECT COUNT(*) FROM channels WHERE spaceId = c.spaceId) as channelsCount,
             (SELECT COUNT(*) FROM reviews WHERE courseId = c.id) as reviewsCount,
             COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE courseId = c.id), 0.0) as averageRating
      FROM courses c
      JOIN users u ON c.creatorId = u.id
      WHERE c.isPublished = 1 AND (c.approvalStatus = 'APPROVED' OR c.approvalStatus IS NULL)
    `;
    const params = [];
    if (search) {
      sql += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      if (catLower === 'programming' || catLower.includes('programa')) {
        sql += ` AND (LOWER(c.category) = 'programming' OR LOWER(c.category) LIKE '%programa%')`;
      } else if (catLower === 'design' || catLower.includes('design')) {
        sql += ` AND LOWER(c.category) LIKE '%design%'`;
      } else if (catLower === 'ai & data' || catLower === 'ai' || catLower === 'data' || catLower.includes('dados') || catLower.includes('ia')) {
        sql += ` AND (LOWER(c.category) LIKE '%ai%' OR LOWER(c.category) LIKE '%data%' OR LOWER(c.category) LIKE '%dados%' OR LOWER(c.category) LIKE '%ia%')`;
      } else if (catLower === 'cybersecurity' || catLower.includes('ciber')) {
        sql += ` AND (LOWER(c.category) LIKE '%cyber%' OR LOWER(c.category) LIKE '%ciber%')`;
      } else if (catLower === 'cloud & devops' || catLower === 'cloud' || catLower === 'devops') {
        sql += ` AND (LOWER(c.category) LIKE '%cloud%' OR LOWER(c.category) LIKE '%devops%')`;
      } else {
        sql += ` AND LOWER(c.category) = ?`;
        params.push(catLower);
      }
    }
    if (difficulty && difficulty !== 'all') {
      sql += ` AND c.difficulty = ?`;
      params.push(difficulty);
    }
    if (isFree === 'true') {
      sql += ` AND c.isFree = 1`;
    } else if (isFree === 'false') {
      sql += ` AND c.isFree = 0`;
    }
    if (sort === 'popular') sql += ` ORDER BY studentsCount DESC`;else if (sort === 'price-low') sql += ` ORDER BY c.price ASC`;else if (sort === 'price-high') sql += ` ORDER BY c.price DESC`;else sql += ` ORDER BY c.createdAt DESC`;
    const rows = queryAll(sql, params);
    const coursesWithStats = rows.map(course => {
      let userEnrollment = null;
      let isCreator = false;
      if (req.user) {
        userEnrollment = queryOne(`SELECT progressPercent, completedAt FROM enrollments WHERE userId = ? AND courseId = ?`, [req.user.id, course.id]);
        if (!userEnrollment && course.spaceId) {
          const spaceMem = queryOne(`SELECT id FROM memberships WHERE userId = ? AND spaceId = ?`, [req.user.id, course.spaceId]);
          if (spaceMem) {
            userEnrollment = { progressPercent: 0, completedAt: null };
          }
        }
        isCreator = course.creatorId === req.user.id;
      }
      const isEnrolled = !!userEnrollment || isCreator;
      const userProgress = userEnrollment ? userEnrollment.progressPercent : isCreator ? 100 : null;
      return {
        id: course.id,
        title: course.title,
        name: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        thumbnailUrl: course.thumbnailUrl,
        bannerUrl: course.bannerUrl || course.thumbnailUrl,
        thumbnailPosition: course.thumbnailPosition,
        bannerPosition: course.bannerPosition,
        price: course.price,
        isFree: course.isFree === 1 || course.price === 0,
        featured: course.featured === 1,
        durationHours: course.durationHours,
        language: course.language,
        creator: {
          id: course.creator_id,
          name: course.creator_name,
          username: course.creator_username,
          avatarUrl: course.creator_avatarUrl
        },
        owner: {
          id: course.creator_id,
          name: course.creator_name,
          username: course.creator_username,
          avatarUrl: course.creator_avatarUrl
        },
        studentsCount: course.studentsCount,
        membersCount: course.studentsCount,
        reviewsCount: course.reviewsCount || 0,
        modulesCount: course.modulesCount,
        channelsCount: course.channelsCount || 0,
        hasCommunity: Boolean(course.spaceId),
        spaceId: course.spaceId,
        averageRating: course.averageRating > 0 ? course.averageRating : 4.9,
        isEnrolled,
        isMember: isEnrolled,
        isCreator,
        userProgress
      };
    });
    return res.json(coursesWithStats);
  } catch (err) {
    console.error('Failed to load courses:', err);
    return res.status(500).json({
      error: 'Falha ao carregar catálogo de cursos'
    });
  }
});
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const {
      id
    } = req.params;
    let course = queryOne(`SELECT c.*,
              u.id as creator_id, u.name as creator_name, u.username as creator_username, u.avatarUrl as creator_avatarUrl, u.bio as creator_bio,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount
       FROM courses c
       LEFT JOIN users u ON c.creatorId = u.id
       WHERE c.id = ? OR c.slug = ? OR c.spaceId = ? OR LOWER(c.id) = LOWER(?) OR LOWER(c.slug) = LOWER(?)`, [id, id, id, id, id]);
    let resolvedSpaceRow = null;
    if (!course) {
      resolvedSpaceRow = queryOne(`SELECT s.*,
                u.id as owner_id, u.name as owner_name, u.username as owner_username, u.avatarUrl as owner_avatarUrl, u.bio as owner_bio
         FROM spaces s
         LEFT JOIN users u ON s.ownerId = u.id
         WHERE s.id = ? OR s.slug = ? OR LOWER(s.id) = LOWER(?) OR LOWER(s.slug) = LOWER(?)`, [id, id, id, id]);
      if (resolvedSpaceRow) {
        const linkedCourse = queryOne(`SELECT c.*,
                  u.id as creator_id, u.name as creator_name, u.username as creator_username, u.avatarUrl as creator_avatarUrl, u.bio as creator_bio,
                  (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount
           FROM courses c
           LEFT JOIN users u ON c.creatorId = u.id
           WHERE c.spaceId = ? OR c.id = ?`, [resolvedSpaceRow.id, resolvedSpaceRow.id]);
        if (linkedCourse) {
          course = linkedCourse;
        } else {
          course = {
            id: resolvedSpaceRow.id,
            title: resolvedSpaceRow.name,
            slug: resolvedSpaceRow.slug,
            description: resolvedSpaceRow.description,
            category: resolvedSpaceRow.category || 'Geral',
            difficulty: 'Iniciante',
            thumbnailUrl: resolvedSpaceRow.iconUrl || resolvedSpaceRow.bannerUrl,
            bannerUrl: resolvedSpaceRow.bannerUrl,
            price: 0,
            isFree: 1,
            durationHours: 10,
            language: 'Português',
            creatorId: resolvedSpaceRow.owner_id,
            creator_id: resolvedSpaceRow.owner_id,
            creator_name: resolvedSpaceRow.owner_name,
            creator_username: resolvedSpaceRow.owner_username,
            creator_avatarUrl: resolvedSpaceRow.owner_avatarUrl,
            creator_bio: resolvedSpaceRow.owner_bio,
            studentsCount: resolvedSpaceRow.memberCount || 1,
            spaceId: resolvedSpaceRow.id
          };
        }
      }
    }
    if (!course) {
      return res.status(404).json({
        error: 'Curso não encontrado'
      });
    }

    const isCollab = Boolean(req.user && queryOne('SELECT id FROM course_collaborators WHERE courseId = ? AND userId = ?', [course.id, req.user.id]));
    const canReviewPendingCourse = req.user && (
      req.user.role === 'ADMIN' ||
      req.user.id === course.creatorId ||
      req.user.id === course.creator_id ||
      isCollab
    );
    if (course.approvalStatus && course.approvalStatus !== 'APPROVED' && !canReviewPendingCourse) {
      return res.status(403).json({
        error: 'Este curso está atualmente a aguardar validação e aprovação pela administração NEXO.'
      });
    }
    const modules = queryAll(`SELECT * FROM course_modules WHERE courseId = ? ORDER BY orderIndex ASC`, [course.id]);
    let modulesWithLessons = modules.map(m => {
      const lessons = queryAll(`SELECT l.*, q.id as quiz_id, q.title as quiz_title, q.xpReward as quiz_xpReward
         FROM lessons l
         LEFT JOIN quizzes q ON q.lessonId = l.id
         WHERE l.moduleId = ?
         ORDER BY l.orderIndex ASC`, [m.id]);
      const formattedLessons = lessons.map(l => {
        let quizObj = null;
        let cleanContent = l.content || '';
        let richArticleObj = null;
        if (l.type === 'quiz') {
          if (l.content) {
            try {
              const parsed = JSON.parse(l.content);
              if (parsed && (Array.isArray(parsed.questions) || parsed.title)) {
                quizObj = parsed;
                cleanContent = parsed.description || 'Responda às questões para validar a sua compreensão da matéria.';
              }
            } catch (_) {}
          }
          if (!quizObj && l.quiz_id) {
            const questions = queryAll(`SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex ASC`, [l.quiz_id]);
            quizObj = {
              id: l.quiz_id,
              title: l.quiz_title,
              xpReward: l.quiz_xpReward,
              questions: questions.map(q => {
                let parsedOptions = [];
                try {
                  parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                } catch (_) {
                  parsedOptions = [];
                }
                const formattedOptions = Array.isArray(parsedOptions) ? parsedOptions.map((opt, idx) => ({
                  id: `opt-${q.id}-${idx}`,
                  text: typeof opt === 'string' ? opt : opt.text,
                  isCorrect: idx === q.correctOptionIndex
                })) : [];
                return {
                  id: q.id,
                  question: q.question,
                  options: formattedOptions,
                  explanation: q.explanation,
                  points: 10,
                  type: 'single'
                };
              })
            };
            if (!cleanContent || cleanContent.trim().startsWith('{')) {
              cleanContent = 'Responda às questões práticas para testar os seus conhecimentos desta aula.';
            }
          }
        } else if (l.type === 'text' || l.type === 'article') {
          if (l.content && l.content.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(l.content);
              if (parsed && (parsed.markdown || parsed.checklist || parsed.calloutText)) {
                richArticleObj = parsed;
                cleanContent = parsed.markdown || '';
              }
            } catch (_) {}
          }
        }
        return {
          id: l.id,
          title: l.title,
          type: l.type,
          durationMin: l.durationMin,
          orderIndex: l.orderIndex,
          xpReward: l.xpReward,
          videoUrl: l.videoUrl,
          content: cleanContent,
          quiz: quizObj,
          richArticle: richArticleObj
        };
      });
      return {
        ...m,
        lessons: formattedLessons
      };
    });
    let space = null;
    let targetSpaceId = course.spaceId || (resolvedSpaceRow ? resolvedSpaceRow.id : null);

    // Ensure course has its own dedicated space so channels and chat are never shared between courses
    let isSharedSpace = false;
    if (targetSpaceId) {
      const otherCourseWithSameSpace = queryOne('SELECT id FROM courses WHERE spaceId = ? AND id != ? LIMIT 1', [targetSpaceId, course.id]);
      if (otherCourseWithSameSpace) {
        isSharedSpace = true;
      }
    }

    if (targetSpaceId && !isSharedSpace) {
      const spaceRow = queryOne('SELECT * FROM spaces WHERE id = ?', [targetSpaceId]);
      if (spaceRow) {
        let channels = queryAll('SELECT * FROM channels WHERE spaceId = ? ORDER BY orderIndex ASC', [spaceRow.id]);
        if (!channels || channels.length === 0) {
          execute(
            `INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [`ch-${course.id}-gen`, spaceRow.id, 'geral', 'text', `Discussões gerais sobre ${course.title}`, 0, 0, 'Qual o seu principal objetivo neste curso?', 'Partilhe as suas ideias com respeito e entreajuda.']
          );
          execute(
            `INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [`ch-${course.id}-qa`, spaceRow.id, 'duvidas-exercicios', 'text', 'Canal para colocar dúvidas de aulas e desafios técnicos', 1, 0, 'Qual foi a mensagem de erro específica ou comportamento verificado?', 'Partilhe excertos de código formatados com blocos markdown.']
          );
          execute(
            `INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [`ch-${course.id}-showcase`, spaceRow.id, 'projetos-showcase', 'text', 'Apresente os seus projetos concluídos e receba feedback', 2, 0, 'Que desafio técnico superou na construção deste projeto?', 'Adicione links de repositório e pré-visualização.']
          );
          execute(
            `INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [`ch-${course.id}-voice`, spaceRow.id, 'Sala de Estudo 01 (Voz / Vídeo)', 'voice', 'Sala ao vivo com partilha de ecrã e microfone aberto', 3, 1, 'Que aula ou projeto está a rever em grupo?', 'Silencie o microfone quando não estiver a intervir.']
          );
          channels = queryAll('SELECT * FROM channels WHERE spaceId = ? ORDER BY orderIndex ASC', [spaceRow.id]);
        }
        const members = queryAll(`SELECT m.*, u.name, u.username, u.avatarUrl, u.role
           FROM memberships m
           JOIN users u ON m.userId = u.id
           WHERE m.spaceId = ?
           LIMIT 20`, [spaceRow.id]);
        space = {
          ...spaceRow,
          channels,
          members: members.map(m => ({
            ...m,
            user: {
              id: m.userId,
              name: m.name,
              username: m.username,
              avatarUrl: m.avatarUrl,
              role: m.role
            }
          }))
        };
      }
    }
    let userEnrollment = null;
    if (req.user) {
      let enrollmentRow = queryOne('SELECT * FROM enrollments WHERE userId = ? AND courseId = ?', [req.user.id, course.id]);
      if (!enrollmentRow && course.spaceId) {
        const spaceMem = queryOne('SELECT id, joinedAt FROM memberships WHERE userId = ? AND spaceId = ?', [req.user.id, course.spaceId]);
        if (spaceMem) {
          const autoEnrId = `enr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          execute(`INSERT OR IGNORE INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 0)`, [autoEnrId, req.user.id, course.id, spaceMem.joinedAt || new Date().toISOString()]);
          enrollmentRow = queryOne('SELECT * FROM enrollments WHERE userId = ? AND courseId = ?', [req.user.id, course.id]);
        }
      }
      if (enrollmentRow) {
        const progresses = queryAll('SELECT * FROM lesson_progress WHERE enrollmentId = ?', [enrollmentRow.id]).map(lp => ({
          ...lp,
          isCompleted: Boolean(lp.completed)
        }));
        userEnrollment = {
          ...enrollmentRow,
          lessonProgresses: progresses
        };
      }
    }

    const isCollaborator = Boolean(req.user && queryOne('SELECT id FROM course_collaborators WHERE courseId = ? AND userId = ?', [course.id, req.user.id]));
    const accessState = resolveCourseAccessState({
      user: req.user,
      course,
      enrollmentRow: userEnrollment,
      isCollaborator,
    });
    const classmates = queryAll(`SELECT DISTINCT u.id, u.name, u.username, u.avatarUrl, u.role, u.xp, u.level
       FROM (
         SELECT userId FROM enrollments WHERE courseId = ?
         UNION
         SELECT userId FROM memberships WHERE spaceId = ?
       ) t
       JOIN users u ON t.userId = u.id
       WHERE u.id != ?
       ORDER BY (CASE WHEN u.role = 'CREATOR' THEN 0 ELSE 1 END), u.name ASC
       LIMIT 50`, [course.id, targetSpaceId || '', course.creatorId || '']);
    let reviewsList = [];
    try {
      const reviewsRows = queryAll(`SELECT r.*, u.name as user_name, u.username as user_username, u.avatarUrl as user_avatarUrl
         FROM reviews r
         JOIN users u ON r.userId = u.id
         WHERE r.courseId = ?
         ORDER BY r.createdAt DESC`, [course.id]);
      reviewsList = reviewsRows.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          name: r.user_name,
          username: r.user_username,
          avatarUrl: r.user_avatarUrl
        }
      }));
    } catch (_) {}

    const avgRating = reviewsList.length > 0
      ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
      : '4.9';

    let parsedOutcomes = [];
    try {
      parsedOutcomes = course.learningOutcomes ? (typeof course.learningOutcomes === 'string' ? JSON.parse(course.learningOutcomes) : course.learningOutcomes) : [];
    } catch (_) {
      parsedOutcomes = course.learningOutcomes ? [course.learningOutcomes] : [];
    }

    let parsedRequirements = [];
    try {
      parsedRequirements = course.requirements ? (typeof course.requirements === 'string' ? JSON.parse(course.requirements) : course.requirements) : [];
    } catch (_) {
      parsedRequirements = course.requirements ? [course.requirements] : [];
    }

    let parsedDocuments = [];
    try {
      parsedDocuments = course.documents ? (typeof course.documents === 'string' ? JSON.parse(course.documents) : course.documents) : [];
    } catch (_) {
      parsedDocuments = [];
    }

    return res.json({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      thumbnailUrl: course.thumbnailUrl,
      bannerUrl: course.bannerUrl,
      price: course.price,
      isFree: course.isFree === 1,
      durationHours: course.durationHours,
      language: course.language,
      learningOutcomes: parsedOutcomes,
      requirements: parsedRequirements,
      documents: parsedDocuments,
      creator: {
        id: course.creator_id,
        name: course.creator_name,
        username: course.creator_username,
        avatarUrl: course.creator_avatarUrl,
        bio: course.creator_bio
      },
      space,
      modules: modulesWithLessons,
      studentsCount: course.studentsCount,
      reviews: reviewsList,
      reviewsCount: reviewsList.length,
      averageRating: avgRating,
      userEnrollment,
      isEnrolled: accessState.isEnrolled,
      isCreator: accessState.isCreator,
      userProgress: accessState.userProgress,
      classmates
    });
  } catch (err) {
    console.error('Course details error:', err);
    return res.status(500).json({
      error: 'Falha ao carregar detalhes do curso'
    });
  }
});
router.get('/:id/classmates', optionalAuth, async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const course = queryOne(`SELECT id, creatorId, spaceId FROM courses WHERE id = ? OR slug = ?`, [id, id]);
    if (!course) return res.status(404).json({
      error: 'Curso não encontrado'
    });
    const classmates = queryAll(`SELECT DISTINCT u.id, u.name, u.username, u.avatarUrl, u.role, u.xp, u.level,
              COALESCE(e.progressPercent, 0) as progressPercent
       FROM (
         SELECT userId FROM enrollments WHERE courseId = ?
         UNION
         SELECT userId FROM memberships WHERE spaceId = ?
       ) t
       JOIN users u ON t.userId = u.id
       LEFT JOIN enrollments e ON e.userId = u.id AND e.courseId = ?
       WHERE u.id != ?
       ORDER BY u.name ASC
       LIMIT 50`, [course.id, course.spaceId || '', course.id, course.creatorId || '']);
    return res.json(classmates);
  } catch (err) {
    console.error('Failed to load classmates:', err);
    return res.status(500).json({
      error: 'Falha ao carregar colegas de turma'
    });
  }
});
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const userId = req.user.id;
    const now = new Date().toISOString();
    const course = queryOne('SELECT id, title, spaceId, isPublished, approvalStatus, creatorId FROM courses WHERE id = ? OR slug = ? OR spaceId = ? OR LOWER(id) = LOWER(?) OR LOWER(slug) = LOWER(?)', [id, id, id, id, id]);
    if (!course) {
      return res.status(404).json({
        error: 'Curso não encontrado'
      });
    }
    if ((course.isPublished !== 1 || (course.approvalStatus && course.approvalStatus !== 'APPROVED')) && req.user.role !== 'ADMIN' && req.user.id !== course.creatorId) {
      return res.status(403).json({
        error: 'Este curso não se encontra disponível para inscrição de momento.'
      });
    }
    const existing = queryOne('SELECT * FROM enrollments WHERE userId = ? AND courseId = ?', [userId, course.id]);
    if (existing) {
      return res.json({
        message: 'Já inscrito',
        enrollment: existing
      });
    }
    const enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    transaction(() => {
      execute(`INSERT INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 0)`, [enrollmentId, userId, course.id, now]);
      if (course.spaceId) {
        const memExists = queryOne('SELECT id FROM memberships WHERE userId = ? AND spaceId = ?', [userId, course.spaceId]);
        if (!memExists) {
          execute(`INSERT INTO memberships (id, userId, spaceId, role, joinedAt) VALUES (?, ?, ?, 'MEMBER', ?)`, [`mem-${Date.now()}`, userId, course.spaceId, now]);
        }
      }
      execute(`INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt) VALUES (?, ?, 'course_update', ?, ?, ?, 0, ?)`, [`notif-${Date.now()}`, userId, `Inscrição Confirmada: ${course.title}`, `A sua inscrição foi efetuada com sucesso! Aceda à sala de aula para iniciar o Módulo 1.`, `/learn/${course.id}`, now]);
    });
    const newEnrollment = queryOne('SELECT * FROM enrollments WHERE id = ?', [enrollmentId]);
    return res.status(201).json({
      message: 'Inscrição realizada com sucesso',
      enrollment: newEnrollment
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    return res.status(500).json({
      error: 'Falha ao inscrever no curso'
    });
  }
});
router.post('/:id/lessons/:lessonId/complete', authenticate, async (req, res) => {
  try {
    const {
      id: courseIdOrSlug,
      lessonId
    } = req.params;
    const userId = req.user.id;
    const now = new Date().toISOString();
    const course = queryOne('SELECT id, title, creatorId, isFree, isPublished, approvalStatus FROM courses WHERE id = ? OR slug = ?', [courseIdOrSlug, courseIdOrSlug]);
    if (!course) {
      return res.status(404).json({
        error: 'Curso não encontrado'
      });
    }
    const lesson = queryOne(
      'SELECT l.* FROM lessons l JOIN course_modules m ON l.moduleId = m.id WHERE l.id = ? AND m.courseId = ?',
      [lessonId, course.id]
    );
    if (!lesson) {
      return res.status(404).json({
        error: 'Aula não encontrada neste curso'
      });
    }
    let enrollment = queryOne('SELECT * FROM enrollments WHERE userId = ? AND courseId = ?', [userId, course.id]);
    if (!enrollment) {
      const canAutoEnroll = req.user.role === 'ADMIN' || req.user.id === course.creatorId || (course.isFree === 1 && course.isPublished === 1 && (!course.approvalStatus || course.approvalStatus === 'APPROVED'));
      if (!canAutoEnroll) {
        return res.status(403).json({
          error: 'Deve inscrever-se no curso antes de concluir aulas.'
        });
      }
      const enrId = `enr-${Date.now()}`;
      execute(`INSERT INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 0)`, [enrId, userId, course.id, now]);
      enrollment = queryOne('SELECT * FROM enrollments WHERE id = ?', [enrId]);
    }
    const existingProgress = queryOne('SELECT * FROM lesson_progress WHERE enrollmentId = ? AND lessonId = ?', [enrollment.id, lessonId]);
    let xpGained = 0;
    if (!existingProgress || existingProgress.completed === 0) {
      transaction(() => {
        if (existingProgress) {
          execute(`UPDATE lesson_progress SET completed = 1, completedAt = ? WHERE id = ?`, [now, existingProgress.id]);
        } else {
          execute(`INSERT INTO lesson_progress (id, enrollmentId, lessonId, completed, completedAt) VALUES (?, ?, ?, 1, ?)`, [`lp-${Date.now()}`, enrollment.id, lessonId, now]);
        }
        xpGained = lesson.xpReward || 25;
        execute(`UPDATE users SET totalMinutes = totalMinutes + ?, minutesToday = minutesToday + ? WHERE id = ?`, [lesson.durationMin || 15, lesson.durationMin || 15, userId]);
      });
    }
    const totalLessons = (queryOne(`SELECT COUNT(*) as count FROM lessons l JOIN course_modules m ON l.moduleId = m.id WHERE m.courseId = ?`, [course.id]) || {}).count || 1;
    const completedLessons = (queryOne(`SELECT COUNT(*) as count FROM lesson_progress WHERE enrollmentId = ? AND completed = 1`, [enrollment.id]) || {}).count || 0;
    const newPercent = Math.min(100, Math.round(completedLessons / totalLessons * 100));
    const isCompleted = newPercent >= 100;
    execute(`UPDATE enrollments SET progressPercent = ?, completedAt = ?, lastLessonId = ? WHERE id = ?`, [newPercent, isCompleted ? now : null, lessonId, enrollment.id]);
    if (isCompleted && !enrollment.completedAt) {
      const existingCert = queryOne('SELECT id FROM certificates WHERE userId = ? AND courseId = ?', [userId, course.id]);
      if (!existingCert) {
        const user = queryOne('SELECT name FROM users WHERE id = ?', [userId]);
        const credId = `LS-CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        execute(`INSERT INTO certificates (id, userId, courseId, recipientName, courseTitle, credentialId, issuedAt, score)
           VALUES (?, ?, ?, ?, ?, ?, ?, 100)`, [`cert-${Date.now()}`, userId, course.id, user?.name || 'Estudante', course.title, credId, now]);
      }
    }
    const updatedEnrollment = queryOne('SELECT * FROM enrollments WHERE id = ?', [enrollment.id]);
    const lessonProgresses = queryAll('SELECT * FROM lesson_progress WHERE enrollmentId = ?', [enrollment.id]).map(lp => ({
      ...lp,
      isCompleted: Boolean(lp.completed)
    }));
    return res.json({
      enrollment: {
        ...updatedEnrollment,
        lessonProgresses
      },
      xpGained,
      completedCount: completedLessons,
      totalCount: totalLessons
    });
  } catch (err) {
    console.error('Complete lesson error:', err);
    return res.status(500).json({
      error: 'Falha ao concluir aula'
    });
  }
});

router.post('/:courseId/reviews', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Classificação inválida (1 a 5 estrelas)' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'O comentário da avaliação é obrigatório' });
    }

    const course = queryOne('SELECT id, creatorId FROM courses WHERE id = ? OR slug = ?', [courseId, courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const isEnrolledOrOwner = req.user.role === 'ADMIN' || req.user.id === course.creatorId || Boolean(queryOne('SELECT id FROM enrollments WHERE userId = ? AND courseId = ?', [userId, course.id]));
    if (!isEnrolledOrOwner) {
      return res.status(403).json({ error: 'Apenas estudantes inscritos podem avaliar este curso' });
    }

    const now = new Date().toISOString();
    const existingReview = queryOne('SELECT id FROM reviews WHERE courseId = ? AND userId = ?', [course.id, userId]);
    if (existingReview) {
      execute('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [Number(rating), comment.trim(), existingReview.id]);
      return res.json({
        message: 'Avaliação atualizada com sucesso',
        review: {
          id: existingReview.id,
          rating: Number(rating),
          comment: comment.trim(),
          createdAt: now
        }
      });
    }

    const revId = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    execute(`INSERT INTO reviews (id, courseId, userId, rating, comment, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`, [revId, course.id, userId, Number(rating), comment.trim(), now]);

    return res.status(201).json({
      message: 'Avaliação publicada com sucesso',
      review: {
        id: revId,
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: now
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao guardar avaliação' });
  }
});

export default router;