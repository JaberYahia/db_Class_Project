const pool = require('../config/db');

async function upsertRating({ user_id, movie_id, rating }) {
  await pool.query(
    `INSERT INTO ratings (user_id, movie_id, rating)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = CURRENT_TIMESTAMP`,
    [user_id, movie_id, rating]
  );
}

async function getRatingsByUser(user_id) {
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.updated_at,
            m.id AS movie_id, m.title, m.genre, m.year, m.poster_url
     FROM ratings r
     JOIN movies m ON r.movie_id = m.id
     WHERE r.user_id = ?
     ORDER BY r.updated_at DESC`,
    [user_id]
  );
  return rows;
}

async function getUserRatingForMovie(user_id, movie_id) {
  const [rows] = await pool.query(
    'SELECT rating FROM ratings WHERE user_id = ? AND movie_id = ?',
    [user_id, movie_id]
  );
  return rows[0] || null;
}

// Returns all ratings as { user_id, movie_id, rating } for collaborative filtering
async function getAllRatings() {
  const [rows] = await pool.query('SELECT user_id, movie_id, rating FROM ratings');
  return rows;
}

module.exports = { upsertRating, getRatingsByUser, getUserRatingForMovie, getAllRatings };
