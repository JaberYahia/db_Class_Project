const express        = require('express');
const tmdbController = require('../controllers/tmdbController');

const router = express.Router();

router.get('/upcoming',          tmdbController.getUpcoming);   // GET /api/tmdb/upcoming
router.get('/now-playing',       tmdbController.getNowPlaying); // GET /api/tmdb/now-playing
router.get('/resolve/:tmdbId',   tmdbController.resolveMovie);  // GET /api/tmdb/resolve/:tmdbId
router.get('/trailer/:omdbId',   tmdbController.getTrailer);    // GET /api/tmdb/trailer/:omdbId

module.exports = router;
