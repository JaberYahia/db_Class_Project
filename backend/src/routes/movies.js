// ─────────────────────────────────────────────────────────────────────────────
// routes/movies.js — Movie endpoints
//
// Mounted in server.js at /api/movies. Full paths:
//   GET /api/movies          → all movies with average ratings (public)
//   GET /api/movies/search   → OMDB search by keyword (public)
//   GET /api/movies/:omdbId  → single movie detail (public, but attaches user rating if logged in)
//
// Note: the detail route uses optionalAuth instead of required auth.
// This means guests can view movie details, but logged-in users also get
// their personal rating included in the response.
// ─────────────────────────────────────────────────────────────────────────────

const express          = require('express');
const movieController  = require('../controllers/movieController');
const { optionalAuth } = require('../middleware/authMiddleware'); // Attaches user if token present

const router = express.Router();

router.get('/',        movieController.getAllMovies);                   // All movies
router.get('/search',  movieController.searchMovies);                  // OMDB search
router.get('/:omdbId', optionalAuth, movieController.getMovieDetail);  // Single movie (optional login)

module.exports = router;
