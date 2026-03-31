// ─────────────────────────────────────────────────────────────────────────────
// pages/Genres.jsx — Browse movies by genre
//
// Two display modes:
//   • "All" tab selected → one horizontal MovieRow per genre
//   • Specific genre tab selected → a full grid of all matching movies
//
// Filtering is done client-side on the already-fetched movies array —
// no extra API calls needed when switching tabs.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { getMovies } from '../services/api';
import MovieCard from '../components/MovieCard';
import MovieRow from '../components/MovieRow';
import './Genres.css';

// All genre options available as filter tabs
const ALL_GENRES = ['Action', 'Adventure', 'Biography', 'Crime', 'Drama', 'Romance', 'Sci-Fi', 'Thriller', 'Western'];

export default function Genres() {
  const [movies,  setMovies]  = useState([]);    // All movies from the backend
  const [active,  setActive]  = useState('All'); // Currently selected genre tab
  const [loading, setLoading] = useState(true);

  // Fetch all movies once on mount — genres are filtered client-side
  useEffect(() => {
    getMovies()
      .then(({ data }) => setMovies(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter movies by the active genre, or show everything if "All" is selected.
  // genre field can contain multiple genres (e.g. "Action, Drama") so we use
  // includes() to match partial strings.
  const filtered = active === 'All'
    ? movies
    : movies.filter((m) => m.genre?.toLowerCase().includes(active.toLowerCase()));

  if (loading) return <div className="genres"><div className="spinner" /></div>;

  return (
    <div className="genres fade-in">
      <div className="genres__inner">
        <h1 className="genres__title">Browse by Genre</h1>

        {/* Genre filter tabs — clicking one sets the active filter */}
        <div className="genres__tabs">
          {['All', ...ALL_GENRES].map((g) => (
            <button
              key={g}
              className={`genres__tab ${active === g ? 'genres__tab--active' : ''}`}
              onClick={() => setActive(g)} // Update active genre — triggers re-filter
            >
              {g}
            </button>
          ))}
        </div>

        {active === 'All' ? (
          // "All" mode: one horizontally scrolling row per genre
          <div className="genres__rows">
            {ALL_GENRES.map((genre) => {
              const genreMovies = movies.filter((m) =>
                m.genre?.toLowerCase().includes(genre.toLowerCase())
              );
              if (genreMovies.length === 0) return null; // Don't show empty rows
              return <MovieRow key={genre} title={genre} movies={genreMovies} />;
            })}
          </div>
        ) : (
          // Specific genre mode: result count + full card grid
          <div>
            <p className="genres__count">
              {filtered.length} movie{filtered.length !== 1 ? 's' : ''} {/* Correct plural */}
            </p>
            <div className="genres__grid">
              {filtered.map((movie) => (
                <MovieCard key={movie.omdb_id || movie.id} movie={movie} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
