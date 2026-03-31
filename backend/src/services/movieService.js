// ─────────────────────────────────────────────────────────────────────────────
// services/movieService.js — Business logic for movie data
//
// This app uses OMDB as an external movie database.
// Rather than hitting OMDB on every request (slow, rate-limited), we cache
// movie records in our own MySQL database and only call OMDB when needed.
// ─────────────────────────────────────────────────────────────────────────────

const axios     = require('axios');    // HTTP client for calling the OMDB API
const movieRepo = require('../repositories/movieRepo');

// ─── Search ───────────────────────────────────────────────────────────────────

// Search OMDB for movies matching a keyword.
// Returns a lightweight list (no plot/cast) suitable for the search dropdown.
async function searchOMDB(query) {
  const { data } = await axios.get('https://www.omdbapi.com/', {
    params: { s: query, apikey: process.env.OMDB_API_KEY }, // 's' = search by title
  });

  if (data.Response === 'False') return []; // OMDB returns "False" if no results found

  // Map each result to a clean object with only the fields we need
  return data.Search.map((m) => ({
    omdb_id:    m.imdbID,                               // IMDB ID (e.g. "tt0111161")
    title:      m.Title,
    year:       parseInt(m.Year, 10) || null,           // Year comes as a string — convert to number
    poster_url: m.Poster !== 'N/A' ? m.Poster : null,  // OMDB uses "N/A" instead of null
  }));
}

// ─── Movie Detail ─────────────────────────────────────────────────────────────

// Fetch full movie details by OMDB ID.
// Strategy: check local cache first, then always hit OMDB for fresh data
// and upsert it back into the database so future requests are faster.
async function getMovieDetail(omdb_id) {
  // Check if we already have it cached locally
  const cached = await movieRepo.findByOmdbId(omdb_id);

  try {
    const { data } = await axios.get('https://www.omdbapi.com/', {
      params: { i: omdb_id, apikey: process.env.OMDB_API_KEY },
    });

    // If OMDB doesn't know this ID, fall back to whatever we have cached
    if (data.Response === 'False') return cached || null;

    // Save/refresh the movie record in our local database
    const movie = await movieRepo.upsert({
      omdb_id:    data.imdbID,
      title:      data.Title,
      year:       parseInt(data.Year, 10) || null,
      genre:      data.Genre,
      poster_url: data.Poster !== 'N/A' ? data.Poster : null,
    });

    return {
      ...movie,
      plot:        data.Plot,
      director:    data.Director,
      actors:      data.Actors,
      imdb_rating: data.imdbRating,
    };
  } catch {
    // OMDB unavailable or rate-limited — serve from local cache
    return cached || null;
  }
}

// ─── All Movies ───────────────────────────────────────────────────────────────

// Fetch all movies from our local database, with community average ratings.
// Also kicks off a background job to fill in any missing poster images.
async function getAllMovies() {
  const movies = await movieRepo.getAverageRatings(); // Includes avg_rating and rating_count

  // Find any movies that are missing poster images
  const missing = movies.filter((m) => !m.poster_url);
  if (missing.length > 0) {
    // Intentionally NOT awaited — this runs in the background so the response
    // is returned immediately. The posters will be updated for future requests.
    Promise.all(
      missing.map(async (m) => {
        try {
          const { data } = await axios.get('https://www.omdbapi.com/', {
            params: { i: m.omdb_id, apikey: process.env.OMDB_API_KEY },
          });
          if (data.Response !== 'False' && data.Poster !== 'N/A') {
            await movieRepo.upsert({
              omdb_id:    m.omdb_id,
              title:      m.title,
              year:       m.year,
              genre:      m.genre,
              poster_url: data.Poster,
            });
            m.poster_url = data.Poster; // Also update the in-memory object for this response
          }
        } catch {
          // Silently skip — if OMDB is down, just serve the movie without a poster
        }
      })
    );
  }

  return movies;
}

// Simple lookup by internal database ID — used by the recommendation engine
async function getMovieById(id) {
  return movieRepo.findById(id);
}

module.exports = { searchOMDB, getMovieDetail, getAllMovies, getMovieById };
