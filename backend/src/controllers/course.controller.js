const { randomUUID } = require('node:crypto');
const Course = require('../models/Course.js');
const { asyncMap } = require('../utils/asyncCollections.js');
const { completeLesson } = require('../services/progress.js');
const { canStudyCourse } = require('../services/courseAccess.js');
const { loadAssessment, publicAssessment } = require('../services/assessments.js');
const { transaction, lockTransaction } = require('../database/connection.js');
const resolveCourseAccessState = ({ user, course, enrollmentRow, isCollaborator = false }) => {
  const isCreator = Boolean(
    user &&
    course &&
    (user.role === 'ADMIN' ||
      user.id === course.creatorId ||
      user.id === course.creator_id ||
      isCollaborator),
  );
  const userEnrollment = enrollmentRow || null;
  return {
    isCreator,
    isEnrolled: Boolean(userEnrollment),
    canAccess: isCreator || Boolean(userEnrollment),
    userEnrollment,
    userProgress: userEnrollment ? (userEnrollment.progressPercent ?? 0) : 0,
  };
};
const getCourseMyLearning = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await Course.listEnrollmentsByUserId([userId]);
    const formatted = await asyncMap(rows, async (r) => {
      const courseId = r.course_id;
      const isCreator = r.creatorId === userId;
      const enrollmentId = r.enrollment_id;
      const progressPercent =
        r.progressPercent !== null && r.progressPercent !== undefined ? r.progressPercent : 0;
      const modules = await Course.listModulesByCourseId([courseId]);
      const modulesWithLessons = await asyncMap(modules, async (m) => {
        const lessons = await Course.listLessonsByModuleId([m.id]);
        return {
          ...m,
          lessons,
        };
      });
      const lessonProgresses = (await Course.listLessonProgressByEnrollmentId([enrollmentId])).map(
        (lp) => ({
          ...lp,
          isCompleted: Boolean(lp.completed),
        }),
      );
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
            avatarUrl: r.creator_avatarUrl,
          },
          modules: modulesWithLessons,
        },
        lessonProgresses,
      };
    });
    return res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch my-learning:', err);
    return res.status(500).json({
      error: 'Falha ao carregar cursos inscritos',
    });
  }
};
const postCourseByCourseIdToggleHide = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const enrollment = await Course.findEnrollmentByUserIdAndCourseIdAndSlug([
      userId,
      courseId,
      courseId,
    ]);
    if (!enrollment) {
      return res.status(404).json({
        error: 'Inscrição não encontrada',
      });
    }
    const nextHidden = enrollment.isHidden === 1 ? 0 : 1;
    await Course.updateEnrollmentsByIsHiddenAndId([nextHidden, enrollment.id]);
    return res.json({
      success: true,
      isHidden: nextHidden === 1,
      courseId: enrollment.courseId,
    });
  } catch (err) {
    console.error('Failed to toggle hide course:', err);
    return res.status(500).json({
      error: 'Falha ao alterar visibilidade do curso',
    });
  }
};
const getCourse = async (req, res) => {
  try {
    const rows = await Course.search(req.query);
    const coursesWithStats = await asyncMap(rows, async (course) => {
      let userEnrollment = null;
      let isCreator = false;
      if (req.user) {
        userEnrollment = await Course.findEnrollmentsByUserIdAndCourseId([req.user.id, course.id]);
        isCreator = course.creatorId === req.user.id;
      }
      const isEnrolled = Boolean(userEnrollment);
      const userProgress = userEnrollment ? userEnrollment.progressPercent : 0;
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
          avatarUrl: course.creator_avatarUrl,
        },
        owner: {
          id: course.creator_id,
          name: course.creator_name,
          username: course.creator_username,
          avatarUrl: course.creator_avatarUrl,
        },
        studentsCount: course.studentsCount,
        membersCount: course.studentsCount,
        reviewsCount: course.reviewsCount || 0,
        modulesCount: course.modulesCount,
        channelsCount: course.channelsCount || 0,
        hasCommunity: Boolean(course.spaceId),
        spaceId: course.spaceId,
        averageRating: course.averageRating > 0 ? course.averageRating : null,
        isEnrolled,
        isMember: isEnrolled,
        isCreator,
        userProgress,
      };
    });
    return res.json(coursesWithStats);
  } catch (err) {
    console.error('Failed to load courses:', err);
    return res.status(500).json({
      error: 'Falha ao carregar catálogo de cursos',
    });
  }
};
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    let course = await Course.countCourseByIdAndSlugAndSpaceId([id, id, id, id, id]);
    let resolvedSpaceRow = null;
    if (!course) {
      resolvedSpaceRow = await Course.findSpacesByIdAndSlug([id, id, id, id]);
      if (resolvedSpaceRow) {
        const linkedCourse = await Course.countLinkedCourseBySpaceIdAndId([
          resolvedSpaceRow.id,
          resolvedSpaceRow.id,
        ]);
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
            spaceId: resolvedSpaceRow.id,
          };
        }
      }
    }
    if (!course) {
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    }
    const isCollab = Boolean(
      req.user &&
      (await Course.findCourseCollaboratorsByCourseIdAndUserId([course.id, req.user.id])),
    );
    const canReviewPendingCourse =
      req.user &&
      (req.user.role === 'ADMIN' ||
        req.user.id === course.creatorId ||
        req.user.id === course.creator_id ||
        isCollab);
    if (
      course.approvalStatus &&
      course.approvalStatus !== 'APPROVED' &&
      !canReviewPendingCourse &&
      !(await canStudyCourse(req.user, course))
    ) {
      return res.status(403).json({
        error:
          'Este curso está atualmente a aguardar validação e aprovação pela administração NEXO.',
      });
    }
    const modules = await Course.listModulesByCourseIdForGetCourseById([course.id]);
    let modulesWithLessons = await asyncMap(modules, async (m) => {
      const lessons = await Course.listLessonsByModuleIdForLessons([m.id]);
      const formattedLessons = await asyncMap(lessons, async (l) => {
        let quizObj = null;
        let cleanContent = l.content || '';
        let richArticleObj = null;
        if (l.type === 'quiz') {
          if (l.content) {
            try {
              const parsed = JSON.parse(l.content);
              if (parsed && (Array.isArray(parsed.questions) || parsed.title)) {
                quizObj = parsed;
                cleanContent =
                  parsed.description ||
                  'Responda às questões para validar a sua compreensão da matéria.';
              }
            } catch (_) {}
          }
          if (!quizObj && l.quiz_id) {
            const questions = await Course.listQuestionsByQuizId([l.quiz_id]);
            quizObj = {
              id: l.quiz_id,
              title: l.quiz_title,
              xpReward: l.quiz_xpReward,
              questions: questions.map((q) => {
                let parsedOptions;
                try {
                  parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                } catch (_) {
                  parsedOptions = [];
                }
                const formattedOptions = Array.isArray(parsedOptions)
                  ? parsedOptions.map((opt, idx) => ({
                      id: `opt-${q.id}-${idx}`,
                      text: typeof opt === 'string' ? opt : opt.text,
                      isCorrect: idx === q.correctOptionIndex,
                    }))
                  : [];
                return {
                  id: q.id,
                  question: q.question,
                  options: formattedOptions,
                  explanation: q.explanation,
                  points: 10,
                  type: 'single',
                };
              }),
            };
            if (!cleanContent || cleanContent.trim().startsWith('{')) {
              cleanContent =
                'Responda às questões práticas para testar os seus conhecimentos desta aula.';
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
          richArticle: richArticleObj,
        };
      });
      return {
        ...m,
        lessons: formattedLessons,
      };
    });
    let space = null;
    let targetSpaceId = course.spaceId || (resolvedSpaceRow ? resolvedSpaceRow.id : null);

    // Ensure course has its own dedicated space so channels and chat are never shared between courses
    let isSharedSpace = false;
    if (targetSpaceId) {
      const otherCourseWithSameSpace = await Course.findOtherCourseWithSameSpaceBySpaceId([
        targetSpaceId,
        course.id,
      ]);
      if (otherCourseWithSameSpace) {
        isSharedSpace = true;
      }
    }
    if (targetSpaceId && !isSharedSpace) {
      const spaceRow = await Course.findSpaceRowById([targetSpaceId]);
      if (spaceRow) {
        let channels = await Course.listChannelsBySpaceId([spaceRow.id]);
        const members = await Course.listMembersBySpaceId([spaceRow.id]);
        space = {
          ...spaceRow,
          channels,
          members: members.map((m) => ({
            ...m,
            user: {
              id: m.userId,
              name: m.name,
              username: m.username,
              avatarUrl: m.avatarUrl,
              role: m.role,
            },
          })),
        };
      }
    }
    let userEnrollment = null;
    if (req.user) {
      let enrollmentRow = await Course.findEnrollmentRowByUserIdAndCourseId([
        req.user.id,
        course.id,
      ]);
      if (enrollmentRow) {
        const progresses = (
          await Course.listLessonProgressByEnrollmentIdForGetCourseById([enrollmentRow.id])
        ).map((lp) => ({
          ...lp,
          isCompleted: Boolean(lp.completed),
        }));
        userEnrollment = {
          ...enrollmentRow,
          lessonProgresses: progresses,
        };
      }
    }
    const isCollaborator = Boolean(
      req.user &&
      (await Course.findCourseCollaboratorsByCourseIdAndUserId([course.id, req.user.id])),
    );
    const accessState = resolveCourseAccessState({
      user: req.user,
      course,
      enrollmentRow: userEnrollment,
      isCollaborator,
    });
    const classmates = await Course.listClassmatesByCourseIdAndSpaceId([
      course.id,
      targetSpaceId || '',
      course.creatorId || '',
    ]);
    let reviewsList = [];
    try {
      const reviewsRows = await Course.listReviewsRowsByCourseId([course.id]);
      reviewsList = reviewsRows.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          name: r.user_name,
          username: r.user_username,
          avatarUrl: r.user_avatarUrl,
        },
      }));
    } catch (_) {}
    const avgRating =
      reviewsList.length > 0
        ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
        : null;
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
      id: course.id,
      title: course.title,
      slug: course.slug,
      spaceId: space?.id || null,
      hasCommunity: Boolean(space),
      updatedAt: canReviewPendingCourse ? course.updatedAt : undefined,
      approvalStatus: canReviewPendingCourse ? course.approvalStatus : undefined,
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
      documents: accessState.canAccess ? parsedDocuments : [],
      creator: {
        id: course.creator_id,
        name: course.creator_name,
        username: course.creator_username,
        avatarUrl: course.creator_avatarUrl,
        bio: course.creator_bio,
      },
      space: accessState.canAccess
        ? space
        : space
          ? {
              ...space,
              channels: [],
              members: [],
            }
          : null,
      modules: await asyncMap(modulesWithLessons, async (module) => ({
        ...module,
        lessons: await asyncMap(module.lessons, async (lesson) => {
          if (!(await canStudyCourse(req.user, course)))
            return {
              id: lesson.id,
              title: lesson.title,
              type: lesson.type,
              durationMin: lesson.durationMin,
              orderIndex: lesson.orderIndex,
            };
          if (lesson.type === 'quiz') {
            const quiz = publicAssessment(await loadAssessment(lesson.id));
            return {
              ...lesson,
              content: quiz?.description || '',
              quiz,
            };
          }
          return lesson;
        }),
      })),
      studentsCount: course.studentsCount,
      reviews: reviewsList,
      reviewsCount: reviewsList.length,
      averageRating: avgRating,
      userEnrollment,
      certificate: req.user
        ? (await Course.findCertificateByUserAndCourse([req.user.id, course.id])) || null
        : null,
      isEnrolled: accessState.isEnrolled,
      isCreator: accessState.isCreator,
      userProgress: accessState.userProgress,
      classmates: accessState.canAccess ? classmates : [],
    });
  } catch (err) {
    console.error('Course details error:', err);
    return res.status(500).json({
      error: 'Falha ao carregar detalhes do curso',
    });
  }
};
const getCourseByIdClassmates = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findCourseByIdAndSlug([id, id]);
    if (!course)
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    if (!(await canStudyCourse(req.user, course)))
      return res.status(403).json({
        error: 'Sem acesso à turma.',
      });
    const classmates = await Course.listClassmatesByCourseIdAndSpaceIdForGetCourseByIdClassmates([
      course.id,
      course.spaceId || '',
      course.id,
      course.creatorId || '',
    ]);
    return res.json(classmates);
  } catch (err) {
    console.error('Failed to load classmates:', err);
    return res.status(500).json({
      error: 'Falha ao carregar colegas de turma',
    });
  }
};
const postCourseByIdEnroll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const now = new Date().toISOString();
    const course = await Course.findCourseByIdAndSlugAndSpaceId([id, id, id, id, id]);
    if (!course) {
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    }
    if (
      (course.isPublished !== 1 ||
        (course.approvalStatus && course.approvalStatus !== 'APPROVED')) &&
      req.user.role !== 'ADMIN' &&
      req.user.id !== course.creatorId
    ) {
      return res.status(403).json({
        error: 'Este curso não se encontra disponível para inscrição de momento.',
      });
    }
    if (
      course.isFree !== 1 &&
      Number(course.price) > 0 &&
      !(await canStudyCourse(req.user, course))
    )
      return res.status(409).json({
        error: 'Confirme o pagamento para obter acesso a este curso.',
        code: 'PAYMENT_REQUIRED',
      });
    const existing = await Course.findEnrollmentRowByUserIdAndCourseId([userId, course.id]);
    if (existing) {
      return res.json({
        message: 'Já inscrito',
        enrollment: existing,
      });
    }
    const enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const storedEnrollmentId = await transaction(async () => {
      await lockTransaction(`enrollment:${userId}:${course.id}`);
      const concurrent = await Course.findEnrollmentRowByUserIdAndCourseId([userId, course.id]);
      if (concurrent) return concurrent.id;
      await Course.insertEnrollments([enrollmentId, userId, course.id, now]);
      if (course.spaceId) {
        const memExists = await Course.findMemExistsByUserIdAndSpaceId([userId, course.spaceId]);
        if (!memExists) {
          await Course.insertMemberships([`mem-${randomUUID()}`, userId, course.spaceId, now]);
        }
      }
      await Course.insertNotifications([
        `notif-${randomUUID()}`,
        userId,
        `Inscrição Confirmada: ${course.title}`,
        `A sua inscrição foi efetuada com sucesso! Aceda à sala de aula para iniciar o Módulo 1.`,
        `/learn/${course.id}`,
        now,
      ]);
      return enrollmentId;
    });
    const newEnrollment = await Course.findNewEnrollmentById([storedEnrollmentId]);
    return res.status(storedEnrollmentId === enrollmentId ? 201 : 200).json({
      message: 'Inscrição realizada com sucesso',
      enrollment: newEnrollment,
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    return res.status(500).json({
      error: 'Falha ao inscrever no curso',
    });
  }
};
const postCourseByIdLessonsByLessonIdComplete = async (req, res) => {
  try {
    return res.json(await completeLesson(req.user, req.params.id, req.params.lessonId));
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.status ? error.message : 'Não foi possível concluir a aula.',
    });
  }
};
const postCourseByCourseIdReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Classificação inválida (1 a 5 estrelas)',
      });
    }
    if (typeof comment !== 'string' || !comment.trim() || comment.length > 2000) {
      return res.status(400).json({
        error: 'O comentário da avaliação é obrigatório',
      });
    }
    const course = await Course.findCourseByIdAndSlugForPostCourseByCourseIdReviews([
      courseId,
      courseId,
    ]);
    if (!course) {
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    }
    const isEnrolledOrOwner =
      req.user.role === 'ADMIN' ||
      req.user.id === course.creatorId ||
      Boolean(
        await Course.findEnrollmentsByUserIdAndCourseIdForPostCourseByCourseIdReviews([
          userId,
          course.id,
        ]),
      );
    if (!isEnrolledOrOwner) {
      return res.status(403).json({
        error: 'Apenas estudantes inscritos podem avaliar este curso',
      });
    }
    const now = new Date().toISOString();
    const existingReview = await Course.findExistingReviewByCourseIdAndUserId([course.id, userId]);
    if (existingReview) {
      await Course.updateReviewsByRatingAndCommentAndId([
        Number(rating),
        comment.trim(),
        existingReview.id,
      ]);
      return res.json({
        message: 'Avaliação atualizada com sucesso',
        review: {
          id: existingReview.id,
          rating: Number(rating),
          comment: comment.trim(),
          createdAt: now,
        },
      });
    }
    const revId = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await Course.insertReviews([revId, course.id, userId, Number(rating), comment.trim(), now]);
    return res.status(201).json({
      message: 'Avaliação publicada com sucesso',
      review: {
        id: revId,
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: now,
      },
    });
  } catch {
    return res.status(500).json({
      error: 'Falha ao guardar avaliação',
    });
  }
};
exports.resolveCourseAccessState = resolveCourseAccessState;
exports.getCourseMyLearning = getCourseMyLearning;
exports.postCourseByCourseIdToggleHide = postCourseByCourseIdToggleHide;
exports.getCourse = getCourse;
exports.getCourseById = getCourseById;
exports.getCourseByIdClassmates = getCourseByIdClassmates;
exports.postCourseByIdEnroll = postCourseByIdEnroll;
exports.postCourseByIdLessonsByLessonIdComplete = postCourseByIdLessonsByLessonIdComplete;
exports.postCourseByCourseIdReviews = postCourseByCourseIdReviews;
