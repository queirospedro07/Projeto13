import { queryOne } from '../database/connection.js';

export function canAccessChannel(user, channelId) {
  if (!user?.id || !channelId) return false;
  if (user.role === 'ADMIN' || user.role === 'SUBADMIN') return true;

  const channel = queryOne(
    `SELECT c.spaceId, s.ownerId
     FROM channels c
     JOIN spaces s ON s.id = c.spaceId
     WHERE c.id = ?`,
    [channelId]
  );

  if (!channel) return false;
  if (channel.ownerId === user.id) return true;

  const membership = queryOne(
    'SELECT id FROM memberships WHERE spaceId = ? AND userId = ?',
    [channel.spaceId, user.id]
  );
  if (membership) return true;

  return Boolean(queryOne(
    `SELECT e.id
     FROM enrollments e
     JOIN courses c ON c.id = e.courseId
     WHERE c.spaceId = ? AND e.userId = ?
     LIMIT 1`,
    [channel.spaceId, user.id]
  ));
}