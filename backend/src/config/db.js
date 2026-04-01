// ─────────────────────────────────────────────────────────────────────────────
// config/db.js — MySQL connection pool
//
// Why a pool instead of a single connection?
//   A pool keeps several open connections ready and hands them out on demand.
//   This is much faster than opening a fresh TCP connection for every query,
//   and it handles concurrent requests without queuing everything behind one
//   shared socket.
// ─────────────────────────────────────────────────────────────────────────────

const mysql = require('mysql2/promise'); // Promise-based MySQL client (supports async/await)
// dotenv is loaded once in server.js before any other require — no need to call it again here

// Create a reusable pool of up to 10 database connections
const pool = mysql.createPool({
  host:     process.env.DB_HOST,     // MySQL server address (e.g. "localhost")
  user:     process.env.DB_USER,     // MySQL username
  password: process.env.DB_PASSWORD, // MySQL password
  database: process.env.DB_NAME,     // Which database to use (movie_rating_app)

  waitForConnections: true, // Queue requests when all connections are busy
  connectionLimit: 10,      // Maximum simultaneous open connections
});

// Export the pool so any repository file can import it and run queries
module.exports = pool;
