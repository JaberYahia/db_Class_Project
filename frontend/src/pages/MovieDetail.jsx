import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetail, submitRating, getReviews, submitReview, deleteReview } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import StarRating from '../components/StarRating';
import './MovieDetail.css';

export default function MovieDetail() {
  const { omdbId }              = useParams();
  const { user }                = useAuth();
  const navigate                = useNavigate();
  const [movie,   setMovie]     = useState(null);
  const [rating,  setRating]    = useState(0);
  const [saved,   setSaved]     = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(false);

  // Reviews state
  const [reviews,      setReviews]      = useState([]);
  const [comment,      setComment]      = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [reviewSaved,  setReviewSaved]  = useState(false);

  // Load movie details
  useEffect(() => {
    setLoading(true);
    setError(false);
    getMovieDetail(omdbId)
      .then(({ data }) => {
        setMovie(data);
        if (data.user_rating) setRating(data.user_rating);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [omdbId]);

  // Load reviews once we have the movie's internal DB id
  useEffect(() => {
    if (!movie?.id) return;
    getReviews(movie.id)
      .then(({ data }) => setReviews(data))
      .catch(() => {});
  }, [movie?.id]);

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

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await submitReview({ movie_id: movie.id, comment });
      // Refresh reviews list
      const { data } = await getReviews(movie.id);
      setReviews(data);
      setComment('');
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2500);
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReview() {
    try {
      await deleteReview(movie.id);
      const { data } = await getReviews(movie.id);
      setReviews(data);
    } catch {
      // fail silently
    }
  }

  const userReview = reviews.find((r) => r.username === user?.username);
  const avgRating  = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.filter(r => r.rating).length || null)
    : null;

  if (loading) return <div className="movie-detail"><div className="spinner" /></div>;

  if (error || !movie) return (
    <div className="movie-detail">
      <div className="movie-detail__inner" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Could not load movie details.</p>
        <button className="movie-detail__back" onClick={() => navigate(-1)}>← Go back</button>
      </div>
    </div>
  );

  return (
    <div className="movie-detail fade-in">

      {/* Blurred backdrop */}
      <div className="movie-detail__backdrop">
        {movie.poster_url && (
          <img src={movie.poster_url} alt="" className="movie-detail__backdrop-img" aria-hidden />
        )}
        <div className="movie-detail__backdrop-overlay" />
      </div>

      <div className="movie-detail__inner">
        <button className="movie-detail__back" onClick={() => navigate(-1)}>← Back</button>

        {/* Main layout: poster + info */}
        <div className="movie-detail__layout">
          <div className="movie-detail__poster-wrap">
            {movie.poster_url
              ? <img src={movie.poster_url} alt={movie.title} className="movie-detail__poster" />
              : <div className="movie-detail__poster-empty">🎬</div>
            }
          </div>

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

            {/* Star rating widget */}
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

        {/* ── Community Reviews ── */}
        <div className="movie-detail__reviews">
          <div className="movie-detail__reviews-header">
            <h2 className="movie-detail__reviews-title">Community Reviews</h2>
            {reviews.length > 0 && avgRating && (
              <div className="movie-detail__reviews-avg">
                <span className="movie-detail__reviews-avg-score">
                  {avgRating.toFixed(1)}
                </span>
                <span className="movie-detail__reviews-avg-label">
                  / 10 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Write / edit review form */}
          {user ? (
            <form className="movie-detail__review-form" onSubmit={handleSubmitReview}>
              <textarea
                className="movie-detail__review-input"
                placeholder={userReview ? 'Update your review…' : 'Share your thoughts on this movie…'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <div className="movie-detail__review-form-actions">
                {userReview && (
                  <button
                    type="button"
                    className="movie-detail__review-delete"
                    onClick={handleDeleteReview}
                  >
                    Delete my review
                  </button>
                )}
                <button
                  type="submit"
                  className="movie-detail__review-submit"
                  disabled={submitting || !comment.trim()}
                >
                  {submitting ? 'Posting…' : userReview ? 'Update review' : 'Post review'}
                </button>
              </div>
              {reviewSaved && (
                <p className="movie-detail__review-saved">✓ Review saved!</p>
              )}
            </form>
          ) : (
            <p className="movie-detail__review-signin">
              <button className="movie-detail__signin-cta" onClick={() => navigate('/auth')}>
                Sign in to write a review →
              </button>
            </p>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <p className="movie-detail__reviews-empty">
              No reviews yet. Be the first to share your thoughts!
            </p>
          ) : (
            <div className="movie-detail__reviews-list">
              {reviews.map((review) => {
                const initials = review.username.slice(0, 2).toUpperCase();
                const isOwn    = review.username === user?.username;
                const date     = new Date(review.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });
                return (
                  <div key={review.id} className={`movie-detail__review-card ${isOwn ? 'movie-detail__review-card--own' : ''}`}>
                    <div className="movie-detail__review-avatar">{initials}</div>
                    <div className="movie-detail__review-body">
                      <div className="movie-detail__review-top">
                        <span className="movie-detail__review-name">
                          {review.username}{isOwn && <span className="movie-detail__review-you"> (you)</span>}
                        </span>
                        <span className="movie-detail__review-date">{date}</span>
                        {review.rating && (
                          <span className="movie-detail__review-score">★ {review.rating}/10</span>
                        )}
                      </div>
                      <p className="movie-detail__review-text">{review.comment}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
