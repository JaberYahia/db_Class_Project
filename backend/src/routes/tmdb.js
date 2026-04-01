const express        = require('express');
const tmdbController = require('../controllers/tmdbController');

const router = express.Router();

router.get('/upcoming',         tmdbController.getUpcoming); // GET /api/tmdb/upcoming
router.get('/trailer/:omdbId',  tmdbController.getTrailer);  // GET /api/tmdb/trailer/:omdbId

module.exports = router;
