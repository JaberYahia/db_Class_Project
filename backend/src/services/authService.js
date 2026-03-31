// ─────────────────────────────────────────────────────────────────────────────
// services/authService.js — Business logic for user authentication
//
// This layer sits between the controller (HTTP) and the repository (database).
// It validates business rules (e.g. duplicate email) and handles the crypto
// work (bcrypt hashing, JWT signing) so the controller stays thin.
// ─────────────────────────────────────────────────────────────────────────────

const bcrypt   = require('bcrypt');    // Password hashing library
const jwt      = require('jsonwebtoken'); // JSON Web Token library
const userRepo = require('../repositories/userRepo');

// ─── Signup ───────────────────────────────────────────────────────────────────

async function signup({ username, email, password }) {
  // Reject if the email is already registered
  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) throw new Error('Email already in use.');

  // Reject if the username is already taken
  const existingUsername = await userRepo.findByUsername(username);
  if (existingUsername) throw new Error('Username already taken.');

  // Hash the plain-text password with bcrypt.
  // 10 is the "cost factor" — higher = slower to crack but also slower to compute.
  // Never store plain-text passwords in a database.
  const password_hash = await bcrypt.hash(password, 10);

  // Insert the new user and get back their ID
  const user = await userRepo.create({ username, email, password_hash });

  // Issue a JWT so the user is logged in immediately after signup
  const token = generateToken(user);
  return { user, token };
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function login({ email, password }) {
  // Find the user record — use a generic error message to avoid leaking
  // whether it was the email or password that was wrong (security best practice)
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Invalid email or password.');

  // bcrypt.compare hashes the submitted password and checks it against the stored hash.
  // We can never "decrypt" the stored hash — bcrypt only goes one direction.
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid email or password.');

  // Credentials are correct — issue a JWT token
  const token = generateToken(user);
  return { user: { id: user.id, username: user.username, email: user.email }, token };
}

// ─── Token Generator ─────────────────────────────────────────────────────────

// Signs a JWT containing the user's ID, username, and email.
// The token is valid for 7 days before the client must log in again.
// JWT_SECRET is a long random string in .env — keeping it secret means
// only our server can issue valid tokens.
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email }, // payload
    process.env.JWT_SECRET, // signing secret
    { expiresIn: '7d' }     // token expires in 7 days
  );
}

module.exports = { signup, login };
