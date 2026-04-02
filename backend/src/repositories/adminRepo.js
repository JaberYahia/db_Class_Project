// ─────────────────────────────────────────────────────────────────────────────
// repositories/adminRepo.js — Database queries for admin moderation features
//
// Used by: adminController (dashboard actions), authMiddleware (ban check)
// ─────────────────────────────────────────────────────────────────────────────

const pool = require('../config/db');

// ─── Ban Checks ───────────────────────────────────────────────────────────────

// Look up an active ban for a given user.
// "Active" means: no expiry (permanent ban) OR expiry is in the future.
// Called by authMiddleware on every authenticated request.
async function getActiveBan(user_id) {
  const [rows] = await pool.query(
    `SELECT id, type, reason, expires_at
     FROM user_bans
     WHERE user_id = ?
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [user_id]
  );
  return rows[0] || null;
}

// ─── Review Moderation ────────────────────────────────────────────────────────

// Fetch every review across all movies — admin overview table.
// Joined with users and movies so the dashboard can show context without extra calls.
async function getAllReviews() {
  const [rows] = await pool.query(`
    SELECT r.id, r.comment, r.rating, r.created_at,
           u.id AS user_id, u.username,
           m.id AS movie_id, m.title AS movie_title, m.omdb_id
    FROM reviews r
    JOIN users  u ON r.user_id  = u.id
    JOIN movies m ON r.movie_id = m.id
    ORDER BY r.created_at DESC
  `);
  return rows;
}

// Hard-delete any review by its primary key ID.
// Only admins can call this — regular users can only delete their own review
// via the /api/reviews endpoint.
async function deleteReviewById(reviewId) {
  await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
}

// ─── User Management ─────────────────────────────────────────────────────────

// Fetch all users with their current ban status (if any).
// LEFT JOIN keeps users who are not banned — their ban columns will be NULL.
// The WHERE clause on the join filters out expired bans so the status is live.
async function getAllUsers() {
  const [rows] = await pool.query(`
    SELECT u.id, u.username, u.email, u.role, u.created_at,
           b.type       AS ban_type,
           b.reason     AS ban_reason,
           b.expires_at AS ban_expires_at
    FROM users u
    LEFT JOIN user_bans b
      ON u.id = b.user_id
     AND (b.expires_at IS NULL OR b.expires_at > NOW())
    ORDER BY u.created_at DESC
  `);
  return rows;
}

// ─── Ban CRUD ─────────────────────────────────────────────────────────────────

// Issue a ban or timeout.
// ON DUPLICATE KEY UPDATE handles the case where the user already has a ban
// record — it replaces it with the new one (e.g. converting timeout → ban).
async function banUser({ user_id, admin_id, type, reason, expires_at }) {
  await pool.query(
    `INSERT INTO user_bans (user_id, admin_id, type, reason, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       admin_id   = VALUES(admin_id),
       type       = VALUES(type),
       reason     = VALUES(reason),
       expires_at = VALUES(expires_at),
       created_at = CURRENT_TIMESTAMP`,
    [user_id, admin_id, type, reason || null, expires_at || null]
  );
}

// Remove an active ban — the user's account becomes accessible again immediately.
async function unbanUser(user_id) {
  await pool.query('DELETE FROM user_bans WHERE user_id = ?', [user_id]);
}

module.exports = { getActiveBan, getAllReviews, deleteReviewById, getAllUsers, banUser, unbanUser };
