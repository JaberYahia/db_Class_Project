const reviewRepo = require('../repositories/reviewRepo');
const movieRepo  = require('../repositories/movieRepo');

const MAX_COMMENT_LENGTH = 2000;

// GET /api/reviews/:movieId
// Returns all reviews for a movie. Public — no auth needed.
async function getReviews(req, res) {
  try {
    const movie = await movieRepo.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    const reviews = await reviewRepo.getReviewsByMovie(movie.id);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
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

    const trimmed = comment.trim();
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` });
    }

    // Verify the movie exists so we return a clean 404 instead of a raw DB error
    const movie = await movieRepo.findById(movie_id);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    await reviewRepo.upsertReview({ user_id: req.user.id, movie_id, comment: trimmed });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// DELETE /api/reviews/:movieId
// Delete the logged-in user's review for a movie. Requires auth.
async function deleteReview(req, res) {
  try {
    const movie = await movieRepo.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    const deleted = await reviewRepo.deleteReview({ user_id: req.user.id, movie_id: movie.id });
    if (!deleted) return res.status(404).json({ error: 'Review not found.' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /api/reviews/me
// Returns all reviews written by the current user with movie info. Auth required.
async function getMyReviews(req, res) {
  try {
    const reviews = await reviewRepo.getReviewsByUser(req.user.id);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getReviews, getMyReviews, submitReview, deleteReview };
