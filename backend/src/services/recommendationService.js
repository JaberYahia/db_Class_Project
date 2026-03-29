const ratingRepo = require('../repositories/ratingRepo');
const movieRepo  = require('../repositories/movieRepo');

// ─── Cosine Similarity ────────────────────────────────────────────────────────
// Measures the angle between two users' rating vectors.
// Score of 1.0 = identical taste, 0 = no overlap, -1 = opposite taste.

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, normA = 0, normB = 0;

  for (const key of keys) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dot   += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Main Recommendation Function ────────────────────────────────────────────

async function getRecommendations(userId, limit = 10) {
  const allRatings = await ratingRepo.getAllRatings();

  // Build a map: { userId: { movieId: rating } }
  const userVectors = {};
  for (const { user_id, movie_id, rating } of allRatings) {
    if (!userVectors[user_id]) userVectors[user_id] = {};
    userVectors[user_id][movie_id] = rating;
  }

  const currentUserVector = userVectors[userId];

  // Not enough data to recommend
  if (!currentUserVector || Object.keys(currentUserVector).length < 2) {
    return getTopRatedFallback(userId, limit);
  }

  // Compute similarity to every other user
  const similarities = [];
  for (const [otherUserId, otherVector] of Object.entries(userVectors)) {
    if (Number(otherUserId) === userId) continue;
    const score = cosineSimilarity(currentUserVector, otherVector);
    if (score > 0) {
      similarities.push({ userId: Number(otherUserId), score });
    }
  }

  // Sort by similarity, take top 5 neighbours
  similarities.sort((a, b) => b.score - a.score);
  const neighbours = similarities.slice(0, 5);

  if (neighbours.length === 0) {
    return getTopRatedFallback(userId, limit);
  }

  // Movies the current user has already rated
  const seenMovies = new Set(Object.keys(currentUserVector).map(Number));

  // Weighted sum of neighbour ratings for unseen movies
  const candidateScores = {};
  const candidateWeights = {};

  for (const { userId: neighbourId, score: similarity } of neighbours) {
    const neighbourVector = userVectors[neighbourId];
    for (const [movieId, rating] of Object.entries(neighbourVector)) {
      const mid = Number(movieId);
      if (seenMovies.has(mid)) continue;

      candidateScores[mid]  = (candidateScores[mid]  || 0) + similarity * rating;
      candidateWeights[mid] = (candidateWeights[mid] || 0) + similarity;
    }
  }

  // Normalise to predicted rating
  const predictions = Object.entries(candidateScores)
    .map(([movieId, weightedSum]) => ({
      movie_id:         Number(movieId),
      predicted_rating: weightedSum / candidateWeights[movieId],
    }))
    .sort((a, b) => b.predicted_rating - a.predicted_rating)
    .slice(0, limit);

  if (predictions.length === 0) {
    return getTopRatedFallback(userId, limit);
  }

  // Attach movie details
  const results = [];
  for (const { movie_id, predicted_rating } of predictions) {
    const movie = await movieRepo.findById(movie_id);
    if (movie) {
      results.push({ ...movie, predicted_rating: Math.round(predicted_rating * 10) / 10 });
    }
  }

  return results;
}

// Fallback: return top-rated movies the user hasn't rated yet
async function getTopRatedFallback(userId, limit) {
  const userRatings = await ratingRepo.getRatingsByUser(userId);
  const seenIds = new Set(userRatings.map((r) => r.movie_id));

  const topRated = await movieRepo.getAverageRatings();
  return topRated
    .filter((m) => !seenIds.has(m.id) && m.rating_count > 0)
    .slice(0, limit);
}

module.exports = { getRecommendations };
