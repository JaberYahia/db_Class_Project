const axios       = require('axios');
const movieRepo   = require('../repositories/movieRepo');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w300';

// Returns up to 20 upcoming movies from TMDB
async function getUpcoming() {
  const key = process.env.TMDB_API_KEY;
  if (!key || key === 'your_tmdb_api_key_here') return [];

  const { data } = await axios.get(`${TMDB_BASE}/movie/upcoming`, {
    params: { api_key: key, language: 'en-US', page: 1 },
  });

  return data.results.slice(0, 20).map((m) => ({
    tmdb_id:      m.id,
    title:        m.title,
    release_date: m.release_date,
    overview:     m.overview,
    poster_url:   m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
  }));
}

// Looks up a movie in the DB by omdbId, then searches TMDB for its YouTube trailer key
async function getTrailerKey(omdbId) {
  const key = process.env.TMDB_API_KEY;
  if (!key || key === 'your_tmdb_api_key_here') return null;

  // Get the movie's title + year from our DB so we can search TMDB
  const movie = await movieRepo.findByOmdbId(omdbId);
  if (!movie) return null;

  // Search TMDB by title + year
  const search = await axios.get(`${TMDB_BASE}/search/movie`, {
    params: { api_key: key, query: movie.title, year: movie.year, language: 'en-US' },
  });

  const tmdbMovie = search.data.results[0];
  if (!tmdbMovie) return null;

  // Fetch video list for that TMDB movie
  const videos = await axios.get(`${TMDB_BASE}/movie/${tmdbMovie.id}/videos`, {
    params: { api_key: key },
  });

  // Prefer an official YouTube trailer; fall back to any YouTube video
  const trailer =
    videos.data.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos.data.results.find((v) => v.site === 'YouTube');

  return trailer ? trailer.key : null;
}

module.exports = { getUpcoming, getTrailerKey };
