// pages/Profile.jsx — Letterboxd-inspired profile with Watched/Liked/Watchlist tabs

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRatings, getMyWatched, getMyLiked, getMyWatchlist, getMyReviews } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './Profile.css';

const TABS = ['films', 'watched', 'liked', 'watchlist', 'reviews'];

function starStates(ratingOutOf10) {
  const v = ratingOutOf10 / 2;
  return [1, 2, 3, 4, 5].map(i => {
    if (v >= i)       return 'full';
    if (v >= i - 0.5) return 'half';
    return 'empty';
  });
}

function StarDisplay({ rating, size = 'md' }) {
  return (
    <span className={`pf__stars pf__stars--${size}`}>
      {starStates(rating).map((state, i) => (
        <span key={i} className={`pf__star pf__star--${state}`}>★</span>
      ))}
    </span>
  );
}

// Reusable poster grid
function PosterGrid({ items, navigate, emptyMsg }) {
  if (items.length === 0) {
    return (
      <div className="pf__empty">
        <p>{emptyMsg}</p>
        <button className="pf__cta" onClick={() => navigate('/')}>Browse Movies</button>
      </div>
    );
  }
  return (
    <div className="pf__grid">
      {items.map(r => (
        <div
          key={r.omdb_id}
          className="pf__grid-card"
          onClick={() => navigate(`/movie/${r.omdb_id}`)}
        >
          {r.poster_url
            ? <img src={r.poster_url} alt={r.title} className="pf__grid-img" />
            : <div className="pf__grid-img pf__grid-img--empty">🎬</div>
          }
          <div className="pf__grid-overlay">
            <p className="pf__grid-title">{r.title}</p>
            {r.rating && <StarDisplay rating={r.rating} size="xs" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [activeTab, setActiveTab] = useState('films');

  const [ratings,   setRatings]   = useState([]);
  const [watched,   setWatched]   = useState([]);
  const [liked,     setLiked]     = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    Promise.allSettled([
      getMyRatings(),
      getMyWatched(),
      getMyLiked(),
      getMyWatchlist(),
      getMyReviews(),
    ]).then(([r, w, l, wl, rv]) => {
      if (r.status  === 'fulfilled') setRatings(r.value.data);
      if (w.status  === 'fulfilled') setWatched(w.value.data);
      if (l.status  === 'fulfilled') setLiked(l.value.data);
      if (wl.status === 'fulfilled') setWatchlist(wl.value.data);
      if (rv.status === 'fulfilled') setReviews(rv.value.data);
    }).finally(() => setLoading(false));
  }, [user, navigate]);

  const favorites = useMemo(() =>
    [...ratings].sort((a, b) => b.rating - a.rating).slice(0, 4),
    [ratings]
  );

  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  function handleLogout() { logout(); navigate('/auth'); }

  if (loading) return <div className="pf"><div className="spinner" /></div>;

  const tabCounts = {
    films:     ratings.length,
    watched:   watched.length,
    liked:     liked.length,
    watchlist: watchlist.length,
    reviews:   reviews.length,
  };

  return (
    <div className="pf fade-in">

      {/* ── Banner ── */}
      <div className="pf__banner">
        {favorites[0]?.poster_url && (
          <div
            className="pf__banner-bg"
            style={{ backgroundImage: `url(${favorites[0].poster_url})` }}
          />
        )}
        <div className="pf__banner-gradient" />
      </div>

      <div className="pf__wrap">

        {/* ── Identity row ── */}
        <div className="pf__identity">
          <div className="pf__avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="pf__meta">
            <h1 className="pf__username">{user?.username}</h1>
            <p className="pf__email">{user?.email}</p>
          </div>
          <button className="pf__logout" onClick={handleLogout}>Sign out</button>
        </div>

        {/* ── Stats strip ── */}
        <div className="pf__stats">
          <div className="pf__stat">
            <span className="pf__stat-value">{ratings.length}</span>
            <span className="pf__stat-label">Rated</span>
          </div>
          <div className="pf__stat">
            <span className="pf__stat-value">{watched.length}</span>
            <span className="pf__stat-label">Watched</span>
          </div>
          <div className="pf__stat">
            <span className="pf__stat-value">{liked.length}</span>
            <span className="pf__stat-label">Liked</span>
          </div>
          <div className="pf__stat">
            <span className="pf__stat-value">{watchlist.length}</span>
            <span className="pf__stat-label">Watchlist</span>
          </div>
          {avgRating && (
            <div className="pf__stat">
              <span className="pf__stat-value">{avgRating}</span>
              <span className="pf__stat-label">Avg Rating</span>
            </div>
          )}
        </div>

        {/* ── Favorite Films ── */}
        {favorites.length > 0 && (
          <section className="pf__section">
            <h2 className="pf__section-heading">Favorite Films</h2>
            <div className="pf__favorites">
              {favorites.map(r => (
                <div
                  key={r.omdb_id}
                  className="pf__fav-card"
                  onClick={() => navigate(`/movie/${r.omdb_id}`)}
                >
                  {r.poster_url
                    ? <img src={r.poster_url} alt={r.title} className="pf__fav-img" />
                    : <div className="pf__fav-img pf__fav-img--empty">🎬</div>
                  }
                  <div className="pf__fav-overlay">
                    <StarDisplay rating={r.rating} size="sm" />
                  </div>
                </div>
              ))}
              {Array.from({ length: 4 - favorites.length }).map((_, i) => (
                <div key={`ghost-${i}`} className="pf__fav-card pf__fav-card--ghost" />
              ))}
            </div>
          </section>
        )}

        {/* ── Tabs ── */}
        <div className="pf__tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`pf__tab ${activeTab === tab ? 'pf__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="pf__tab-count">{tabCounts[tab]}</span>
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="pf__tab-content">
          {activeTab === 'films' && (
            <PosterGrid
              items={ratings}
              navigate={navigate}
              emptyMsg="You haven't rated any films yet."
            />
          )}
          {activeTab === 'watched' && (
            <PosterGrid
              items={watched}
              navigate={navigate}
              emptyMsg="You haven't marked any films as watched yet."
            />
          )}
          {activeTab === 'liked' && (
            <PosterGrid
              items={liked}
              navigate={navigate}
              emptyMsg="You haven't liked any films yet."
            />
          )}
          {activeTab === 'watchlist' && (
            <PosterGrid
              items={watchlist}
              navigate={navigate}
              emptyMsg="Your watchlist is empty."
            />
          )}
          {activeTab === 'reviews' && (
            reviews.length === 0 ? (
              <div className="pf__empty">
                <p>You haven't written any reviews yet.</p>
                <button className="pf__cta" onClick={() => navigate('/')}>Browse Movies</button>
              </div>
            ) : (
              <div className="pf__review-list">
                {reviews.map(r => (
                  <div
                    key={r.id}
                    className="pf__review-row"
                    onClick={() => navigate(`/movie/${r.omdb_id}`)}
                  >
                    {r.poster_url
                      ? <img src={r.poster_url} alt={r.title} className="pf__review-poster" />
                      : <div className="pf__review-poster pf__review-poster--empty">🎬</div>
                    }
                    <div className="pf__review-body">
                      <div className="pf__review-top">
                        <span className="pf__review-title">{r.title}</span>
                        <span className="pf__review-year">{r.year}</span>
                        {r.rating && (
                          <span className="pf__review-stars">
                            {starStates(r.rating).map((s, i) => (
                              <span key={i} className={`pf__star pf__star--${s} pf__star--sm`}>★</span>
                            ))}
                          </span>
                        )}
                        <span className="pf__review-date">
                          {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="pf__review-comment">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
