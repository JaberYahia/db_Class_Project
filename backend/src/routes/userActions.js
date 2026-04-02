// routes/userActions.js — Watched / Liked / Watchlist endpoints (all auth-required)
//
// Mounted at /api/actions in server.js. Full paths:
//   GET  /api/actions/movie/:movieId  → current user's states for one movie
//   POST /api/actions/watched/:movieId   → toggle watched
//   POST /api/actions/liked/:movieId     → toggle liked
//   POST /api/actions/watchlist/:movieId → toggle watchlist
//   GET  /api/actions/watched            → full watched list
//   GET  /api/actions/liked              → full liked list
//   GET  /api/actions/watchlist          → full watchlist

const express    = require('express');
const ctrl       = require('../controllers/userActionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/movie/:movieId', ctrl.getMovieActions);

router.post('/watched/:movieId',   ctrl.toggleWatched);
router.post('/liked/:movieId',     ctrl.toggleLiked);
router.post('/watchlist/:movieId', ctrl.toggleWatchlist);

router.get('/watched',   ctrl.getWatched);
router.get('/liked',     ctrl.getLiked);
router.get('/watchlist', ctrl.getWatchlist);

module.exports = router;
