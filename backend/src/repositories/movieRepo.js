const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, omdb_id, title, year, genre, poster_url FROM movies ORDER BY title'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, omdb_id, title, year, genre, poster_url FROM movies WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function findByOmdbId(omdb_id) {
  const [rows] = await pool.query(
    'SELECT * FROM movies WHERE omdb_id = ?',
    [omdb_id]
  );
  return rows[0] || null;
}

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
  return findByOmdbId(omdb_id);
}

async function getAverageRatings() {
  const [rows] = await pool.query(`
    SELECT
      m.id,
      m.omdb_id,
      m.title,
      m.genre,
      m.year,
      m.poster_url,
      ROUND(AVG(r.rating), 1) AS avg_rating,
      COUNT(r.id)             AS rating_count
    FROM movies m
    LEFT JOIN ratings r ON m.id = r.movie_id
    GROUP BY m.id
    ORDER BY avg_rating DESC
  `);
  return rows;
}

module.exports = { findAll, findById, findByOmdbId, upsert, getAverageRatings };
