// ─────────────────────────────────────────────────────────────────────────────
// server.js — Entry point for the MovieRank Express API
//
// Responsibilities:
//   • Loads environment variables from .env
//   • Creates the Express app and registers global middleware
//   • Mounts all route groups under /api/...
//   • Starts the HTTP server on the configured port
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config(); // Load DB credentials, JWT secret, and OMDB key from .env
const express = require('express');
const cors    = require('cors');

// Import the four route modules — each handles a distinct feature area
const authRoutes           = require('./src/routes/auth');
const movieRoutes          = require('./src/routes/movies');
const ratingRoutes         = require('./src/routes/ratings');
const recommendationRoutes = require('./src/routes/recommendations');
const reviewRoutes         = require('./src/routes/reviews');

const app  = express();
const PORT = process.env.PORT || 5001; // Default to 5001 if PORT is not set in .env

// ─── Global Middleware ────────────────────────────────────────────────────────

// Allow requests from the React frontend running at localhost:3000
app.use(cors({ origin: 'http://localhost:3000' }));

// Parse incoming JSON request bodies so controllers can read req.body
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────

// POST /api/auth/signup  → register a new user
// POST /api/auth/login   → authenticate and return a JWT token
app.use('/api/auth', authRoutes);

// GET  /api/movies        → all movies with average ratings
// GET  /api/movies/search → search OMDB by keyword
// GET  /api/movies/:id    → single movie detail (plot, cast, director)
app.use('/api/movies', movieRoutes);

// POST /api/ratings       → save or update a rating (auth required)
// GET  /api/ratings/me    → fetch the current user's rating history
app.use('/api/ratings', ratingRoutes);

// GET  /api/recommendations → personalized AI picks (auth required)
app.use('/api/recommendations', recommendationRoutes);

// GET    /api/reviews/:movieId → reviews for a movie (public)
// POST   /api/reviews          → submit/update a review (auth required)
// DELETE /api/reviews/:movieId → delete own review (auth required)
app.use('/api/reviews', reviewRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────

// Simple endpoint to confirm the server is up — useful for debugging
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Global Error Handler ─────────────────────────────────────────────────────

// Catches any unhandled errors thrown inside route handlers and returns a
// clean 500 response instead of crashing the server
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
