import { randomUUID } from 'node:crypto';
import { canModerateSpace, canStudyCourse, canAccessSpace } from '../services/courseAccess.js';
import { Router } from 'express';
import { queryAll, queryOne, execute } from '../database/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
const router = Router();
function channelBody(req, res, next) {
  const body = req.body;
  if (
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    body.name.length > 80 ||
    !['text', 'voice', 'announcement', 'qa', 'project'].includes(body.type) ||
    (body.topic != null && (typeof body.topic !== 'string' || body.topic.length > 1000)) ||
    (body.guidingQuestion != null &&
      (typeof body.guidingQuestion !== 'string' || body.guidingQuestion.length > 2000))
  )
    return res.status(400).json({ error: 'Dados de canal inválidos.' });
  return next();
}
router.post('/:id/channels', authenticate, channelBody, (req, res) => {
  if (!canModerateSpace(req.user, req.params.id))
    return res.status(403).json({ error: 'Sem permissão para gerir canais.' });
  const id = randomUUID(),
    b = req.body;
  execute(
    'INSERT INTO channels(id,spaceId,name,type,topic,isVoice,guidingQuestion) VALUES(?,?,?,?,?,?,?)',
    [
      id,
      req.params.id,
      b.name.trim(),
      b.type,
      b.topic || '',
      b.type === 'voice' ? 1 : 0,
      b.guidingQuestion || '',
    ],
  );
  return res.status(201).json(queryOne('SELECT * FROM channels WHERE id=?', [id]));
});
router.put('/:id/channels/:channelId', authenticate, channelBody, (req, res) => {
  if (!canModerateSpace(req.user, req.params.id))
    return res.status(403).json({ error: 'Sem permissão para gerir canais.' });
  if (
    !queryOne('SELECT id FROM channels WHERE id=? AND spaceId=?', [
      req.params.channelId,
      req.params.id,
    ])
  )
    return res.status(404).json({ error: 'Canal não encontrado.' });
  const b = req.body;
  execute(
    'UPDATE channels SET name=?,type=?,topic=?,isVoice=?,guidingQuestion=? WHERE id=? AND spaceId=?',
    [
      b.name.trim(),
      b.type,
      b.topic || '',
      b.type === 'voice' ? 1 : 0,
      b.guidingQuestion || '',
      req.params.channelId,
      req.params.id,
    ],
  );
  return res.json(queryOne('SELECT * FROM channels WHERE id=?', [req.params.channelId]));
});
router.delete('/:id/channels/:channelId', authenticate, (req, res) => {
  if (!canModerateSpace(req.user, req.params.id))
    return res.status(403).json({ error: 'Sem permissão para gerir canais.' });
  if (
    !queryOne('SELECT id FROM channels WHERE id=? AND spaceId=?', [
      req.params.channelId,
      req.params.id,
    ])
  )
    return res.status(404).json({ error: 'Canal não encontrado.' });
  execute('DELETE FROM channels WHERE id=? AND spaceId=?', [req.params.channelId, req.params.id]);
  return res.json({ success: true });
});
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = `
      SELECT s.*,
             u.id as owner_id, u.name as owner_name, u.username as owner_username, u.avatarUrl as owner_avatarUrl,
             (SELECT COUNT(*) FROM memberships WHERE spaceId = s.id) as membersCount,
             (SELECT COUNT(*) FROM channels WHERE spaceId = s.id) as channelsCount,
             (SELECT COUNT(*) FROM courses WHERE spaceId = s.id) as coursesCount
      FROM spaces s
      JOIN users u ON s.ownerId = u.id
      WHERE 1=1
        AND NOT EXISTS (
          SELECT 1 FROM courses c
          WHERE c.spaceId = s.id
            AND (c.isPublished <> 1 OR (c.approvalStatus IS NOT NULL AND c.approvalStatus <> 'APPROVED'))
        )
    `;
    const params = [];
    if (category && category !== 'all') {
      sql += ` AND s.category = ?`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (s.name LIKE ? OR s.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY membersCount DESC`;
    const rows = queryAll(sql, params);
    const enriched = rows.map((s) => {
      let isMember = false;
      let memberRole = null;
      if (req.user) {
        const mem = queryOne('SELECT role FROM memberships WHERE spaceId = ? AND userId = ?', [
          s.id,
          req.user.id,
        ]);
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
});
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let space = queryOne(
      `SELECT s.*,
              u.id as owner_id, u.name as owner_name, u.username as owner_username, u.avatarUrl as owner_avatarUrl, u.bio as owner_bio,
              (SELECT COUNT(*) FROM memberships WHERE spaceId = s.id) as membersCount,
              (SELECT COUNT(*) FROM channels WHERE spaceId = s.id) as channelsCount
       FROM spaces s
       JOIN users u ON s.ownerId = u.id
       WHERE s.id = ? OR s.slug = ?`,
      [id, id],
    );
    if (!space) {
      const courseRow = queryOne(
        `SELECT c.*, u.id as owner_id, u.name as owner_name, u.username as owner_username, u.avatarUrl as owner_avatarUrl, u.bio as owner_bio
         FROM courses c
         JOIN users u ON c.creatorId = u.id
         WHERE c.id = ? OR c.slug = ?`,
        [id, id],
      );
      if (courseRow) {
        if (courseRow.spaceId) {
          space = queryOne(
            `SELECT s.*,
                    u.id as owner_id, u.name as owner_name, u.username as owner_username, u.avatarUrl as owner_avatarUrl, u.bio as owner_bio,
                    (SELECT COUNT(*) FROM memberships WHERE spaceId = s.id) as membersCount,
                    (SELECT COUNT(*) FROM channels WHERE spaceId = s.id) as channelsCount
             FROM spaces s
             JOIN users u ON s.ownerId = u.id
             WHERE s.id = ?`,
            [courseRow.spaceId],
          );
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
    let channels = queryAll('SELECT * FROM channels WHERE spaceId = ? ORDER BY orderIndex ASC', [
      space.id,
    ]);

    const courses = queryAll(
      'SELECT id, title, slug, thumbnailUrl, difficulty, durationHours, price, isFree FROM courses WHERE spaceId = ?',
      [space.id],
    );
    const members = queryAll(
      `SELECT DISTINCT u.id as user_id, u.name, u.username, u.avatarUrl, u.role as user_role,
              COALESCE(m.role, 'MEMBER') as role,
              COALESCE(m.id, 'mem-' || u.id) as id
       FROM (
         SELECT userId FROM memberships WHERE spaceId = ?
         UNION
         SELECT e.userId FROM enrollments e 
         JOIN courses c ON e.courseId = c.id 
         WHERE c.spaceId = ?
       ) t
       JOIN users u ON t.userId = u.id
       LEFT JOIN memberships m ON m.userId = u.id AND m.spaceId = ?
       ORDER BY (CASE WHEN u.id = ? THEN 0 ELSE 1 END), u.name ASC
       LIMIT 50`,
      [space.id, space.id, space.id, space.owner_id || ''],
    );
    let isMember = false;
    let memberRole = null;
    if (req.user) {
      const mem = queryOne('SELECT role FROM memberships WHERE spaceId = ? AND userId = ?', [
        space.id,
        req.user.id,
      ]);
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
      channels: canAccessSpace(req.user, space.id) ? channels : [],
      courses,
      members: (canAccessSpace(req.user, space.id) ? members : []).map((m) => ({
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
});
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const now = new Date().toISOString();
    const space = queryOne(
      'SELECT id, name, isPrivate, ownerId FROM spaces WHERE id = ? OR slug = ?',
      [id, id],
    );
    if (!space) {
      return res.status(404).json({
        error: 'Comunidade não encontrada',
      });
    }
    if (space.isPrivate === 1 && req.user.role !== 'ADMIN' && req.user.id !== space.ownerId) {
      return res.status(403).json({ error: 'Esta comunidade é privada.' });
    }
    const pendingCourse = queryOne(
      `
      SELECT id FROM courses
      WHERE spaceId = ?
        AND (isPublished <> 1 OR (approvalStatus IS NOT NULL AND approvalStatus <> 'APPROVED'))
      LIMIT 1
    `,
      [space.id],
    );
    if (pendingCourse) {
      return res.status(403).json({ error: 'Este curso ainda aguarda aprovação.' });
    }
    const lockedCourse = queryAll(
      'SELECT * FROM courses WHERE spaceId = ? AND isFree = 0 AND price > 0',
      [space.id],
    ).find((course) => !canStudyCourse(req.user, course));
    if (lockedCourse)
      return res.status(403).json({ error: 'Inscreva-se no curso antes de entrar na comunidade.' });
    const existing = queryOne('SELECT id FROM memberships WHERE spaceId = ? AND userId = ?', [
      space.id,
      userId,
    ]);
    if (!existing) {
      execute(
        `INSERT INTO memberships (id, userId, spaceId, role, joinedAt) VALUES (?, ?, ?, 'MEMBER', ?)`,
        [`mem-${Date.now()}`, userId, space.id, now],
      );
    }
    const linkedCourses = queryAll(
      `SELECT id FROM courses WHERE (spaceId = ? OR id = ?) AND isFree = 1 AND isPublished = 1 AND (approvalStatus = 'APPROVED' OR approvalStatus IS NULL)`,
      [space.id, space.id],
    );
    linkedCourses.forEach((c) => {
      execute(
        `INSERT OR IGNORE INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 0)`,
        [`enr-${Date.now()}-${c.id}`, userId, c.id, now],
      );
    });
    return res.status(201).json({
      message: 'Entrou na comunidade e no curso com sucesso!',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao entrar na comunidade',
    });
  }
});
export default router;
