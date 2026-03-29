import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetail, submitRating } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import StarRating from '../components/StarRating';
import './MovieDetail.css';

export default function MovieDetail() {
  const { omdbId }                  = useParams();
  const { user }                    = useAuth();
  const navigate                    = useNavigate();
  const [movie,   setMovie]         = useState(null);
  const [rating,  setRating]        = useState(0);
  const [saved,   setSaved]         = useState(false);
  const [saving,  setSaving]        = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    getMovieDetail(omdbId)
      .then(({ data }) => {
        setMovie(data);
        if (data.user_rating) setRating(data.user_rating);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [omdbId, navigate]);

  async function handleRate(val) {
    if (!user) { navigate('/auth'); return; }
    setRating(val);
    setSaving(true);
    setSaved(false);
    try {
      await submitRating({ movie_id: movie.id, rating: val });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // fail silently
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="movie-detail"><div className="spinner" /></div>;
  if (!movie)  return null;

  return (
    <div className="movie-detail fade-in">

      {/* Backdrop gradient from poster */}
      <div className="movie-detail__backdrop">
        {movie.poster_url && (
          <img src={movie.poster_url} alt="" className="movie-detail__backdrop-img" aria-hidden />
        )}
        <div className="movie-detail__backdrop-overlay" />
      </div>

      <div className="movie-detail__inner">
        <button className="movie-detail__back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="movie-detail__layout">

          {/* Poster */}
          <div className="movie-detail__poster-wrap">
            {movie.poster_url
              ? <img src={movie.poster_url} alt={movie.title} className="movie-detail__poster" />
              : <div className="movie-detail__poster-empty">🎬</div>
            }
          </div>

          {/* Info */}
          <div className="movie-detail__info">
            <p className="movie-detail__genre-label">{movie.genre}</p>
            <h1 className="movie-detail__title">{movie.title}</h1>

            <div className="movie-detail__meta-row">
              <span className="movie-detail__meta">{movie.year}</span>
              {movie.imdb_rating && (
                <span className="movie-detail__imdb">⭐ {movie.imdb_rating} IMDB</span>
              )}
              {movie.avg_rating && (
                <span className="movie-detail__avg">★ {movie.avg_rating} Movie Rank</span>
              )}
            </div>

            {movie.director && (
              <p className="movie-detail__crew">Directed by <strong>{movie.director}</strong></p>
            )}
            {movie.actors && (
              <p className="movie-detail__crew movie-detail__crew--dim">Cast: {movie.actors}</p>
            )}
            {movie.plot && (
              <p className="movie-detail__plot">{movie.plot}</p>
            )}

            {/* Rating widget */}
            <div className="movie-detail__rating-block">
              <p className="movie-detail__rating-label">
                {user ? (rating > 0 ? 'Your rating' : 'Rate this movie') : 'Sign in to rate'}
              </p>
              {user ? (
                <>
                  <StarRating value={rating} onChange={handleRate} size="lg" />
                  {saving && <span className="movie-detail__rating-status">Saving...</span>}
                  {saved  && <span className="movie-detail__rating-status movie-detail__rating-status--saved">✓ Saved!</span>}
                </>
              ) : (
                <button className="movie-detail__signin-cta" onClick={() => navigate('/auth')}>
                  Sign in to rate →
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
