const tmdbService = require('../services/tmdbService');

async function getUpcoming(req, res) {
  try {
    const movies = await tmdbService.getUpcoming();
    res.json(movies);
  } catch {
    res.json([]); // fail silently — upcoming is non-critical
  }
}

async function getTrailer(req, res) {
  try {
    const key = await tmdbService.getTrailerKey(req.params.omdbId);
    if (!key) return res.status(404).json({ error: 'No trailer found.' });
    res.json({ key });
  } catch {
    res.status(500).json({ error: 'Could not fetch trailer.' });
  }
}

async function getNowPlaying(req, res) {
  try {
    const movies = await tmdbService.getNowPlaying();
    res.json(movies);
  } catch {
    res.json([]);
  }
}

// GET /api/tmdb/resolve/:tmdbId
// Looks up the OMDB record for a TMDB movie, saves it to our DB, returns omdb_id
async function resolveMovie(req, res) {
  try {
    const omdbId = await tmdbService.resolveToOmdbId(req.params.tmdbId);
    if (!omdbId) return res.status(404).json({ error: 'Could not resolve movie.' });
    res.json({ omdb_id: omdbId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getUpcoming, getNowPlaying, getTrailer, resolveMovie };
