// controllers/userActionController.js — Watched / Liked / Watchlist handlers

const repo     = require('../repositories/userActionRepo');
const movieRepo = require('../repositories/movieRepo');

// GET /api/actions/movie/:movieId
// Returns { watched, liked, watchlisted } for the current user + movie
async function getMovieActions(req, res) {
  try {
    const movie = await movieRepo.findByOmdbId(req.params.movieId);
    if (!movie) return res.json({ watched: false, liked: false, watchlisted: false });
    const actions = await repo.getMovieActions(req.user.id, movie.id);
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/actions/watched/:movieId  (toggle)
async function toggleWatched(req, res) {
  try {
    const movie = await movieRepo.findByOmdbId(req.params.movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    const active = await repo.toggleWatched(req.user.id, movie.id);
    res.json({ active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/actions/liked/:movieId  (toggle)
async function toggleLiked(req, res) {
  try {
    const movie = await movieRepo.findByOmdbId(req.params.movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    const active = await repo.toggleLiked(req.user.id, movie.id);
    res.json({ active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/actions/watchlist/:movieId  (toggle)
async function toggleWatchlist(req, res) {
  try {
    const movie = await movieRepo.findByOmdbId(req.params.movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    const active = await repo.toggleWatchlist(req.user.id, movie.id);
    res.json({ active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/actions/watched   — all watched movies for current user
async function getWatched(req, res) {
  try {
    res.json(await repo.getWatched(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/actions/liked   — all liked movies for current user
async function getLiked(req, res) {
  try {
    res.json(await repo.getLiked(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/actions/watchlist   — user's watchlist
async function getWatchlist(req, res) {
  try {
    res.json(await repo.getWatchlist(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMovieActions,
  toggleWatched, toggleLiked, toggleWatchlist,
  getWatched, getLiked, getWatchlist,
};
