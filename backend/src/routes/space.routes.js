const { Router } = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.js');
const {
  postSpaceByIdChannels,
  putSpaceByIdChannelsByChannelId,
  deleteSpaceByIdChannelsByChannelId,
  getSpace,
  getSpaceById,
  postSpaceByIdJoin,
} = require('../controllers/space.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');

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
    return res.status(400).json({
      error: 'Dados de canal inválidos.',
    });

  return next();
}

const router = Router();

router.post('/:id/channels', authenticate, channelBody, asyncHandler(postSpaceByIdChannels));
router.put(
  '/:id/channels/:channelId',
  authenticate,
  channelBody,
  asyncHandler(putSpaceByIdChannelsByChannelId),
);
router.delete(
  '/:id/channels/:channelId',
  authenticate,
  asyncHandler(deleteSpaceByIdChannelsByChannelId),
);
router.get('/', optionalAuth, asyncHandler(getSpace));
router.get('/:id', optionalAuth, asyncHandler(getSpaceById));
router.post('/:id/join', authenticate, asyncHandler(postSpaceByIdJoin));
module.exports = router;
