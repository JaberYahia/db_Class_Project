import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMovieDetail, submitRating,
  getReviews, submitReview, deleteReview, getTrailer,
  getMovieActions, toggleWatched, toggleLiked, toggleWatchlist,
  adminDeleteReview,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './MovieDetail.css';

function starStates(ratingOutOf10) {
  const v = ratingOutOf10 / 2;
  return [1, 2, 3, 4, 5].map((i) => {
    if (v >= i)       return 'full';
    if (v >= i - 0.5) return 'half';
    return 'empty';
  });
}

export default function MovieDetail() {
  const { omdbId }           = useParams();
  const { user, isAdmin }    = useAuth();
  const navigate             = useNavigate();

  const [movie,   setMovie]  = useState(null);
  const [rating,  setRating] = useState(0);
  const [saved,   setSaved]  = useState(false);
  const [saving,  setSaving] = useState(false);
  const [loading, setLoading]= useState(true);
  const [error,   setError]  = useState(false);
  const [trailerKey,  setTrailerKey]  = useState(null);
  const [reviews,     setReviews]     = useState([]);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);

  // Watched / Liked / Watchlist toggle states
  const [watched,      setWatched]      = useState(false);
  const [liked,        setLiked]        = useState(false);
  const [watchlisted,  setWatchlisted]  = useState(false);

  // Animation triggers
  const [heartPop,      setHeartPop]      = useState(false); // like button pop
  const [watchlistFlash, setWatchlistFlash] = useState(false); // "Added!" badge

  // Star rating hover animation
  const [hoveredRating, setHoveredRating] = useState(0);  // Which star the cursor is over (0 = none)
  const [burstActive,   setBurstActive]   = useState(false); // True briefly after a click to play burst

  useEffect(() => {
    setLoading(true); setError(false); setTrailerKey(null);
    getMovieDetail(omdbId)
      .then(({ data }) => { setMovie(data); if (data.user_rating) setRating(data.user_rating); })
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

  // Load watched/liked/watchlist states once the movie and user are known
  useEffect(() => {
    if (!omdbId || !user) return;
    getMovieActions(omdbId)
      .then(({ data }) => {
        setWatched(data.watched);
        setLiked(data.liked);
        setWatchlisted(data.watchlisted);
      })
      .catch(() => {});
  }, [omdbId, user]);

  async function handleToggleWatched() {
    if (!user) { navigate('/auth'); return; }
    const prev = watched;
    setWatched(!prev); // optimistic
    try {
      const { data } = await toggleWatched(omdbId);
      setWatched(data.active);
    } catch {
      setWatched(prev); // revert on failure
    }
  }

  async function handleToggleLiked() {
    if (!user) { navigate('/auth'); return; }
    const prev = liked;
    const next = !prev;
    setLiked(next);
    if (next) {
      // trigger heart pop animation
      setHeartPop(true);
      setTimeout(() => setHeartPop(false), 600);
    }
    try {
      const { data } = await toggleLiked(omdbId);
      setLiked(data.active);
    } catch {
      setLiked(prev);
    }
  }

  async function handleToggleWatchlist() {
    if (!user) { navigate('/auth'); return; }
    const prev = watchlisted;
    const next = !prev;
    setWatchlisted(next);
    if (next) {
      // trigger "Added!" flash
      setWatchlistFlash(true);
      setTimeout(() => setWatchlistFlash(false), 1400);
    }
    try {
      const { data } = await toggleWatchlist(omdbId);
      setWatchlisted(data.active);
    } catch {
      setWatchlisted(prev);
    }
  }

  async function handleRate(val) {
    if (!user) { navigate('/auth'); return; }
    setRating(val);
    // Trigger burst animation on all lit stars, then clear after the keyframe finishes
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 500);
    setSaving(true); setSaved(false);
    try {
      await submitRating({ movie_id: movie.id, rating: val });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {} finally { setSaving(false); }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await submitReview({ movie_id: movie.id, comment });
      const { data } = await getReviews(movie.id);
      setReviews(data); setComment('');
      setReviewSaved(true); setTimeout(() => setReviewSaved(false), 2500);
    } catch {} finally { setSubmitting(false); }
  }

  async function handleDeleteReview() {
    try {
      await deleteReview(movie.id);
      const { data } = await getReviews(movie.id);
      setReviews(data);
    } catch {}
  }

  // Admin-only: delete any review by its ID (not just the user's own)
  async function handleAdminDeleteReview(reviewId) {
    try {
      await adminDeleteReview(reviewId);
      // Refresh the list so the deleted review disappears immediately
      const { data } = await getReviews(movie.id);
      setReviews(data);
    } catch {}
  }

  if (loading) return <div className="md"><div className="spinner" /></div>;
  if (error || !movie) return (
    <div className="md">
      <div style={{ textAlign: 'center', paddingTop: '120px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Could not load movie details.</p>
        <button className="md__back" onClick={() => navigate(-1)}>← Go back</button>
      </div>
    </div>
  );

  const genres     = movie.genre  ? movie.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
  const cast       = movie.actors ? movie.actors.split(',').map(a => a.trim()).filter(Boolean) : [];
  const userReview = reviews.find(r => r.username === user?.username);
  const ratedCount = reviews.filter(r => r.rating).length;
  const avgRating  = ratedCount
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / ratedCount
    : null;

  return (
    <div className="md fade-in">

      {/* ── Full-width blurred backdrop ── */}
      <div className="md__backdrop">
        {movie.poster_url && (
          <div className="md__backdrop-img" style={{ backgroundImage: `url(${movie.poster_url})` }} />
        )}
        <div className="md__backdrop-gradient" />
      </div>

      {/* ── Page container ── */}
      <div className="md__wrap">
        <button className="md__back" onClick={() => navigate(-1)}>← Back</button>

        <div className="md__body">

          {/* ══ LEFT SIDEBAR ══ */}
          <aside className="md__sidebar">

            {/* Poster */}
            <div className="md__poster-wrap">
              {movie.poster_url
                ? <img src={movie.poster_url} alt={movie.title} className="md__poster" />
                : <div className="md__poster-empty">🎬</div>
              }
            </div>

            {/* Action buttons: Watched / Like / Watchlist */}
            <div className="md__actions">

              {/* Watched */}
              <button
                className={`md__action ${watched ? 'md__action--on' : ''}`}
                title={watched ? 'Remove from watched' : 'Mark as watched'}
                onClick={handleToggleWatched}
              >
                <span className="md__action-icon">✓</span>
                <span className="md__action-label">Watched</span>
              </button>

              {/* Like — red heart with pop */}
              <button
                className={`md__action md__action--like ${liked ? 'md__action--liked' : ''}`}
                title={liked ? 'Unlike' : 'Like'}
                onClick={handleToggleLiked}
              >
                <span className={`md__action-icon md__heart ${heartPop ? 'md__heart--pop' : ''}`}>
                  ♥
                </span>
                <span className="md__action-label">Like</span>
              </button>

              {/* Watchlist — "Added!" flash */}
              <button
                className={`md__action ${watchlisted ? 'md__action--on' : ''}`}
                title={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                onClick={handleToggleWatchlist}
              >
                {watchlistFlash
                  ? <span className="md__action-icon md__added-flash">Added!</span>
                  : <span className="md__action-icon">{watchlisted ? '✓' : '+'}</span>
                }
                <span className="md__action-label">Watchlist</span>
              </button>

            </div>

            {/* Rate this film */}
            <div className="md__rate-block">
              <p className="md__rate-label">
                {user ? (rating > 0 ? 'Your rating' : 'Rate') : 'Sign in to rate'}
              </p>

              {user ? (
                // onMouseLeave on the container resets hover when the cursor leaves the whole row
                <div className="md__rate-stars" onMouseLeave={() => setHoveredRating(0)}>
                  {[2, 4, 6, 8, 10].map((val) => {
                    const displayRating = hoveredRating || rating; // hover preview takes priority
                    const isOn      = displayRating >= val;
                    // Only bounce the tip star (the one the cursor is directly over).
                    // Suppress bounce during burst so both animations don't fight.
                    const isTip     = hoveredRating === val && !burstActive;
                    // Burst plays on all currently-lit stars right after a click
                    const isBursting = burstActive && rating >= val;
                    return (
                      <button
                        key={val}
                        className={[
                          'md__rate-star',
                          isOn      ? 'md__rate-star--on'     : '',
                          isTip     ? 'md__rate-star--bounce'  : '',
                          isBursting ? 'md__rate-star--burst'  : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleRate(val)}
                        onMouseEnter={() => setHoveredRating(val)}
                        title={`${val / 2} stars`}
                      >★</button>
                    );
                  })}
                </div>
              ) : (
                <button className="md__signin-cta" onClick={() => navigate('/auth')}>Sign in</button>
              )}

              {saving && <span className="md__save-status">Saving…</span>}
              {saved  && <span className="md__save-status md__save-status--ok">✓ Saved</span>}

              {/* Show selected rating as star visual */}
              {user && rating > 0 && (
                <div className="md__user-star-row">
                  {starStates(rating).map((s, i) => (
                    <span key={i} className={`md__display-star md__display-star--${s} md__display-star--sm`}>★</span>
                  ))}
                  <span className="md__user-rating-label">{(rating / 2).toFixed(1)}</span>
                </div>
              )}
            </div>

          </aside>

          {/* ══ RIGHT CONTENT ══ */}
          <div className="md__content">

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
                {genres.map(g => <span key={g} className="md__genre-pill">{g}</span>)}
              </div>
            )}

            {/* Community rating */}
            <div className="md__rating-row">
              {avgRating ? (
                <>
                  <div className="md__display-stars">
                    {starStates(avgRating).map((s, i) => (
                      <span key={i} className={`md__display-star md__display-star--${s}`}>★</span>
                    ))}
                  </div>
                  <span className="md__rating-num">{(avgRating / 2).toFixed(2)}</span>
                  <span className="md__rating-count">
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <span className="md__rating-none">No ratings yet</span>
              )}
              {movie.imdb_rating && (
                <span className="md__imdb">⭐ {movie.imdb_rating} IMDb</span>
              )}
            </div>

            {/* Plot */}
            {movie.plot && <p className="md__plot">{movie.plot}</p>}

            {/* Cast */}
            {cast.length > 0 && (
              <div className="md__cast">
                <p className="md__cast-heading">Cast</p>
                <div className="md__cast-list">
                  {cast.map(a => <span key={a} className="md__cast-chip">{a}</span>)}
                </div>
              </div>
            )}

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

        {/* ── Reviews ── */}
        <section className="md__section">
          <div className="md__reviews-top">
            <h2 className="md__section-heading">Reviews</h2>
            {avgRating && reviews.length > 0 && (
              <span className="md__reviews-stat">
                {(avgRating / 2).toFixed(2)} avg · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Write / edit form */}
          {user ? (
            <form className="md__review-form" onSubmit={handleSubmitReview}>
              <div className="md__review-form-meta">
                <div className="md__avatar">{user.username.slice(0, 2).toUpperCase()}</div>
                <span className="md__review-form-user">{user.username}</span>
              </div>
              <textarea
                className="md__review-input"
                placeholder={userReview ? 'Update your review…' : 'Share your thoughts on this film…'}
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <div className="md__review-actions">
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
            <button className="md__signin-cta md__signin-cta--wide" onClick={() => navigate('/auth')}>
              Sign in to write a review →
            </button>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <p className="md__reviews-empty">No reviews yet. Be the first.</p>
          ) : (
            <div className="md__reviews-list">
              {reviews.map(review => {
                const isOwn  = review.username === user?.username;
                const date   = new Date(review.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });
                const rStars = review.rating ? starStates(review.rating) : null;
                return (
                  <div key={review.id} className={`md__review-card ${isOwn ? 'md__review-card--own' : ''}`}>
                    <div className="md__avatar md__avatar--review">
                      {review.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="md__review-body">
                      <div className="md__review-meta">
                        <span className="md__review-username">
                          {review.username}
                          {isOwn && <span className="md__review-you">you</span>}
                        </span>
                        {rStars && (
                          <span className="md__review-stars">
                            {rStars.map((s, i) => (
                              <span key={i} className={`md__display-star md__display-star--${s} md__display-star--sm`}>★</span>
                            ))}
                          </span>
                        )}
                        <span className="md__review-date">{date}</span>
                      </div>
                      <p className="md__review-text">{review.comment}</p>
                      {/* Admin delete button — visible only to admins, on every review */}
                      {isAdmin && !isOwn && (
                        <button
                          className="md__review-delete"
                          onClick={() => handleAdminDeleteReview(review.id)}
                          title="Delete review (admin)"
                        >
                          Delete
                        </button>
                      )}
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
