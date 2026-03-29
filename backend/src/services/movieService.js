const axios     = require('axios');
const movieRepo = require('../repositories/movieRepo');

async function searchOMDB(query) {
  const { data } = await axios.get('https://www.omdbapi.com/', {
    params: { s: query, apikey: process.env.OMDB_API_KEY },
  });

  if (data.Response === 'False') return [];
  return data.Search.map((m) => ({
    omdb_id:    m.imdbID,
    title:      m.Title,
    year:       parseInt(m.Year, 10) || null,
    poster_url: m.Poster !== 'N/A' ? m.Poster : null,
  }));
}

async function getMovieDetail(omdb_id) {
  // Return cached version first
  const cached = await movieRepo.findByOmdbId(omdb_id);

  const { data } = await axios.get('https://www.omdbapi.com/', {
    params: { i: omdb_id, apikey: process.env.OMDB_API_KEY },
  });

  if (data.Response === 'False') return cached || null;

  // Upsert fresh data into local cache
  const movie = await movieRepo.upsert({
    omdb_id:    data.imdbID,
    title:      data.Title,
    year:       parseInt(data.Year, 10) || null,
    genre:      data.Genre,
    poster_url: data.Poster !== 'N/A' ? data.Poster : null,
  });

  return {
    ...movie,
    plot:      data.Plot,
    director:  data.Director,
    actors:    data.Actors,
    imdb_rating: data.imdbRating,
  };
}

async function getAllMovies() {
  const movies = await movieRepo.getAverageRatings();

  // Fetch and cache posters for any movies missing them (runs in background)
  const missing = movies.filter((m) => !m.poster_url);
  if (missing.length > 0) {
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
            m.poster_url = data.Poster; // update in-memory for this response
          }
        } catch {
          // silently skip if OMDB is unavailable for this movie
        }
      })
    );
  }

  return movies;
}

async function getMovieById(id) {
  return movieRepo.findById(id);
}

module.exports = { searchOMDB, getMovieDetail, getAllMovies, getMovieById };
