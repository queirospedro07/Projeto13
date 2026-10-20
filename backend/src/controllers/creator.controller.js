const { submitCourse, checkVersion } = require('../services/coursePublication');
const Creator = require('../models/Creator.js');
const { asyncForEach } = require('../utils/asyncCollections.js');
const { canManageCourse } = require('../services/courseAccess.js');
const { randomUUID } = require('node:crypto');
const { transaction, lockTransaction } = require('../database/connection.js');
const { ensureCourseCommunity } = require('../services/courseCommunity');
const getCreatorApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const application = await Creator.findApplicationByUserId([userId]);

    return res.json({
      role: req.user.role,
      hasApplication: !!application,
      application: application || null,
    });
  } catch {
    return res.status(500).json({
      error: 'Falha ao obter estado da candidatura',
    });
  }
};

const postCreatorApply = async (req, res) => {
  try {
    const userId = req.user.id;
    if (req.user.role === 'CREATOR' || req.user.role === 'ADMIN') {
      return res.status(400).json({
        error: 'A sua conta já tem estatuto de Formador ou Administrador.',
      });
    }

    const existingPending = await Creator.findExistingPendingByUserId([userId]);
    if (existingPending) {
      return res.status(400).json({
        error: 'Já tem uma candidatura pendente em análise pela administração.',
      });
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

    if (
      [fullName, bio, expertise, portfolioUrl, motivation, proposedCourses, sampleVideoUrl].some(
        (value) => value !== undefined && (typeof value !== 'string' || value.length > 10000),
      ) ||
      (experienceYears !== undefined &&
        (!Number.isFinite(Number(experienceYears)) ||
          Number(experienceYears) < 0 ||
          Number(experienceYears) > 100))
    )
      return res.status(400).json({ error: 'Dados da candidatura inválidos.' });
    const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    await Creator.insertCreatorApplications([
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
    ]);

    // Notificar administradores
    const admins = await Creator.listAdmins();
    for (const admin of admins) {
      await Creator.insertNotifications([
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        admin.id,
        `${fullName} submeteu um inquérito de candidatura para lecionar no NEXO.`,
        now,
      ]);
    }

    const application = await Creator.findApplicationById([appId]);

    return res.status(201).json({
      message: 'Candidatura submetida com sucesso! A aguardar revisão do Administrador.',
      application,
    });
  } catch (err) {
    console.error('Error submitting creator application:', err);

    return res.status(500).json({
      error: 'Falha ao submeter candidatura a criador',
    });
  }
};

const getCreatorStats = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const courses = await Creator.countCoursesByCreatorId([creatorId, creatorId]);
    const totalStudents = courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0);
    const revenue = await Creator.sumApprovedRevenueByCreatorId([creatorId]);
    const totalRevenueCents = Number(revenue.totalRevenueCents);
    const totalRevenue = totalRevenueCents / 100;
    const recentEnrollments = await Creator.listRecentEnrollmentsByCreatorId([
      creatorId,
      creatorId,
    ]);
    const completedEnrollments =
      (await Creator.countEnrollmentsByCreatorId([creatorId, creatorId]))?.c || 0;
    const completionRate =
      totalStudents > 0 ? Math.round((completedEnrollments / totalStudents) * 100) : 0;
    const ratingRow = await Creator.findRatingRowByCreatorId([creatorId]);
    const averageRating = ratingRow?.avgRating ? Number(ratingRow.avgRating).toFixed(1) : '0.0';
    const quizRow = await Creator.findQuizRowByCreatorId([creatorId]);
    const averageQuizScore = quizRow?.avgScore ? Math.round(Number(quizRow.avgScore)) : 0;

    return res.json({
      totalRevenue,
      totalRevenueCents,
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
};

const getCreatorCoursesByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const creatorId = req.user.id;
    const course = await Creator.countCourseByIdAndCreatorIdAndIdUtilizador([
      courseId,
      creatorId,
      req.user.role,
      creatorId,
    ]);
    if (!course)
      return res.status(404).json({
        error: 'Curso não encontrado ou sem permissão',
      });
    const modules = await Creator.listModulesByCourseId([courseId]);
    for (const mod of modules) {
      mod.lessons = await Creator.listLessonsByModuleId([mod.id]);
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
          const q = await Creator.findQByLessonId([les.id]);
          if (q) {
            const questions = await Creator.listQuestionsByQuizId([q.id]);

            q.questions = questions.map((qq) => ({
              ...qq,
              options: (() => {
                try {
                  return typeof qq.options === 'string' ? JSON.parse(qq.options) : qq.options || [];
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
    const channels = spaceId ? await Creator.listChannelsBySpaceId([spaceId]) : [];
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
      hasCommunity: Boolean(course.spaceId),
      learningOutcomes: parsedOutcomes,
      requirements: parsedRequirements,
      documents: parsedDocuments,
      isFree: course.isFree === 1,
      isPublished: course.isPublished === 1,
      allowStudentScreenShare: course.allowStudentScreenShare === 1,
      allowStudentCamera: course.allowStudentCamera === 1,
      modules,
      channels,
    });
  } catch {
    return res.status(500).json({
      error: 'Falha ao carregar curso',
    });
  }
};

const putCreatorCoursesByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const creatorId = req.user.id;
    let owned = null;
    if (req.user.role !== 'ADMIN') {
      owned = await Creator.findCoursesByIdAndCreatorIdAndIdCursoAndIdUtilizador([
        courseId,
        creatorId,
        courseId,
        creatorId,
      ]);
      if (!owned)
        return res.status(403).json({
          error: 'Sem permissão para editar este curso',
        });
    } else {
      owned = await Creator.findCoursesById([courseId]);
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
    const safeIsPublished = 0;

    await transaction(async () => {
      await lockTransaction(`course-community:${courseId}`);

      const current = await Creator.findCoursesById([courseId]);
      if (!current) throw Object.assign(new Error('Curso não encontrado.'), { status: 404 });
      checkVersion(current, req.body.expectedUpdatedAt);
      owned = current;
      await Creator.updateCourseDetails(false, [
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
        defaultCallMode || owned.defaultCallMode || 'open',
        allowStudentScreenShare !== undefined
          ? allowStudentScreenShare
            ? 1
            : 0
          : owned.allowStudentScreenShare,
        allowStudentCamera !== undefined ? (allowStudentCamera ? 1 : 0) : owned.allowStudentCamera,
        outcomesStr,
        requirementsStr,
        documentsStr,
        now,
        courseId,
      ]);
      if (
        !owned.spaceId &&
        req.body.hasCommunity !== false &&
        (req.body.hasCommunity === true || (Array.isArray(channels) && channels.length > 0))
      ) {
        owned.spaceId = await ensureCourseCommunity(req.user, courseId);
      }

      if (owned?.spaceId && title) {
        await Creator.updateSpacesByNameAndDescriptionAndId([
          title.trim(),
          description || '',
          owned.spaceId,
        ]);
      }

      if (Array.isArray(modules)) {
        const existingModules = await Creator.listExistingModulesByCourseId([courseId]);
        const incomingModIds = new Set(
          modules.filter((m) => m.id && !String(m.id).startsWith('mod-temp-')).map((m) => m.id),
        );
        for (const exMod of existingModules) {
          if (!incomingModIds.has(exMod.id)) {
            const exLessons = await Creator.listExLessonsByModuleId([exMod.id]);
            for (const el of exLessons) {
              await Creator.deleteQuizQuestionsByLessonId([el.id]);
              await Creator.deleteQuizzesByLessonId([el.id]);
              await Creator.deleteLessonProgressByLessonId([el.id]);
              await Creator.deleteNotesByLessonId([el.id]);
            }

            await Creator.deleteLessonsByModuleId([exMod.id]);
            await Creator.deleteCourseModulesById([exMod.id]);
          }
        }

        await asyncForEach(modules, async (mod, mIdx) => {
          let modId = mod.id;
          const drip = mod.dripMode === 'sequential' ? 'sequential' : 'instant';
          const exists = modId
            ? await Creator.findCourseModulesByIdAndCourseId([modId, courseId])
            : null;
          if (exists) {
            await Creator.updateModule([
              mod.title || `Módulo ${mIdx + 1}`,
              mod.description || '',
              mIdx,
              drip,
              modId,
              courseId,
            ]);
          } else {
            modId = modId && !(await Creator.findCourseModulesById([modId])) ? modId : randomUUID();
            await Creator.insertCourseModules([
              modId,
              courseId,
              mod.title || `Módulo ${mIdx + 1}`,
              mod.description || '',
              mIdx,
              drip,
            ]);
          }

          if (Array.isArray(mod.lessons)) {
            const existingLessons = await Creator.listExLessonsByModuleId([modId]);
            const incomingLesIds = new Set(
              mod.lessons
                .filter((l) => l.id && !String(l.id).startsWith('les-temp-'))
                .map((l) => l.id),
            );
            for (const exLes of existingLessons) {
              if (!incomingLesIds.has(exLes.id)) {
                await Creator.deleteQuizQuestionsByLessonId([exLes.id]);
                await Creator.deleteQuizzesByLessonId([exLes.id]);
                await Creator.deleteLessonProgressByLessonId([exLes.id]);
                await Creator.deleteNotesByLessonId([exLes.id]);
                await Creator.deleteLessonsById([exLes.id]);
              }
            }

            await asyncForEach(mod.lessons, async (les, lIdx) => {
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
                ? await Creator.findLessonsByIdAndModuleId([lesId, modId])
                : null;
              if (lesExists) {
                await Creator.updateLesson([
                  les.title || `Aula ${lIdx + 1}`,
                  les.type || 'video',
                  contentToStore,
                  les.videoUrl || '',
                  Number(les.durationMin || 15),
                  lIdx,
                  Number(les.xpReward || 25),
                  lesId,
                  modId,
                ]);
              } else {
                lesId = lesId && !(await Creator.findLessonsById([lesId])) ? lesId : randomUUID();
                await Creator.insertLessons([
                  lesId,
                  modId,
                  les.title || `Aula ${lIdx + 1}`,
                  les.type || 'video',
                  contentToStore,
                  les.videoUrl || '',
                  Number(les.durationMin || 15),
                  lIdx,
                  Number(les.xpReward || 25),
                ]);
              }

              if (les.quiz) {
                const quizId = `quiz-${lesId}`;
                const qExists = await Creator.findQExistsByLessonId([lesId]);
                if (qExists) {
                  await Creator.updateQuizzesByTitleAndDescriptionAndPassingScoreAndXpRewardAndId([
                    les.quiz.title || `Questionário: ${les.title}`,
                    les.quiz.description || '',
                    Number(les.quiz.passingScore || 70),
                    Number(les.quiz.xpReward || 50),
                    qExists.id,
                  ]);
                  await Creator.deleteQuizQuestionsByQuizId([qExists.id]);
                } else {
                  await Creator.insertQuizzes([
                    quizId,
                    lesId,
                    les.quiz.title || `Questionário: ${les.title}`,
                    les.quiz.description || '',
                    Number(les.quiz.passingScore || 70),
                    Number(les.quiz.xpReward || 50),
                  ]);
                }

                const activeQuizId = qExists ? qExists.id : quizId;
                if (Array.isArray(les.quiz.questions)) {
                  await asyncForEach(les.quiz.questions, async (q, qIdx) => {
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

                    await Creator.insertQuizQuestions([
                      qId,
                      activeQuizId,
                      q.question || `Questão ${qIdx + 1}`,
                      JSON.stringify(optionsArray),
                      correctOptionIndex,
                      q.explanation || '',
                      qIdx,
                    ]);
                  });
                }
              }
            });
          }
        });
      }

      if (req.body.hasCommunity !== false && Array.isArray(channels) && owned?.spaceId) {
        const existingChannels = await Creator.listChannelsBySpaceId([owned.spaceId]);
        const retainedIds = new Set(channels.map((channel) => channel.id));
        for (const channel of existingChannels) {
          if (!retainedIds.has(channel.id))
            await Creator.deleteChannelByIdAndSpaceId([channel.id, owned.spaceId]);
        }

        await asyncForEach(channels, async (ch, chIdx) => {
          const isVoiceChan = ch.type === 'voice' || ch.isVoice ? 1 : 0;
          const chanAccess =
            ch.accessMode || (ch.type === 'announcement' ? 'announcement' : 'discussion');
          const chanVoiceMode = ch.voiceMode || defaultCallMode || 'open';
          const chExists = ch.id
            ? await Creator.findChannelsByIdAndSpaceId([ch.id, owned.spaceId])
            : null;
          if (chExists) {
            await Creator.updateChannelSettings([
              ch.name,
              ch.type || 'text',
              ch.topic || '',
              chIdx,
              isVoiceChan,
              chanAccess,
              chanVoiceMode,
              ch.id,
            ]);
          } else {
            const newChId = randomUUID();

            await Creator.insertChannels([
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
            ]);
          }
        });
      }
    });

    return res.json({
      success: true,
      id: courseId,
    });
  } catch (err) {
    if (!err.status || err.status >= 500) console.error('Update course error:', err);

    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Falha ao atualizar curso' });
  }
};

const getCreatorCourses = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const courses = await Creator.countCoursesByCreatorIdAndIdUtilizador([
      creatorId,
      creatorId,
      creatorId,
    ]);

    return res.json(
      courses.map((c) => ({
        ...c,
        isFree: c.isFree === 1,
        isPublished: c.isPublished === 1,
        isOwner: c.isOwner === 1,
        _count: {
          enrollments: c.studentsCount || 0,
          modules: c.modulesCount || 0,
          reviews: c.reviewsCount || 0,
        },
      })),
    );
  } catch {
    return res.status(500).json({
      error: 'Falha ao carregar cursos do criador',
    });
  }
};

const deleteCreatorCoursesByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Creator.findCourseById([courseId]);
    if (!course) {
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    }

    if (req.user.role !== 'ADMIN' && course.creatorId !== req.user.id) {
      return res.status(403).json({
        error: 'Só pode eliminar cursos que criou',
      });
    }

    const otherCourseUsesSpace =
      course.spaceId && (await Creator.findCoursesBySpaceId([course.spaceId, courseId]));
    const deleteOwnedSpace =
      course.spaceId && course.spaceOwnerId === course.creatorId && !otherCourseUsesSpace;

    await transaction(async () => {
      await Creator.deleteCoursesById([courseId]);
      if (deleteOwnedSpace) {
        await Creator.deleteSpacesByIdAndOwnerId([course.spaceId, course.creatorId]);
      }
    });

    return res.json({
      success: true,
      id: courseId,
    });
  } catch (err) {
    console.error('Delete course error:', err);

    return res.status(500).json({
      error: 'Falha ao eliminar curso',
    });
  }
};

