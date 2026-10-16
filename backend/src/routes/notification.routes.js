const { Router } = require('express');
const { authenticate } = require('../middleware/auth.js');
const {
  getNotification,
  putNotificationReadAll,
  putNotificationByIdRead,
} = require('../controllers/notification.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();
router.get('/', authenticate, asyncHandler(getNotification));
router.put('/read-all', authenticate, asyncHandler(putNotificationReadAll));
router.put('/:id/read', authenticate, asyncHandler(putNotificationByIdRead));
module.exports = router;
