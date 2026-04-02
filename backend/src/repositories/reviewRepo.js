const pool = require('../config/db');

// Insert or update a review — one review per user per movie
async function upsertReview({ user_id, movie_id, comment }) {
  await pool.query(
    `INSERT INTO reviews (user_id, movie_id, comment)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE comment = VALUES(comment), updated_at = CURRENT_TIMESTAMP`,
    [user_id, movie_id, comment]
  );
}

// Get all reviews for a movie, joined with the reviewer's username and their rating (if any)
async function getReviewsByMovie(movie_id) {
  const [rows] = await pool.query(
    `SELECT rv.id, rv.comment, rv.created_at, rv.updated_at,
            u.username,
            ra.rating
     FROM reviews rv
     JOIN users u ON rv.user_id = u.id
     LEFT JOIN ratings ra ON ra.user_id = rv.user_id AND ra.movie_id = rv.movie_id
     WHERE rv.movie_id = ?
     ORDER BY rv.created_at DESC`,
    [movie_id]
  );
  return rows;
}

// Delete a review — only the owner can do this (enforced in controller).
// Returns true if a row was deleted, false if no matching review existed.
async function deleteReview({ user_id, movie_id }) {
  const [result] = await pool.query(
    'DELETE FROM reviews WHERE user_id = ? AND movie_id = ?',
    [user_id, movie_id]
  );
  return result.affectedRows > 0;
}

// Get all reviews written by a specific user, joined with movie info and their rating
async function getReviewsByUser(user_id) {
  const [rows] = await pool.query(
    `SELECT rv.id, rv.comment, rv.created_at,
            m.omdb_id, m.title, m.poster_url, m.year,
            ra.rating
     FROM reviews rv
     JOIN movies m ON rv.movie_id = m.id
     LEFT JOIN ratings ra ON ra.user_id = rv.user_id AND ra.movie_id = rv.movie_id
     WHERE rv.user_id = ?
     ORDER BY rv.created_at DESC`,
    [user_id]
  );
  return rows;
}

module.exports = { upsertReview, getReviewsByMovie, getReviewsByUser, deleteReview };
