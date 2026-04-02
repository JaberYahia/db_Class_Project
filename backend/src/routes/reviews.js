const express          = require('express');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me',          authMiddleware, reviewController.getMyReviews);    // current user's reviews
router.get('/:movieId',    reviewController.getReviews);                       // public
router.post('/',           authMiddleware, reviewController.submitReview);     // auth required
router.delete('/:movieId', authMiddleware, reviewController.deleteReview);     // auth required

module.exports = router;
