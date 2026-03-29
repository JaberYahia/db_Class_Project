const express         = require('express');
const movieController = require('../controllers/movieController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',              movieController.getAllMovies);
router.get('/search',        movieController.searchMovies);
router.get('/:omdbId',       optionalAuth, movieController.getMovieDetail);

module.exports = router;
