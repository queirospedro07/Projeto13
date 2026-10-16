const { Router } = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.js');
const {
  getSocialFriends,
  postSocialFriendsRequestByTargetUserId,
  postSocialFriendsAcceptByFriendshipId,
  postSocialFriendsRejectByFriendshipId,
  deleteSocialFriendsRemoveByTargetUserId,
  postSocialFollowByTargetUserId,
  postSocialUnfollowByTargetUserId,
  getSocialFollowersByUserId,
  getSocialFollowingByUserId,
  getSocialStatusByTargetUserId,
  getSocialUsersSearch,
  getSocialDmConversations,
  getSocialDmMessagesByTargetUserId,
  postSocialDmSend,
} = require('../controllers/social.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();
router.get('/friends', authenticate, asyncHandler(getSocialFriends));
router.post(
  '/friends/request/:targetUserId',
  authenticate,
  asyncHandler(postSocialFriendsRequestByTargetUserId),
);
router.post(
  '/friends/accept/:friendshipId',
  authenticate,
  asyncHandler(postSocialFriendsAcceptByFriendshipId),
);
router.post(
  '/friends/reject/:friendshipId',
  authenticate,
  asyncHandler(postSocialFriendsRejectByFriendshipId),
);
router.delete(
  '/friends/remove/:targetUserId',
  authenticate,
  asyncHandler(deleteSocialFriendsRemoveByTargetUserId),
);
router.post('/follow/:targetUserId', authenticate, asyncHandler(postSocialFollowByTargetUserId));
router.post(
  '/unfollow/:targetUserId',
  authenticate,
  asyncHandler(postSocialUnfollowByTargetUserId),
);
router.get('/followers/:userId', optionalAuth, asyncHandler(getSocialFollowersByUserId));
router.get('/following/:userId', optionalAuth, asyncHandler(getSocialFollowingByUserId));
router.get('/status/:targetUserId', authenticate, asyncHandler(getSocialStatusByTargetUserId));
router.get('/users/search', optionalAuth, asyncHandler(getSocialUsersSearch));
router.get('/dm/conversations', authenticate, asyncHandler(getSocialDmConversations));
router.get(
  '/dm/messages/:targetUserId',
  authenticate,
  asyncHandler(getSocialDmMessagesByTargetUserId),
);
router.post('/dm/send', authenticate, asyncHandler(postSocialDmSend));
module.exports = router;
