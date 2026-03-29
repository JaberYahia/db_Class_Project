import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRatings } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './Profile.css';

export default function Profile() {
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [ratings,  setRatings]    = useState([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    getMyRatings()
      .then(({ data }) => setRatings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  function handleLogout() {
    logout();
    navigate('/auth');
  }

  if (loading) return <div className="profile"><div className="spinner" /></div>;

  return (
    <div className="profile fade-in">
      <div className="profile__inner">

        {/* Header */}
        <div className="profile__header">
          <div className="profile__avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="profile__info">
            <h1 className="profile__username">{user?.username}</h1>
            <p className="profile__email">{user?.email}</p>
          </div>
          <button className="profile__logout" onClick={handleLogout}>Sign out</button>
        </div>

        {/* Stats */}
        <div className="profile__stats">
          <div className="profile__stat">
            <span className="profile__stat-value">{ratings.length}</span>
            <span className="profile__stat-label">Movies Rated</span>
          </div>
          {ratings.length > 0 && (
            <div className="profile__stat">
              <span className="profile__stat-value">
                {(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)}
              </span>
              <span className="profile__stat-label">Avg Rating</span>
            </div>
          )}
        </div>

        {/* Ratings list */}
        <h2 className="profile__section-title">Your Ratings</h2>

        {ratings.length === 0 ? (
          <div className="profile__empty">
            <p>You haven't rated any movies yet.</p>
            <button className="profile__cta" onClick={() => navigate('/')}>
              Browse Movies →
            </button>
          </div>
        ) : (
          <div className="profile__list">
            {ratings.map((r) => (
              <div
                key={r.id}
                className="profile__item"
                onClick={() => navigate(`/movie/${r.omdb_id}`)}
              >
                {r.poster_url
                  ? <img src={r.poster_url} alt={r.title} className="profile__item-poster" />
                  : <div className="profile__item-poster profile__item-poster--empty">🎬</div>
                }
                <div className="profile__item-info">
                  <p className="profile__item-title">{r.title}</p>
                  <p className="profile__item-meta">{r.year} · {r.genre?.split(',')[0]}</p>
                </div>
                <div className="profile__item-rating">
                  <span className="profile__item-stars">★</span>
                  <span className="profile__item-score">{r.rating}<span className="profile__item-max">/10</span></span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
