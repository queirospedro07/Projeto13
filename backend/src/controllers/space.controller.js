const Space = require('../models/Space.js');
const { asyncMap, asyncForEach, asyncSome } = require('../utils/asyncCollections.js');
const { transaction, lockTransaction } = require('../database/connection.js');
const { randomUUID } = require('node:crypto');
const { canModerateSpace, canStudyCourse, canAccessSpace } = require('../services/courseAccess.js');
const postSpaceByIdChannels = async (req, res) => {
  if (!(await canModerateSpace(req.user, req.params.id)))
    return res.status(403).json({
      error: 'Sem permissão para gerir canais.',
    });
  const id = randomUUID();
  const b = req.body;

  await Space.insertChannels([
    id,
    req.params.id,
    b.name.trim(),
    b.type,
    b.topic || '',
    b.type === 'voice' ? 1 : 0,
    b.guidingQuestion || '',
  ]);

  return res.status(201).json(await Space.findChannelsById([id]));
};

const putSpaceByIdChannelsByChannelId = async (req, res) => {
  if (!(await canModerateSpace(req.user, req.params.id)))
    return res.status(403).json({
      error: 'Sem permissão para gerir canais.',
    });
  if (!(await Space.findChannelsByIdAndSpaceId([req.params.channelId, req.params.id])))
    return res.status(404).json({
      error: 'Canal não encontrado.',
    });
  const b = req.body;

  await Space.updateChannel([
    b.name.trim(),
    b.type,
    b.topic || '',
    b.type === 'voice' ? 1 : 0,
    b.guidingQuestion || '',
    req.params.channelId,
    req.params.id,
  ]);

  return res.json(await Space.findChannelsById([req.params.channelId]));
};

const deleteSpaceByIdChannelsByChannelId = async (req, res) => {
  if (!(await canModerateSpace(req.user, req.params.id)))
    return res.status(403).json({
      error: 'Sem permissão para gerir canais.',
    });
  if (!(await Space.findChannelsByIdAndSpaceId([req.params.channelId, req.params.id])))
    return res.status(404).json({
      error: 'Canal não encontrado.',
    });
  await Space.deleteChannelsByIdAndSpaceId([req.params.channelId, req.params.id]);

  return res.json({
    success: true,
  });
};

const getSpace = async (req, res) => {
  try {
    const rows = await Space.search(req.query);
    const enriched = await asyncMap(rows, async (s) => {
      let isMember = false;
      let memberRole = null;
      if (req.user) {
        const mem = await Space.findMemBySpaceIdAndUserId([s.id, req.user.id]);
        if (mem) {
          isMember = true;
          memberRole = mem.role;
        }
      }

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        bannerUrl: s.bannerUrl,
        iconUrl: s.iconUrl,
        category: s.category,
        owner: {
          id: s.owner_id,
          name: s.owner_name,
          username: s.owner_username,
          avatarUrl: s.owner_avatarUrl,
        },
        membersCount: s.membersCount,
        channelsCount: s.channelsCount,
        coursesCount: s.coursesCount,
        isMember,
        memberRole,
      };
    });

    return res.json(enriched);
  } catch (err) {
    console.error('Failed to fetch spaces:', err);

    return res.status(500).json({
      error: 'Falha ao carregar comunidades',
    });
  }
};

