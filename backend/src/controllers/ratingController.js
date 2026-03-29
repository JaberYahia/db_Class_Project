const ratingRepo = require('../repositories/ratingRepo');
const movieRepo  = require('../repositories/movieRepo');

async function submitRating(req, res) {
  try {
    const { movie_id, rating } = req.body;
    const user_id = req.user.id;

    if (!movie_id || rating === undefined) {
      return res.status(400).json({ error: 'movie_id and rating are required.' });
    }
    if (rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10.' });
    }

    const movie = await movieRepo.findById(movie_id);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    await ratingRepo.upsertRating({ user_id, movie_id, rating });
    res.json({ message: 'Rating saved.', movie_id, rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMyRatings(req, res) {
  try {
    const ratings = await ratingRepo.getRatingsByUser(req.user.id);
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { submitRating, getMyRatings };
