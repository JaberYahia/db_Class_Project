// repositories/userActionRepo.js — Watched / Liked / Watchlist queries

const pool = require('../config/db');

// ── Generic helpers ──────────────────────────────────────────────────────────

// Check if a row exists in any of the three action tables
async function has(table, user_id, movie_id) {
  const [rows] = await pool.query(
    `SELECT 1 FROM ${table} WHERE user_id = ? AND movie_id = ? LIMIT 1`,
    [user_id, movie_id]
  );
  return rows.length > 0;
}

// Insert a row (silently ignore duplicate key errors)
async function add(table, user_id, movie_id) {
  await pool.query(
    `INSERT IGNORE INTO ${table} (user_id, movie_id) VALUES (?, ?)`,
    [user_id, movie_id]
  );
}

// Remove a row
async function remove(table, user_id, movie_id) {
  await pool.query(
    `DELETE FROM ${table} WHERE user_id = ? AND movie_id = ?`,
    [user_id, movie_id]
  );
}

// Toggle: add if absent, remove if present. Returns new active state.
async function toggle(table, user_id, movie_id) {
  const exists = await has(table, user_id, movie_id);
  if (exists) {
    await remove(table, user_id, movie_id);
    return false;
  }
  await add(table, user_id, movie_id);
  return true;
}

// Fetch all movies a user has in a given action table, newest first
async function getMoviesFor(table, user_id) {
  const [rows] = await pool.query(
    `SELECT a.created_at, m.id AS movie_id, m.omdb_id, m.title, m.genre, m.year, m.poster_url
     FROM ${table} a
     JOIN movies m ON a.movie_id = m.id
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC`,
    [user_id]
  );
  return rows;
}

// ── Named exports for each action type ──────────────────────────────────────

// Returns { watched, liked, watchlisted } booleans for one user + movie
async function getMovieActions(user_id, movie_id) {
  const [watched, liked, watchlisted] = await Promise.all([
    has('user_watched',   user_id, movie_id),
    has('user_likes',     user_id, movie_id),
    has('user_watchlist', user_id, movie_id),
  ]);
  return { watched, liked, watchlisted };
}

const toggleWatched   = (uid, mid) => toggle('user_watched',   uid, mid);
const toggleLiked     = (uid, mid) => toggle('user_likes',     uid, mid);
const toggleWatchlist = (uid, mid) => toggle('user_watchlist', uid, mid);

const getWatched   = (uid) => getMoviesFor('user_watched',   uid);
const getLiked     = (uid) => getMoviesFor('user_likes',     uid);
const getWatchlist = (uid) => getMoviesFor('user_watchlist', uid);

module.exports = {
  getMovieActions,
  toggleWatched, toggleLiked, toggleWatchlist,
  getWatched, getLiked, getWatchlist,
};
