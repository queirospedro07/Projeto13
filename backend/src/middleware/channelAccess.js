import { queryOne } from '../database/connection.js';
import { canAccessSpace } from '../services/courseAccess.js';
export function canAccessChannel(user, channelId) {
  if (typeof channelId !== 'string' || !user?.id) return false;
  const channel = queryOne('SELECT spaceId FROM channels WHERE id = ?', [channelId]);
  return Boolean(channel && canAccessSpace(user, channel.spaceId));
}