const postCreatorCourses = async (req, res) => {
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
      const space = await Creator.findSpaceById([resolvedSpaceId]);
      if (!space || (req.user.role !== 'ADMIN' && space.ownerId !== creatorId))
        return res.status(403).json({
          error: 'Só pode associar comunidades que administra.',
        });
      if (await Creator.findCoursesBySpaceIdForPostCreatorCourses([resolvedSpaceId]))
        return res.status(409).json({
          error: 'Esta comunidade já pertence a outro curso.',
        });
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

    await transaction(async () => {
      if (!resolvedSpaceId && req.body.hasCommunity !== false) {
        resolvedSpaceId = randomUUID();

        const spaceSlug = `${slug}-comunidade`;

        await Creator.insertSpaces([
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
        ]);
        await Creator.insertMemberships([randomUUID(), creatorId, resolvedSpaceId, now]);

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

        await asyncForEach(channelsToInsert, async (ch, chIdx) => {
          const chId = randomUUID();
          const isVoiceChan = ch.type === 'voice' || ch.isVoice ? 1 : 0;
          const chanAccess =
            ch.accessMode || (ch.type === 'announcement' ? 'announcement' : 'discussion');
          const chanVoiceMode = ch.voiceMode || defaultCallMode || 'open';

          await Creator.insertChannelsForLookup([
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
          ]);
        });
      }

      const defCallMode = defaultCallMode || 'open';
      const allowScreen = allowStudentScreenShare !== false ? 1 : 0;
      const allowCam = allowStudentCamera !== false ? 1 : 0;
      const approvalStatus = req.user.role === 'ADMIN' && isPublished ? 'APPROVED' : 'DRAFT';
      const isPub = req.user.role === 'ADMIN' && isPublished ? 1 : 0;

      await Creator.insertCourses([
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
      ]);
      if (Array.isArray(modules)) {
        await asyncForEach(modules, async (mod, mIdx) => {
          const modId = randomUUID();
          const drip = mod.dripMode === 'sequential' ? 'sequential' : 'instant';

          await Creator.insertCourseModulesForLookup([
            modId,
            courseId,
            mod.title || `Módulo ${mIdx + 1}`,
            mod.description || '',
            mIdx,
            drip,
          ]);
          if (Array.isArray(mod.lessons)) {
            await asyncForEach(mod.lessons, async (les, lIdx) => {
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

              await Creator.insertLessonsForLookup([
                lesId,
                modId,
                les.title || `Aula ${lIdx + 1}`,
                les.type || 'video',
                contentToStore,
                les.videoUrl || '',
                Number(les.durationMin || 15),
                lIdx,
                Number(les.xpReward || 25),
              ]);
              if (les.quiz) {
                const quizId = randomUUID();

                await Creator.insertQuizzesForLookup([
                  quizId,
                  lesId,
                  les.quiz.title || `Questionário: ${les.title}`,
                  les.quiz.description || '',
                  Number(les.quiz.passingScore || 70),
                  Number(les.quiz.xpReward || 50),
                ]);
                if (Array.isArray(les.quiz.questions)) {
                  await asyncForEach(les.quiz.questions, async (q, qIdx) => {
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

                    await Creator.insertQuizQuestionsForLookup([
                      qId,
                      quizId,
                      q.question || `Questão ${qIdx + 1}`,
                      JSON.stringify(optionsArray),
                      correctOptionIndex,
                      q.explanation || '',
                      qIdx,
                    ]);
                  });
                }
              }
            });
          }
        });
      }

      await Creator.insertEnrollments([randomUUID(), creatorId, courseId, now]);
    });

    const createdCourse = await Creator.findCoursesById([courseId]);

    return res.status(201).json(createdCourse);
  } catch (err) {
    console.error('Create course error:', err);

    return res.status(500).json({
      error: 'Falha ao criar curso',
    });
  }
};

