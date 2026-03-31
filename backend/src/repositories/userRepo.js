// ─────────────────────────────────────────────────────────────────────────────
// repositories/userRepo.js — All database queries for the users table
//
// The "repository" pattern keeps raw SQL out of the business logic layer.
// Services call these functions; they don't write SQL themselves.
// ─────────────────────────────────────────────────────────────────────────────

const pool = require('../config/db'); // Shared MySQL connection pool

// Look up a user by their email address.
// Used during login to fetch the stored password hash for comparison.
async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null; // Return the first match, or null if not found
}

// Look up a user by their username.
// Used during signup to check that the username isn't already taken.
async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

// Look up a user by their numeric ID.
// Note: password_hash is intentionally excluded — never expose it to the frontend.
async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

// Insert a new user row into the database.
// The password is already hashed by authService before it reaches here.
// Returns the new user's auto-generated ID along with their username and email.
async function create({ username, email, password_hash }) {
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, password_hash]
  );
  return { id: result.insertId, username, email }; // result.insertId is the new row's primary key
}

module.exports = { findByEmail, findByUsername, findById, create };
