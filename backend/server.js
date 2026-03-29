require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes           = require('./src/routes/auth');
const movieRoutes          = require('./src/routes/movies');
const ratingRoutes         = require('./src/routes/ratings');
const recommendationRoutes = require('./src/routes/recommendations');

const app  = express();
const PORT = process.env.PORT || 5001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/movies',          movieRoutes);
app.use('/api/ratings',         ratingRoutes);
app.use('/api/recommendations', recommendationRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
