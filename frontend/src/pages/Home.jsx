import { useEffect, useState } from 'react';
import { getMovies, getRecommendations } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MovieRow from '../components/MovieRow';
import './Home.css';

const GENRE_ROWS = ['Action', 'Drama', 'Crime', 'Sci-Fi', 'Adventure', 'Thriller'];

export default function Home() {
  const { user }                    = useAuth();
  const [movies,   setMovies]       = useState([]);
  const [recs,     setRecs]         = useState([]);
  const [loading,  setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getMovies();
        setMovies(data);
        if (user) {
          const { data: recData } = await getRecommendations();
          setRecs(recData);
        }
      } catch {
        // silently fail — movies may still partially load
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) return <div className="home"><div className="spinner" /></div>;

  // Build per-genre rows
  function moviesForGenre(genre) {
    return movies.filter((m) => m.genre?.toLowerCase().includes(genre.toLowerCase()));
  }

  // Top rated = movies with a rating
  const topRated = [...movies]
    .filter((m) => m.avg_rating)
    .sort((a, b) => b.avg_rating - a.avg_rating);

  return (
    <div className="home fade-in">

      {/* Hero */}
      <section className="home__hero">
        <div className="home__hero-content">
          <h1 className="home__hero-title">
            Discover your next<br />
            <span className="home__hero-highlight">favorite film.</span>
          </h1>
          <p className="home__hero-sub">
            Rate movies. Get personalized recommendations based on your taste.
          </p>
        </div>
        <div className="home__hero-glow" />
      </section>

      <div className="home__content">

        {/* Recommendations row — only for logged-in users */}
        {user && recs.length > 0 && (
          <MovieRow title="Recommended For You" movies={recs} badge="AI Picks" />
        )}

        {/* Top rated */}
        {topRated.length > 0 && (
          <MovieRow title="Top Rated" movies={topRated} />
        )}

        {/* All movies */}
        <MovieRow title="All Movies" movies={movies} />

        {/* Genre rows */}
        {GENRE_ROWS.map((genre) => {
          const genreMovies = moviesForGenre(genre);
          if (genreMovies.length === 0) return null;
          return (
            <MovieRow key={genre} title={genre} movies={genreMovies} />
          );
        })}

      </div>
    </div>
  );
}
