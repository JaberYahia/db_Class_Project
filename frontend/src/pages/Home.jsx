// ─────────────────────────────────────────────────────────────────────────────
// pages/Home.jsx — Main landing page / movie browse feed
//
// Layout (top to bottom):
//   1. Hero section — headline and tagline
//   2. "Recommended For You" row — AI picks (only shown if logged in)
//   3. "Top Rated" row — movies sorted by community average rating
//   4. "All Movies" row — every movie in the database
//   5. Genre rows — one horizontal row per genre (Action, Drama, etc.)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { getMovies, getRecommendations } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MovieRow from '../components/MovieRow';
import './Home.css';

// Genres to display as separate rows on the home page
const GENRE_ROWS = ['Action', 'Drama', 'Crime', 'Sci-Fi', 'Adventure', 'Thriller'];

export default function Home() {
  const { user }               = useAuth();        // Check if a user is logged in
  const [movies,  setMovies]   = useState([]);     // All movies from the database
  const [recs,    setRecs]     = useState([]);     // Personalised recommendations (logged-in only)
  const [loading, setLoading]  = useState(true);   // Show spinner while data is loading

  // Fetch movies (and recommendations if logged in) when the component mounts
  // or when the user logs in/out (user is in the dependency array)
  useEffect(() => {
    async function load() {
      try {
        const { data } = await getMovies(); // Fetch all movies with average ratings
        setMovies(data);

        if (user) {
          // Only fetch recommendations if the user is authenticated
          const { data: recData } = await getRecommendations();
          setRecs(recData);
        }
      } catch {
        // Silently fail — the page still renders with whatever data loaded
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]); // Re-run when the logged-in user changes

  // Show a centered spinner while loading
  if (loading) return <div className="home"><div className="spinner" /></div>;

  // Filter the full movie list to only those matching a given genre string
  function moviesForGenre(genre) {
    return movies.filter((m) => m.genre?.toLowerCase().includes(genre.toLowerCase()));
  }

  // Top rated = all movies that have at least one rating, sorted highest first
  const topRated = [...movies]
    .filter((m) => m.avg_rating)
    .sort((a, b) => b.avg_rating - a.avg_rating);

  return (
    <div className="home fade-in">

      {/* Hero Section — decorative headline at the top of the page */}
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
        <div className="home__hero-glow" /> {/* Decorative glow effect */}
      </section>

      <div className="home__content">

        {/* AI Recommendations row — only visible to logged-in users with results */}
        {user && recs.length > 0 && (
          <MovieRow title="Recommended For You" movies={recs} badge="AI Picks" />
        )}

        {/* Top Rated row — movies with the highest community average rating */}
        {topRated.length > 0 && (
          <MovieRow title="Top Rated" movies={topRated} />
        )}

        {/* All Movies row — every movie in the database */}
        <MovieRow title="All Movies" movies={movies} />

        {/* One row per genre — skipped if no movies match that genre */}
        {GENRE_ROWS.map((genre) => {
          const genreMovies = moviesForGenre(genre);
          if (genreMovies.length === 0) return null; // Don't render an empty row
          return (
            <MovieRow key={genre} title={genre} movies={genreMovies} />
          );
        })}

      </div>
    </div>
  );
}
