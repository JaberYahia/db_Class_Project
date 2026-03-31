// ─────────────────────────────────────────────────────────────────────────────
// repositories/ratingRepo.js — All database queries for the ratings table
//
// Each row represents one user's rating of one movie (1-10 scale).
// The unique key (user_id, movie_id) ensures a user can only have one rating
// per movie — updating it simply overwrites the previous value.
// ─────────────────────────────────────────────────────────────────────────────

const pool = require('../config/db'); // Shared MySQL connection pool

// Save a new rating or update an existing one.
// ON DUPLICATE KEY UPDATE handles the case where the user has already rated
// this movie — it replaces the old rating instead of throwing an error.
async function upsertRating({ user_id, movie_id, rating }) {
  await pool.query(
    `INSERT INTO ratings (user_id, movie_id, rating)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = CURRENT_TIMESTAMP`,
    [user_id, movie_id, rating]
  );
}

// Fetch all ratings submitted by a specific user, joined with movie details.
// Used on the Profile page to show the user's rating history.
// Results are ordered newest first so the most recent ratings appear at the top.
async function getRatingsByUser(user_id) {
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.updated_at,
            m.id AS movie_id, m.omdb_id, m.title, m.genre, m.year, m.poster_url
     FROM ratings r
     JOIN movies m ON r.movie_id = m.id
     WHERE r.user_id = ?
     ORDER BY r.updated_at DESC`,
    [user_id]
  );
  return rows;
}

// Fetch a single user's rating for one specific movie.
// Used on the movie detail page to pre-fill the star widget with the saved value.
async function getUserRatingForMovie(user_id, movie_id) {
  const [rows] = await pool.query(
    'SELECT rating FROM ratings WHERE user_id = ? AND movie_id = ?',
    [user_id, movie_id]
  );
  return rows[0] || null;
}

// Fetch every rating from every user as a flat list.
// Used by the recommendation engine to build the user-movie rating matrix
// for collaborative filtering (cosine similarity calculation).
async function getAllRatings() {
  const [rows] = await pool.query('SELECT user_id, movie_id, rating FROM ratings');
  return rows;
}

module.exports = { upsertRating, getRatingsByUser, getUserRatingForMovie, getAllRatings };
