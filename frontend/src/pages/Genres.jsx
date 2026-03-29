import { useEffect, useState } from 'react';
import { getMovies } from '../services/api';
import MovieCard from '../components/MovieCard';
import MovieRow from '../components/MovieRow';
import './Genres.css';

const ALL_GENRES = ['Action', 'Adventure', 'Biography', 'Crime', 'Drama', 'Romance', 'Sci-Fi', 'Thriller', 'Western'];

export default function Genres() {
  const [movies,  setMovies]  = useState([]);
  const [active,  setActive]  = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMovies()
      .then(({ data }) => setMovies(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = active === 'All'
    ? movies
    : movies.filter((m) => m.genre?.toLowerCase().includes(active.toLowerCase()));

  if (loading) return <div className="genres"><div className="spinner" /></div>;

  return (
    <div className="genres fade-in">
      <div className="genres__inner">
        <h1 className="genres__title">Browse by Genre</h1>

        {/* Genre tabs */}
        <div className="genres__tabs">
          {['All', ...ALL_GENRES].map((g) => (
            <button
              key={g}
              className={`genres__tab ${active === g ? 'genres__tab--active' : ''}`}
              onClick={() => setActive(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {active === 'All' ? (
          <div className="genres__rows">
            {ALL_GENRES.map((genre) => {
              const genreMovies = movies.filter((m) =>
                m.genre?.toLowerCase().includes(genre.toLowerCase())
              );
              if (genreMovies.length === 0) return null;
              return <MovieRow key={genre} title={genre} movies={genreMovies} />;
            })}
          </div>
        ) : (
          <div>
            <p className="genres__count">{filtered.length} movie{filtered.length !== 1 ? 's' : ''}</p>
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
