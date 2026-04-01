import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetail, submitRating, getReviews, submitReview, deleteReview, getTrailer } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './MovieDetail.css';

// Convert a 1-10 rating to filled/half/empty star states on a 5-star scale
function getStarStates(ratingOutOf10) {
  const val = ratingOutOf10 / 2; // 0–5
  return [1, 2, 3, 4, 5].map((i) => {
    if (val >= i)       return 'full';
    if (val >= i - 0.5) return 'half';
    return 'empty';
  });
}

export default function MovieDetail() {
  const { omdbId }           = useParams();
  const { user }             = useAuth();
  const navigate             = useNavigate();
  const [movie,   setMovie]  = useState(null);
  const [rating,  setRating] = useState(0);
  const [saved,   setSaved]  = useState(false);
  const [saving,  setSaving] = useState(false);
  const [loading, setLoading]= useState(true);
  const [error,   setError]  = useState(false);

  const [trailerKey,   setTrailerKey]  = useState(null);
  const [reviews,      setReviews]     = useState([]);
  const [comment,      setComment]     = useState('');
  const [submitting,   setSubmitting]  = useState(false);
  const [reviewSaved,  setReviewSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setTrailerKey(null);
    getMovieDetail(omdbId)
      .then(({ data }) => {
        setMovie(data);
        if (data.user_rating) setRating(data.user_rating);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [omdbId]);

  useEffect(() => {
    if (!omdbId) return;
    getTrailer(omdbId).then(({ data }) => setTrailerKey(data.key)).catch(() => {});
  }, [omdbId]);

  useEffect(() => {
    if (!movie?.id) return;
    getReviews(movie.id).then(({ data }) => setReviews(data)).catch(() => {});
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
    } catch {} finally { setSaving(false); }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await submitReview({ movie_id: movie.id, comment });
      const { data } = await getReviews(movie.id);
      setReviews(data);
      setComment('');
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2500);
    } catch {} finally { setSubmitting(false); }
  }

  async function handleDeleteReview() {
    try {
      await deleteReview(movie.id);
      const { data } = await getReviews(movie.id);
      setReviews(data);
    } catch {}
  }

  if (loading) return <div className="md"><div className="spinner" /></div>;

  if (error || !movie) return (
    <div className="md">
      <div className="md__inner" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Could not load movie details.</p>
        <button className="md__back" onClick={() => navigate(-1)}>← Go back</button>
      </div>
    </div>
  );

  const genres   = movie.genre  ? movie.genre.split(',').map(g => g.trim()).filter(Boolean)  : [];
  const cast     = movie.actors ? movie.actors.split(',').map(a => a.trim()).filter(Boolean) : [];
  const userReview = reviews.find((r) => r.username === user?.username);
  const avgRating  = reviews.filter(r => r.rating).length
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.filter(r => r.rating).length
    : null;
  const communityStars = avgRating ? getStarStates(avgRating) : null;
  const userStars      = rating    ? getStarStates(rating)    : null;

  return (
    <div className="md fade-in">

      {/* Ambient backdrop — very subtle color wash for the whole page */}
      {movie.poster_url && (
        <div
          className="md__backdrop"
          style={{ backgroundImage: `url(${movie.poster_url})` }}
        />
      )}

      <div className="md__inner">
        <button className="md__back" onClick={() => navigate(-1)}>← Back</button>

        {/* ── Header: poster + info ── */}
        <div className="md__header">

          {/* Poster */}
          <div className="md__poster-wrap">
            {movie.poster_url
              ? <img src={movie.poster_url} alt={movie.title} className="md__poster" />
              : <div className="md__poster-empty">🎬</div>
            }
          </div>

          {/* Info */}
          <div className="md__info">

            {/* Title + Year */}
            <h1 className="md__title">
              {movie.title}
              {movie.year && <span className="md__year">{movie.year}</span>}
            </h1>

            {/* Director */}
            {movie.director && (
              <p className="md__director">
                Directed by <span className="md__director-name">{movie.director}</span>
              </p>
            )}

            {/* Genre pills */}
            {genres.length > 0 && (
              <div className="md__genres">
                {genres.map((g) => (
                  <span key={g} className="md__genre-pill">{g}</span>
                ))}
              </div>
            )}

            {/* Community rating */}
            {communityStars && (
              <div className="md__rating-row">
                <div className="md__stars">
                  {communityStars.map((state, i) => (
                    <span key={i} className={`md__star md__star--${state}`}>★</span>
                  ))}
                </div>
                <span className="md__rating-num">{(avgRating / 2).toFixed(2)}</span>
                <span className="md__rating-meta">
                  · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
                {movie.imdb_rating && (
                  <span className="md__imdb">⭐ {movie.imdb_rating} IMDb</span>
                )}
              </div>
            )}
            {!communityStars && movie.imdb_rating && (
              <div className="md__rating-row">
                <span className="md__imdb">⭐ {movie.imdb_rating} IMDb</span>
              </div>
            )}

            {/* Overview */}
            {movie.plot && <p className="md__plot">{movie.plot}</p>}

            {/* Cast */}
            {cast.length > 0 && (
              <div className="md__cast">
                <p className="md__cast-label">Cast</p>
                <div className="md__cast-list">
                  {cast.map((actor) => (
                    <span key={actor} className="md__cast-name">{actor}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="md__divider" />

            {/* Rate this film */}
            <div className="md__rate">
              <p className="md__rate-label">
                {user
                  ? rating > 0 ? 'Your rating' : 'Rate this film'
                  : 'Sign in to rate'
                }
              </p>
              {user ? (
                <div className="md__rate-stars">
                  {[2, 4, 6, 8, 10].map((val) => (
                    <button
                      key={val}
                      className={`md__rate-star ${rating >= val ? 'md__rate-star--on' : ''}`}
                      onClick={() => handleRate(val)}
                      title={`${val / 2} stars`}
                    >
                      ★
                    </button>
                  ))}
                  {saving && <span className="md__rate-status">Saving…</span>}
                  {saved  && <span className="md__rate-status md__rate-status--saved">✓ Saved</span>}
                </div>
              ) : (
                <button className="md__signin-btn" onClick={() => navigate('/auth')}>
                  Sign in to rate →
                </button>
              )}

              {/* Show user's selected rating as star visual */}
              {user && rating > 0 && userStars && (
                <div className="md__user-stars">
                  {userStars.map((state, i) => (
                    <span key={i} className={`md__star md__star--${state} md__star--sm`}>★</span>
                  ))}
                  <span className="md__user-rating-label">{(rating / 2).toFixed(1)} / 5</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Trailer ── */}
        {trailerKey && (
          <section className="md__section">
            <h2 className="md__section-heading">Trailer</h2>
            <div className="md__trailer-player">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?rel=0&modestbranding=1`}
                title={`${movie.title} Trailer`}
                allow="encrypted-media; fullscreen"
                allowFullScreen
                className="md__trailer-iframe"
              />
            </div>
          </section>
        )}

        {/* ── Community Reviews ── */}
        <section className="md__section">
          <div className="md__reviews-heading-row">
            <h2 className="md__section-heading">Community Reviews</h2>
            {avgRating && reviews.length > 0 && (
              <span className="md__reviews-avg">
                {(avgRating / 2).toFixed(2)} avg · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Write / edit review */}
          {user ? (
            <form className="md__review-form" onSubmit={handleSubmitReview}>
              <div className="md__review-form-header">
                <div className="md__review-avatar">{user.username.slice(0, 2).toUpperCase()}</div>
                <span className="md__review-form-name">{user.username}</span>
              </div>
              <textarea
                className="md__review-input"
                placeholder={userReview ? 'Update your review…' : 'Share your thoughts on this film…'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <div className="md__review-form-actions">
                {userReview && (
                  <button type="button" className="md__review-delete" onClick={handleDeleteReview}>
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  className="md__review-submit"
                  disabled={submitting || !comment.trim()}
                >
                  {submitting ? 'Posting…' : userReview ? 'Update' : 'Post Review'}
                </button>
              </div>
              {reviewSaved && <p className="md__review-saved">✓ Saved!</p>}
            </form>
          ) : (
            <button className="md__signin-btn" onClick={() => navigate('/auth')}>
              Sign in to write a review →
            </button>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <p className="md__reviews-empty">No reviews yet. Be the first.</p>
          ) : (
            <div className="md__reviews-list">
              {reviews.map((review) => {
                const isOwn   = review.username === user?.username;
                const initials= review.username.slice(0, 2).toUpperCase();
                const date    = new Date(review.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });
                const rStars  = review.rating ? getStarStates(review.rating) : null;
                return (
                  <div key={review.id} className={`md__review-card ${isOwn ? 'md__review-card--own' : ''}`}>
                    <div className="md__review-avatar">{initials}</div>
                    <div className="md__review-body">
                      <div className="md__review-top">
                        <span className="md__review-name">
                          {review.username}
                          {isOwn && <span className="md__review-you">you</span>}
                        </span>
                        {rStars && (
                          <span className="md__review-stars">
                            {rStars.map((state, i) => (
                              <span key={i} className={`md__star md__star--${state} md__star--sm`}>★</span>
                            ))}
                          </span>
                        )}
                        <span className="md__review-date">{date}</span>
                      </div>
                      <p className="md__review-text">{review.comment}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