const getSpaceById = async (req, res) => {
  try {
    const { id } = req.params;
    let space = await Space.countSpaceByIdAndSlug([id, id]);
    if (!space) {
      const courseRow = await Space.findCourseRowByIdAndSlug([id, id]);
      if (courseRow) {
        if (courseRow.spaceId) {
          space = await Space.countMembershipsById([courseRow.spaceId]);
        }

        if (!space) {
          space = {
            id: courseRow.id,
            name: courseRow.title,
            slug: courseRow.slug,
            description: courseRow.description,
            iconUrl: courseRow.thumbnailUrl,
            bannerUrl: courseRow.bannerUrl || courseRow.thumbnailUrl,
            category: courseRow.category,
            owner_id: courseRow.owner_id,
            owner_name: courseRow.owner_name,
            owner_username: courseRow.owner_username,
            owner_avatarUrl: courseRow.owner_avatarUrl,
            owner_bio: courseRow.owner_bio,
            membersCount: 1,
            channelsCount: 4,
            courseId: courseRow.id,
          };
        }
      }
    }

    if (!space) {
      return res.status(404).json({
        error: 'Comunidade não encontrada',
      });
    }

    let channels = await Space.listChannelsBySpaceId([space.id]);
    const courses = await Space.listCoursesBySpaceId([space.id]);
    const members = await Space.listMembersBySpaceIdAndId([
      space.id,
      space.id,
      space.id,
      space.owner_id || '',
    ]);
    let isMember = false;
    let memberRole = null;
    if (req.user) {
      const mem = await Space.findMemBySpaceIdAndUserId([space.id, req.user.id]);
      if (mem) {
        isMember = true;
        memberRole = mem.role;
      }
    }

    return res.json({
      ...space,
      owner: {
        id: space.owner_id,
        name: space.owner_name,
        username: space.owner_username,
        avatarUrl: space.owner_avatarUrl,
        bio: space.owner_bio,
      },
      channels: (await canAccessSpace(req.user, space.id)) ? channels : [],
      courses,
      members: ((await canAccessSpace(req.user, space.id)) ? members : []).map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: {
          id: m.user_id,
          name: m.name,
          username: m.username,
          avatarUrl: m.avatarUrl,
          role: m.user_role,
          xp: m.xp,
          level: m.level,
        },
      })),
      isMember,
      memberRole,
    });
  } catch (err) {
    console.error('Failed to load space details:', err);

    return res.status(500).json({
      error: 'Falha ao carregar detalhes do espaço',
    });
  }
};

const postSpaceByIdJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const now = new Date().toISOString();
    const space = await Space.findSpaceByIdAndSlug([id, id]);
    if (!space) {
      return res.status(404).json({
        error: 'Comunidade não encontrada',
      });
    }

    if (space.isPrivate === 1 && req.user.role !== 'ADMIN' && req.user.id !== space.ownerId) {
      return res.status(403).json({
        error: 'Esta comunidade é privada.',
      });
    }

    const pendingCourse = await Space.findPendingCourseBySpaceId([space.id]);
    if (pendingCourse) {
      return res.status(403).json({
        error: 'Este curso ainda aguarda aprovação.',
      });
    }

    const lockedCourse = await asyncSome(
      await Space.listCoursesBySpaceIdForPostSpaceByIdJoin([space.id]),
      async (course) => !(await canStudyCourse(req.user, course)),
    );
    if (lockedCourse)
      return res.status(403).json({
        error: 'Inscreva-se no curso antes de entrar na comunidade.',
      });
    await transaction(async () => {
      await lockTransaction(`membership:${userId}:${space.id}`);

      const existing = await Space.findExistingBySpaceIdAndUserId([space.id, userId]);
      if (!existing) await Space.insertMemberships([randomUUID(), userId, space.id, now]);
      const linkedCourses = await Space.listLinkedCoursesBySpaceIdAndId([space.id, space.id]);

      await asyncForEach(linkedCourses, async (c) => {
        await lockTransaction(`enrollment:${userId}:${c.id}`);
        await Space.insertEnrollments([randomUUID(), userId, c.id, now]);
      });
    });

    return res.status(201).json({
      message: 'Entrou na comunidade e no curso com sucesso!',
    });
  } catch {
    return res.status(500).json({
      error: 'Falha ao entrar na comunidade',
    });
  }
};

exports.postSpaceByIdChannels = postSpaceByIdChannels;
exports.putSpaceByIdChannelsByChannelId = putSpaceByIdChannelsByChannelId;
exports.deleteSpaceByIdChannelsByChannelId = deleteSpaceByIdChannelsByChannelId;
exports.getSpace = getSpace;
exports.getSpaceById = getSpaceById;
exports.postSpaceByIdJoin = postSpaceByIdJoin;
