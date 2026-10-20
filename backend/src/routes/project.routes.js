const { Router } = require('express');
const { authenticate, requireTeaching } = require('../middleware/auth.js');
const {
  getProjectReviews,
  putProjectReviewsById,
  getProjectLessonById,
  postProjectLessonById,
} = require('../controllers/project.controller.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const router = Router();

router.use(authenticate);
router.get('/reviews', requireTeaching, asyncHandler(getProjectReviews));
router.put('/reviews/:id', requireTeaching, asyncHandler(putProjectReviewsById));
router.get('/lesson/:id', asyncHandler(getProjectLessonById));
router.post('/lesson/:id', asyncHandler(postProjectLessonById));
module.exports = router;
