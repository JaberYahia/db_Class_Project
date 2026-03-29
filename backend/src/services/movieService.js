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
  return movieRepo.getAverageRatings();
}

async function getMovieById(id) {
  return movieRepo.findById(id);
}

module.exports = { searchOMDB, getMovieDetail, getAllMovies, getMovieById };
