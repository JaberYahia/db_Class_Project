const reviewRepo = require('../repositories/reviewRepo');
const movieRepo  = require('../repositories/movieRepo');

// GET /api/reviews/:movieId
// Returns all reviews for a movie. Public — no auth needed.
async function getReviews(req, res) {
  try {
    const movie = await movieRepo.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    const reviews = await reviewRepo.getReviewsByMovie(movie.id);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/reviews
// Submit or update a review. Requires auth.
// Body: { movie_id, comment }
async function submitReview(req, res) {
  try {
    const { movie_id, comment } = req.body;
    if (!movie_id || !comment?.trim()) {
      return res.status(400).json({ error: 'movie_id and comment are required.' });
    }
    await reviewRepo.upsertReview({ user_id: req.user.id, movie_id, comment: comment.trim() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/reviews/:movieId
// Delete the logged-in user's review for a movie. Requires auth.
async function deleteReview(req, res) {
  try {
    const movie = await movieRepo.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    await reviewRepo.deleteReview({ user_id: req.user.id, movie_id: movie.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getReviews, submitReview, deleteReview };
