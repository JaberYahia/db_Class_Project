// ─────────────────────────────────────────────────────────────────────────────
// components/MovieCard.jsx — Reusable card for displaying a single movie
//
// Displays the poster, title, year, genre, and community/predicted rating.
// Clicking anywhere on the card navigates to that movie's detail page.
// Used in MovieRow (horizontal scrolling sections) and grid layouts.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { PosterBackdropContext } from '../App';
import './MovieCard.css';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();
  const setBgPoster = useContext(PosterBackdropContext);

  // Use the community average rating if available, otherwise use the
  // AI-predicted rating (from the recommendation engine). Fall back to null.
  const avgRating = movie.avg_rating || movie.predicted_rating || null;

  // Convert the 1-10 scale to 1-5 stars for the visual star display
  // (e.g. a rating of 8 becomes 4 filled stars)
  const stars = avgRating ? Math.round(avgRating / 2) : 0;

  return (
    <div
      className="movie-card"
      onClick={() => movie.omdb_id && navigate(`/movie/${movie.omdb_id}`)}
      style={!movie.omdb_id ? { cursor: 'default' } : undefined}
      onMouseEnter={() => movie.poster_url && setBgPoster?.(movie.poster_url)}
      onMouseLeave={() => setBgPoster?.(null)}
    >

      {/* Poster area */}
      <div className="movie-card__poster-wrap">
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title} className="movie-card__poster" loading="lazy" />
          : <div className="movie-card__poster-empty">🎬</div> // Placeholder if no image
        }
        {/* Rating badge overlaid on the poster corner */}
        {avgRating && (
          <div className="movie-card__badge">{avgRating}</div>
        )}
      </div>

      {/* Text info below the poster */}
      <div className="movie-card__info">
        <p className="movie-card__title">{movie.title}</p>
        {/* Show year and only the first genre (e.g. "Action, Drama" → "Action") */}
        <p className="movie-card__meta">{movie.year} · {movie.genre?.split(',')[0]}</p>

        {/* 5-star visual display (converted from the 1-10 rating scale) */}
        {avgRating && (
          <div className="movie-card__stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`movie-card__star ${s <= stars ? 'movie-card__star--on' : ''}`}
              >
                ★
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
