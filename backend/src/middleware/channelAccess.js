const { queryOne } = require('../database/connection.js');
const { canAccessSpace } = require('../services/courseAccess.js');
async function canAccessChannel(user, channelId) {
  if (typeof channelId !== 'string' || !user?.id) return false;
  const channel = await queryOne('SELECT "spaceId" FROM channels WHERE id = $1', [channelId]);
  return Boolean(channel && (await canAccessSpace(user, channel.spaceId)));
}
exports.canAccessChannel = canAccessChannel;
