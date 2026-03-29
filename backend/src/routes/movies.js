const express         = require('express');
const movieController = require('../controllers/movieController');
const authMiddleware  = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',              movieController.getAllMovies);
router.get('/search',        movieController.searchMovies);
router.get('/:omdbId',       authMiddleware, movieController.getMovieDetail);

module.exports = router;
