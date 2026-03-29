const express                    = require('express');
const recommendationController   = require('../controllers/recommendationController');
const authMiddleware             = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', recommendationController.getRecommendations);

module.exports = router;
