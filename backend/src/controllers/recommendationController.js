// ─────────────────────────────────────────────────────────────────────────────
// controllers/recommendationController.js — HTTP handler for recommendation route
//
// Requires authentication — we need to know who the user is in order to
// generate personalised picks for them.
// ─────────────────────────────────────────────────────────────────────────────

const recommendationService = require('../services/recommendationService');

// GET /api/recommendations
// Runs the collaborative filtering algorithm for the current user and returns
// a list of movies they're predicted to enjoy, ordered by predicted rating.
async function getRecommendations(req, res) {
  try {
    // req.user.id is set by authMiddleware — the recommendation engine
    // uses this ID to look up the user's ratings and find similar users
    const recs = await recommendationService.getRecommendations(req.user.id);
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getRecommendations };
