const { Router } = require('express');
const { authenticate } = require('../middleware/auth.js');
const {
  getChatChannelsByChannelIdMessages,
  postChatChannelsByChannelIdMessages,
  postChatMessagesByMessageIdPin,
  postChatMessagesByMessageIdResolve,
} = require('../controllers/chat.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();

router.get(
  '/channels/:channelId/messages',
  authenticate,
  asyncHandler(getChatChannelsByChannelIdMessages),
);
router.post(
  '/channels/:channelId/messages',
  authenticate,
  asyncHandler(postChatChannelsByChannelIdMessages),
);
router.post('/messages/:messageId/pin', authenticate, asyncHandler(postChatMessagesByMessageIdPin));
router.post(
  '/messages/:messageId/resolve',
  authenticate,
  asyncHandler(postChatMessagesByMessageIdResolve),
);
module.exports = router;
