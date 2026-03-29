const express          = require('express');
const ratingController = require('../controllers/ratingController');
const authMiddleware   = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware); // all rating routes require login

router.post('/',    ratingController.submitRating);
router.get('/me',   ratingController.getMyRatings);

module.exports = router;
