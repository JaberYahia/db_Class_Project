// ─────────────────────────────────────────────────────────────────────────────
// services/recommendationService.js — Collaborative filtering engine
//
// ALGORITHM OVERVIEW (User-Based Collaborative Filtering):
//
//   1. Load every rating from every user in the database.
//   2. Represent each user as a "vector" — a map of { movie_id: rating }.
//   3. Measure how similar the current user is to every other user using
//      cosine similarity (angle between two rating vectors).
//   4. Take the top 5 most similar users ("neighbours").
//   5. For each movie those neighbours have rated that the current user hasn't
//      seen yet, compute a weighted average rating using similarity as the weight.
//   6. Sort by predicted rating and return the top results.
//
//   If the user hasn't rated enough movies yet, fall back to the overall
//   top-rated movies they haven't seen.
// ─────────────────────────────────────────────────────────────────────────────

const ratingRepo = require('../repositories/ratingRepo');
const movieRepo  = require('../repositories/movieRepo');

// ─── Cosine Similarity ────────────────────────────────────────────────────────
//
// Cosine similarity measures the angle between two vectors in multi-dimensional
// space. A score of 1.0 means identical taste, 0 means no overlap, -1 means
// completely opposite preferences.
//
// Formula:  similarity = (A · B) / (|A| × |B|)
//   A · B  = dot product (sum of matching ratings multiplied together)
//   |A|    = magnitude of vector A (square root of sum of squared values)
//
// We treat movie IDs as dimensions and ratings as values along each axis.
// Two users who both rated the same movies highly will point in similar directions.

function cosineSimilarity(vecA, vecB) {
  // Union of all movie IDs rated by either user
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, normA = 0, normB = 0;

  for (const key of keys) {
    const a = vecA[key] || 0; // Rating from user A (0 if they didn't rate this movie)
    const b = vecB[key] || 0; // Rating from user B (0 if they didn't rate this movie)
    dot   += a * b;    // Contribution to the dot product
    normA += a * a;    // Squared component for user A's magnitude
    normB += b * b;    // Squared component for user B's magnitude
  }

  // If either user has no ratings, similarity is undefined — return 0
  if (normA === 0 || normB === 0) return 0;

  // Final formula: dot product divided by the product of magnitudes
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Main Recommendation Function ────────────────────────────────────────────

async function getRecommendations(userId, limit = 10) {
  // Step 1: Load all ratings from the database
  const allRatings = await ratingRepo.getAllRatings();

  // Step 2: Build a map of { userId → { movieId → rating } }
  // This is the "user-movie rating matrix" used by collaborative filtering
  const userVectors = {};
  for (const { user_id, movie_id, rating } of allRatings) {
    if (!userVectors[user_id]) userVectors[user_id] = {};
    userVectors[user_id][movie_id] = rating; // e.g. { 42: 9, 17: 7, 88: 5 }
  }

  const currentUserVector = userVectors[userId];

  // Step 3: Not enough data — fall back to top-rated movies
  // We need at least 2 ratings to produce meaningful similarity scores
  if (!currentUserVector || Object.keys(currentUserVector).length < 2) {
    return getTopRatedFallback(userId, limit);
  }

  // Step 4: Compute cosine similarity between the current user and every other user
  const similarities = [];
  for (const [otherUserId, otherVector] of Object.entries(userVectors)) {
    if (Number(otherUserId) === userId) continue; // Skip comparing the user to themselves

    const score = cosineSimilarity(currentUserVector, otherVector);
    if (score > 0) { // Only include users with at least some taste overlap
      similarities.push({ userId: Number(otherUserId), score });
    }
  }

  // Step 5: Sort by similarity descending, keep the top 5 neighbours
  similarities.sort((a, b) => b.score - a.score);
  const neighbours = similarities.slice(0, 5);

  // No similar users found — fall back
  if (neighbours.length === 0) {
    return getTopRatedFallback(userId, limit);
  }

  // Movies the current user has already rated — we won't recommend these
  const seenMovies = new Set(Object.keys(currentUserVector).map(Number));

  // Step 6: For each unseen movie in the neighbours' history,
  // accumulate a weighted rating score (similarity × rating)
  const candidateScores  = {}; // { movieId: weighted sum of ratings }
  const candidateWeights = {}; // { movieId: sum of similarity weights }

  for (const { userId: neighbourId, score: similarity } of neighbours) {
    const neighbourVector = userVectors[neighbourId];
    for (const [movieId, rating] of Object.entries(neighbourVector)) {
      const mid = Number(movieId);
      if (seenMovies.has(mid)) continue; // Skip movies the user already rated

      // Accumulate: more similar neighbours have higher weight
      candidateScores[mid]  = (candidateScores[mid]  || 0) + similarity * rating;
      candidateWeights[mid] = (candidateWeights[mid] || 0) + similarity;
    }
  }

  // Step 7: Normalise each candidate score to get a predicted rating (weighted average)
  // Then sort by predicted rating and take the top N
  const predictions = Object.entries(candidateScores)
    .map(([movieId, weightedSum]) => ({
      movie_id:         Number(movieId),
      predicted_rating: weightedSum / candidateWeights[movieId], // weighted average
    }))
    .sort((a, b) => b.predicted_rating - a.predicted_rating) // highest predicted first
    .slice(0, limit);

  if (predictions.length === 0) {
    return getTopRatedFallback(userId, limit);
  }

  // Step 8: Fetch all predicted movies in a single query (avoids N+1 sequential lookups)
  const movieIds = predictions.map((p) => p.movie_id);
  const movieMap = await movieRepo.findByIds(movieIds);

  const results = predictions
    .filter(({ movie_id }) => movieMap.has(movie_id))
    .map(({ movie_id, predicted_rating }) => ({
      ...movieMap.get(movie_id),
      predicted_rating: Math.round(predicted_rating * 10) / 10,
    }));

  return results;
}

// ─── Fallback: Top Rated ──────────────────────────────────────────────────────

// If the algorithm can't produce personalised results (new user, no neighbours),
// return the highest community-rated movies the user hasn't rated yet.
async function getTopRatedFallback(userId, limit) {
  const userRatings = await ratingRepo.getRatingsByUser(userId);
  const seenIds = new Set(userRatings.map((r) => r.movie_id)); // IDs already rated by this user

  const topRated = await movieRepo.getAverageRatings();

  return topRated
    .filter((m) => !seenIds.has(m.id) && m.rating_count > 0) // Only rated movies the user hasn't seen
    .slice(0, limit);
}

module.exports = { getRecommendations };
