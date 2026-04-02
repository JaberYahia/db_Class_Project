const axios       = require('axios');
const movieRepo   = require('../repositories/movieRepo');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w300';

// Shared mapper for TMDB movie results
function mapMovie(m) {
  return {
    tmdb_id:      m.id,
    title:        m.title,
    release_date: m.release_date,
    overview:     m.overview,
    poster_url:   m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
  };
}

// Returns upcoming movies (future release dates only) from TMDB
async function getUpcoming() {
  const key = process.env.TMDB_API_KEY;
  if (!key || key === 'your_tmdb_api_key_here') return [];

  const { data } = await axios.get(`${TMDB_BASE}/movie/upcoming`, {
    params: { api_key: key, language: 'en-US', page: 1 },
  });

  const today = new Date().toISOString().slice(0, 10);
  return data.results
    .filter((m) => m.release_date && m.release_date > today)
    .slice(0, 20)
    .map(mapMovie);
}

// Returns movies currently in theaters / released in the last ~2 months
async function getNowPlaying() {
  const key = process.env.TMDB_API_KEY;
  if (!key || key === 'your_tmdb_api_key_here') return [];

  const { data } = await axios.get(`${TMDB_BASE}/movie/now_playing`, {
    params: { api_key: key, language: 'en-US', page: 1 },
  });

  // Keep only movies released within the last 60 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return data.results
    .filter((m) => m.release_date && m.release_date >= cutoffStr)
    .slice(0, 20)
    .map(mapMovie);
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

// Given a TMDB movie ID, fetch its title/year from TMDB, search OMDB,
// upsert the movie into our DB, and return the omdb_id for navigation.
async function resolveToOmdbId(tmdbId) {
  const key = process.env.TMDB_API_KEY;
  if (!key || key === 'your_tmdb_api_key_here') return null;

  // 1. Get movie details from TMDB
  const { data: tmdbMovie } = await axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
    params: { api_key: key },
  });

  const title = tmdbMovie.title;
  const year  = tmdbMovie.release_date ? tmdbMovie.release_date.slice(0, 4) : null;
  if (!title) return null;

  // 2. Search OMDB by title + year
  const omdbKey = process.env.OMDB_API_KEY;
  const search  = await axios.get('https://www.omdbapi.com/', {
    params: { s: title, y: year, apikey: omdbKey },
  });

  if (search.data.Response === 'False' || !search.data.Search?.length) return null;

  // Pick the closest title match
  const match = search.data.Search[0];

  // 3. Fetch full OMDB record and upsert into our DB
  const detail = await axios.get('https://www.omdbapi.com/', {
    params: { i: match.imdbID, apikey: omdbKey },
  });
  if (detail.data.Response === 'False') return null;

  const d = detail.data;
  await movieRepo.upsert({
    omdb_id:    d.imdbID,
    title:      d.Title,
    year:       parseInt(d.Year, 10) || null,
    genre:      d.Genre,
    poster_url: d.Poster !== 'N/A' ? d.Poster : null,
  });

  return d.imdbID;
}

module.exports = { getUpcoming, getNowPlaying, getTrailerKey, resolveToOmdbId };
