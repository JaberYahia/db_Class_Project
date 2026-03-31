// ─────────────────────────────────────────────────────────────────────────────
// repositories/movieRepo.js — All database queries for the movies table
//
// Movies are stored locally as a cache of OMDB data.
// The upsert pattern (INSERT ... ON DUPLICATE KEY UPDATE) lets us refresh
// a movie's info without duplicating rows.
// ─────────────────────────────────────────────────────────────────────────────

const pool = require('../config/db'); // Shared MySQL connection pool

// Fetch every movie — used for the home page and genres page.
// Returns only display fields; full plot/cast is fetched on demand from OMDB.
async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, omdb_id, title, year, genre, poster_url FROM movies ORDER BY title'
  );
  return rows;
}

// Fetch a single movie by its local database ID.
// Used after an upsert to return the saved record.
async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, omdb_id, title, year, genre, poster_url FROM movies WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

// Fetch a single movie by its OMDB/IMDB ID (e.g. "tt0111161").
// Used to check the local cache before hitting the OMDB API.
async function findByOmdbId(omdb_id) {
  const [rows] = await pool.query(
    'SELECT * FROM movies WHERE omdb_id = ?',
    [omdb_id]
  );
  return rows[0] || null;
}

// Insert a new movie or update an existing one.
// ON DUPLICATE KEY UPDATE means: if omdb_id already exists, refresh the title,
// genre, and poster_url instead of throwing a duplicate-key error.
async function upsert({ omdb_id, title, year, genre, poster_url }) {
  await pool.query(
    `INSERT INTO movies (omdb_id, title, year, genre, poster_url)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title      = VALUES(title),
       genre      = VALUES(genre),
       poster_url = VALUES(poster_url)`,
    [omdb_id, title, year, genre, poster_url]
  );
  return findByOmdbId(omdb_id); // Return the final saved record
}

// Fetch all movies joined with their average community rating.
// LEFT JOIN ensures movies with zero ratings are still included.
// Used for the home page rows and as a fallback in the recommendation engine.
async function getAverageRatings() {
  const [rows] = await pool.query(`
    SELECT
      m.id,
      m.omdb_id,
      m.title,
      m.genre,
      m.year,
      m.poster_url,
      ROUND(AVG(r.rating), 1) AS avg_rating,   -- community average, rounded to 1 decimal
      COUNT(r.id)             AS rating_count   -- how many users have rated this movie
    FROM movies m
    LEFT JOIN ratings r ON m.id = r.movie_id   -- LEFT JOIN keeps unrated movies
    GROUP BY m.id
    ORDER BY avg_rating DESC                    -- highest rated first
  `);
  return rows;
}

module.exports = { findAll, findById, findByOmdbId, upsert, getAverageRatings };