const getCreatorMembers = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const members = await Creator.listMembersByCreatorIdAndUserId([
      creatorId,
      creatorId,
      creatorId,
    ]);
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
};

const getCreatorCoursesByCourseIdCollaborators = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    if (req.user.role !== 'ADMIN') {
      const access = await Creator.findAccessByIdAndCreatorIdAndUserId([courseId, userId, userId]);
      if (!access)
        return res.status(403).json({
          error: 'Acesso negado a este curso',
        });
    }

    const collaborators = await Creator.listCollaboratorsByCourseId([courseId]);

    return res.json(collaborators);
  } catch (err) {
    console.error('Get collaborators error:', err);

    return res.status(500).json({
      error: 'Falha ao carregar colaboradores do curso',
    });
  }
};

const postCreatorCoursesByCourseIdCollaborators = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const course = await Creator.findCourseByIdForPostCreatorCoursesByCourseIdCollaborators([
      courseId,
    ]);
    if (!course)
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    if (req.user.role !== 'ADMIN' && course.creatorId !== userId) {
      return res.status(403).json({
        error: 'Apenas o proprietário do curso pode adicionar colaboradores',
      });
    }

    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({
        error: 'Indique o nome de utilizador ou email do colaborador',
      });
    }

    const cleanIdent = identifier.trim().toLowerCase();
    const targetUser = await Creator.findTargetUser([cleanIdent, cleanIdent]);
    if (!targetUser) {
      return res.status(404).json({
        error: 'Utilizador não encontrado com este email/username',
      });
    }

    if (targetUser.id === course.creatorId) {
      return res.status(400).json({
        error: 'O criador já é o proprietário do curso',
      });
    }

    const existing = await Creator.findExistingByCourseIdAndUserId([courseId, targetUser.id]);
    if (existing) {
      return res.status(400).json({
        error: 'Este utilizador já é colaborador deste curso',
      });
    }

    const collabId = `collab-${Date.now()}`;
    const now = new Date().toISOString();

    await Creator.insertCourseCollaborators([collabId, courseId, targetUser.id, now]);

    const enrolled = await Creator.findEnrolledByCourseIdAndUserId([courseId, targetUser.id]);
    if (!enrolled) {
      await Creator.insertEnrollmentsForPostCreatorCoursesByCourseIdCollaborators([
        `enr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        targetUser.id,
        courseId,
        now,
      ]);
    }

    await Creator.insertNotificationsForPostCreatorCoursesByCourseIdCollaborators([
      `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      targetUser.id,
      `Foi adicionado como colaborador do curso "${course.title}". Agora pode ajudar a gerir os conteúdos.`,
      `/creator/courses/${courseId}/edit`,
      now,
    ]);

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

    return res.status(500).json({
      error: 'Falha ao adicionar colaborador',
    });
  }
};

