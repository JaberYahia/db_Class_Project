const movieService  = require('../services/movieService');
const ratingRepo    = require('../repositories/ratingRepo');

async function getAllMovies(req, res) {
  try {
    const movies = await movieService.getAllMovies();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function searchMovies(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required.' });
    const results = await movieService.searchOMDB(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMovieDetail(req, res) {
  try {
    const movie = await movieService.getMovieDetail(req.params.omdbId);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    // If user is logged in, attach their existing rating
    if (req.user) {
      const ratingRow = await ratingRepo.getUserRatingForMovie(req.user.id, movie.id);
      movie.user_rating = ratingRow ? ratingRow.rating : null;
    }

    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllMovies, searchMovies, getMovieDetail };
