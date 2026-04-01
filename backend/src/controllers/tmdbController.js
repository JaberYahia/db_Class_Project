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

module.exports = { getUpcoming, getTrailer };
