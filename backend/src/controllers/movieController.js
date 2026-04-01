// ─────────────────────────────────────────────────────────────────────────────
// controllers/movieController.js — HTTP handlers for movie routes
// ─────────────────────────────────────────────────────────────────────────────

const movieService = require('../services/movieService');
const ratingRepo   = require('../repositories/ratingRepo');

// GET /api/movies
// Returns all movies stored in the local database, each with its community
// average rating and total rating count.
async function getAllMovies(req, res) {
  try {
    const movies = await movieService.getAllMovies();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/movies/search?q=<keyword>
// Proxies a search request to the OMDB API and returns matching movies.
// The 'q' query parameter is the search term (e.g. ?q=inception).
async function searchMovies(req, res) {
  try {
    const { q } = req.query; // Read the search term from the URL query string
    if (!q) return res.status(400).json({ error: 'Query parameter q is required.' });

    const results = await movieService.searchOMDB(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/movies/:omdbId
// Returns full movie details for a single film by its OMDB/IMDB ID.
// Uses optionalAuth middleware — if the user is logged in, we also attach
// their personal rating so the star widget is pre-filled on the detail page.
async function getMovieDetail(req, res) {
  try {
    const movie = await movieService.getMovieDetail(req.params.omdbId); // URL param from /movie/:omdbId
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    // If a valid JWT was sent, req.user was populated by optionalAuth middleware
    let user_rating = null;
    if (req.user) {
      const ratingRow = await ratingRepo.getUserRatingForMovie(req.user.id, movie.id);
      user_rating = ratingRow ? ratingRow.rating : null;
    }

    res.json({ ...movie, user_rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllMovies, searchMovies, getMovieDetail };
