const recommendationService = require('../services/recommendationService');

async function getRecommendations(req, res) {
  try {
    const recs = await recommendationService.getRecommendations(req.user.id);
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getRecommendations };