const deleteCreatorCoursesByCourseIdCollaboratorsByTargetUserId = async (req, res) => {
  try {
    const { courseId, targetUserId } = req.params;
    const userId = req.user.id;
    const course = await Creator.findCourseForCollaboratorRemoval([courseId]);
    if (!course)
      return res.status(404).json({
        error: 'Curso não encontrado',
      });
    if (req.user.role !== 'ADMIN' && course.creatorId !== userId && targetUserId !== userId) {
      return res.status(403).json({
        error: 'Sem permissão para remover este colaborador',
      });
    }

    await Creator.deleteCourseCollaboratorsByCourseIdAndUserId([courseId, targetUserId]);

    return res.json({
      success: true,
      message: 'Colaborador removido com sucesso',
    });
  } catch (err) {
    console.error('Delete collaborator error:', err);

    return res.status(500).json({
      error: 'Falha ao remover colaborador',
    });
  }
};

const deleteCreatorCoursesByCourseIdMembersByUserId = async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    const creatorId = req.user.id;
    if (req.user.role !== 'ADMIN') {
      const owned = await Creator.findOwnedByIdAndCreatorIdAndUserId([
        courseId,
        creatorId,
        creatorId,
      ]);
      if (!owned)
        return res.status(403).json({
          error: 'Acesso negado a este curso',
        });
    }

    await Creator.deleteEnrollmentsByCourseIdAndUserId([courseId, userId]);
    req.app
      .get('io')
      ?.in('user_' + userId)
      .disconnectSockets(true);

    return res.json({
      success: true,
      message: 'Membro removido do curso com sucesso',
    });
  } catch {
    return res.status(500).json({
      error: 'Falha ao remover membro',
    });
  }
};

