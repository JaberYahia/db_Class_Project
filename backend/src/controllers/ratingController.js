// ─────────────────────────────────────────────────────────────────────────────
// controllers/ratingController.js — HTTP handlers for rating routes
//
// All routes here require authentication (enforced in ratings.js route file).
// req.user is guaranteed to be populated by the authMiddleware before these
// handlers are called.
// ─────────────────────────────────────────────────────────────────────────────

const ratingRepo = require('../repositories/ratingRepo');
const movieRepo  = require('../repositories/movieRepo');

// POST /api/ratings
// Saves or updates the current user's rating for a movie.
// If the user already rated this movie, the old rating is replaced (upsert).
async function submitRating(req, res) {
  try {
    const { movie_id, rating } = req.body;
    const user_id = req.user.id; // Injected by authMiddleware — the logged-in user's ID

    // Both fields are required
    if (!movie_id || rating === undefined) {
      return res.status(400).json({ error: 'movie_id and rating are required.' });
    }

    // Enforce the 1-10 rating scale on the server side (in addition to the DB constraint)
    if (rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10.' });
    }

    // Make sure the movie actually exists in our database before accepting the rating
    const movie = await movieRepo.findById(movie_id);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    // Save the rating — will insert or update depending on whether one already exists
    await ratingRepo.upsertRating({ user_id, movie_id, rating });

    res.json({ message: 'Rating saved.', movie_id, rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/ratings/me
// Returns all ratings submitted by the currently logged-in user.
// Used on the Profile page to display the user's rating history.
async function getMyRatings(req, res) {
  try {
    const ratings = await ratingRepo.getRatingsByUser(req.user.id);
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { submitRating, getMyRatings };
