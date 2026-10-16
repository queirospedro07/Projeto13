const { Router } = require('express');
const { authenticate } = require('../middleware/auth.js');
const {
  getNotesByLessonId,
  postNotesByLessonId,
  getNotes,
} = require('../controllers/notes.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();
router.get('/:lessonId', authenticate, asyncHandler(getNotesByLessonId));
router.post('/:lessonId', authenticate, asyncHandler(postNotesByLessonId));
router.get('/', authenticate, asyncHandler(getNotes));
module.exports = router;
