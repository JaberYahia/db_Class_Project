import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendations } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';
import './Recommendations.css';

export default function Recommendations() {
  const { user }                  = useAuth();
  const navigate                  = useNavigate();
  const [recs,    setRecs]        = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    getRecommendations()
      .then(({ data }) => setRecs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <div className="recs"><div className="spinner" /></div>;

  return (
    <div className="recs fade-in">
      <div className="recs__inner">
        <div className="recs__header">
          <h1 className="recs__title">
            For You
            <span className="recs__badge">AI Picks</span>
          </h1>
          <p className="recs__sub">
            Personalized picks based on your ratings and users with similar taste.
          </p>
        </div>

        {recs.length === 0 ? (
          <div className="recs__empty">
            <div className="recs__empty-icon">🎬</div>
            <h3>Not enough data yet</h3>
            <p>Rate at least 5 movies and we'll generate your personalized picks.</p>
            <button className="recs__cta" onClick={() => navigate('/')}>
              Browse Movies →
            </button>
          </div>
        ) : (
          <div className="recs__grid">
            {recs.map((movie) => (
              <MovieCard key={movie.omdb_id || movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
