import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovies, getRecommendations, getUpcomingMovies } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MovieRow from '../components/MovieRow';
import UpcomingCard from '../components/UpcomingCard';
import './Home.css';

const GENRE_ROWS = ['Action', 'Drama', 'Crime', 'Sci-Fi', 'Adventure', 'Thriller'];

export default function Home() {
  const { user }                   = useAuth();
  const navigate                   = useNavigate();
  const [movies,   setMovies]      = useState([]);
  const [recs,     setRecs]        = useState([]);
  const [upcoming, setUpcoming]    = useState([]);
  const [loading,  setLoading]     = useState(true);
  const [featuredIdx, setFeatured] = useState(0);
  const heroRef                    = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [moviesRes, upcomingRes] = await Promise.allSettled([
          getMovies(),
          getUpcomingMovies(),
        ]);
        if (moviesRes.status === 'fulfilled') setMovies(moviesRes.value.data);
        if (upcomingRes.status === 'fulfilled') setUpcoming(upcomingRes.value.data);

        if (user) {
          const { data: recData } = await getRecommendations();
          setRecs(recData);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Rotate the featured hero every 8 seconds through top-rated movies
  const heroPool = movies.filter((m) => m.poster_url && m.avg_rating).slice(0, 5);
  useEffect(() => {
    if (heroPool.length < 2) return;
    const id = setInterval(() => setFeatured((i) => (i + 1) % heroPool.length), 8000);
    return () => clearInterval(id);
  }, [heroPool.length]);

  if (loading) return <div className="home"><div className="spinner" /></div>;

  const featured  = heroPool[featuredIdx] || null;
  const topRated  = [...movies].filter((m) => m.avg_rating).sort((a, b) => b.avg_rating - a.avg_rating);
  const moviesForGenre = (genre) => movies.filter((m) => m.genre?.toLowerCase().includes(genre.toLowerCase()));

  return (
    <div className="home fade-in">

      {/* ── Cinematic Featured Hero ── */}
      {featured && (
        <section className="home__hero" ref={heroRef}>
          {/* Blurred poster backdrop */}
          <div
            className="home__hero-bg"
            style={{ backgroundImage: `url(${featured.poster_url})` }}
          />
          <div className="home__hero-overlay" />

          <div className="home__hero-inner">
            <div className="home__hero-info">
              <p className="home__hero-label">Featured Film</p>
              <h1 className="home__hero-title">{featured.title}</h1>

              <div className="home__hero-meta">
                <span className="home__hero-year">{featured.year}</span>
                {featured.genre && (
                  <span className="home__hero-genre">{featured.genre.split(',')[0]}</span>
                )}
                {featured.avg_rating && (
                  <span className="home__hero-rating">★ {Number(featured.avg_rating).toFixed(1)}</span>
                )}
              </div>

              {featured.plot && (
                <p className="home__hero-plot">
                  {featured.plot.length > 160 ? featured.plot.slice(0, 157) + '…' : featured.plot}
                </p>
              )}

              <div className="home__hero-actions">
                <button
                  className="home__hero-btn home__hero-btn--primary"
                  onClick={() => navigate(`/movie/${featured.omdb_id}`)}
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Poster */}
            <img
              key={featured.omdb_id}
              src={featured.poster_url}
              alt={featured.title}
              className="home__hero-poster"
            />
          </div>

          {/* Dot indicators */}
          {heroPool.length > 1 && (
            <div className="home__hero-dots">
              {heroPool.map((_, i) => (
                <button
                  key={i}
                  className={`home__hero-dot ${i === featuredIdx ? 'home__hero-dot--active' : ''}`}
                  onClick={() => setFeatured(i)}
                  aria-label={`Feature film ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="home__content">

        {/* ── Coming Soon ── */}
        {upcoming.length > 0 && (
          <section className="home__section">
            <div className="home__section-header">
              <h2 className="home__section-title">Coming Soon</h2>
              <span className="home__section-badge">TMDB</span>
            </div>
            <div className="home__upcoming-track">
              {upcoming.map((m) => (
                <UpcomingCard key={m.tmdb_id} movie={m} />
              ))}
            </div>
          </section>
        )}

        {/* ── Recommended For You ── */}
        {user && recs.length > 0 && (
          <MovieRow title="For You" movies={recs} badge="AI Picks" />
        )}

        {/* ── Top Rated ── */}
        {topRated.length > 0 && (
          <MovieRow title="Top Rated" movies={topRated} />
        )}

        {/* ── All Movies ── */}
        <MovieRow title="All Movies" movies={movies} />

        {/* ── Genre Rows ── */}
        {GENRE_ROWS.map((genre) => {
          const gMovies = moviesForGenre(genre);
          if (gMovies.length === 0) return null;
          return <MovieRow key={genre} title={genre} movies={gMovies} />;
        })}

      </div>
    </div>
  );
}