const postCreatorCoursesByCourseIdEnrollments = async (req, res) => {
  const course = await Creator.findCoursesById([req.params.courseId]);
  if (!course)
    return res.status(404).json({
      error: 'Curso não encontrado.',
    });
  if (!(await canManageCourse(req.user, course)))
    return res.status(403).json({
      error: 'Sem permissão para gerir inscrições.',
    });
  const identifier = req.body.identifier;
  if (typeof identifier !== 'string' || !identifier.trim() || identifier.length > 254)
    return res.status(400).json({
      error: 'Indique um email ou nome de utilizador.',
    });
  const student = await Creator.findStudent([
    identifier.trim().toLowerCase(),
    identifier.trim().toLowerCase(),
  ]);
  if (!student)
    return res.status(404).json({
      error: 'Utilizador não encontrado.',
    });
  await transaction(async () => {
    await lockTransaction(`enrollment:${student.id}:${course.id}`);
    if (!(await Creator.findEnrolledByCourseIdAndUserId([course.id, student.id])))
      await Creator.insertEnrollmentsForLookup([
        randomUUID(),
        student.id,
        course.id,
        new Date().toISOString(),
      ]);
    if (
      course.spaceId &&
      !(await Creator.findMembershipsBySpaceIdAndUserId([course.spaceId, student.id]))
    )
      await Creator.insertMembershipsForLookup([
        randomUUID(),
        student.id,
        course.spaceId,
        new Date().toISOString(),
      ]);
  });

  return res.json({
    message: 'Acesso concedido.',
    userId: student.id,
    courseId: course.id,
  });
};

const postCreatorCoursesByCourseIdSubmitReview = async (req, res) => {
  try {
    res.json(await submitCourse(req.user, req.params.courseId));
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.status ? error.message : 'Falha ao enviar curso para revisão.' });
  }
};

exports.getCreatorApplicationStatus = getCreatorApplicationStatus;
exports.postCreatorCourseCommunity = async (req, res) => {
  const spaceId = await ensureCourseCommunity(req.user, req.params.courseId);

  res.json({ spaceId });
};

exports.postCreatorApply = postCreatorApply;
exports.getCreatorStats = getCreatorStats;
exports.getCreatorCoursesByCourseId = getCreatorCoursesByCourseId;
exports.putCreatorCoursesByCourseId = putCreatorCoursesByCourseId;
exports.getCreatorCourses = getCreatorCourses;
exports.deleteCreatorCoursesByCourseId = deleteCreatorCoursesByCourseId;
exports.postCreatorCourses = postCreatorCourses;
exports.getCreatorMembers = getCreatorMembers;
exports.getCreatorCoursesByCourseIdCollaborators = getCreatorCoursesByCourseIdCollaborators;
exports.postCreatorCoursesByCourseIdCollaborators = postCreatorCoursesByCourseIdCollaborators;
exports.deleteCreatorCoursesByCourseIdCollaboratorsByTargetUserId =
  deleteCreatorCoursesByCourseIdCollaboratorsByTargetUserId;
exports.deleteCreatorCoursesByCourseIdMembersByUserId =
  deleteCreatorCoursesByCourseIdMembersByUserId;
exports.postCreatorCoursesByCourseIdEnrollments = postCreatorCoursesByCourseIdEnrollments;
exports.postCreatorCoursesByCourseIdSubmitReview = postCreatorCoursesByCourseIdSubmitReview;
