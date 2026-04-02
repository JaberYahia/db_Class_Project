import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveTmdbMovie } from '../services/api';
import './UpcomingCard.css';

export default function UpcomingCard({ movie }) {
  const navigate             = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const formattedDate = movie.release_date
    ? new Date(movie.release_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : 'Coming Soon';

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setNotFound(false);
    try {
      const { data } = await resolveTmdbMovie(movie.tmdb_id);
      navigate(`/movie/${data.omdb_id}`);
    } catch {
      setNotFound(true);
      setTimeout(() => setNotFound(false), 2500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`upcoming-card ${loading ? 'upcoming-card--loading' : ''}`} onClick={handleClick}>
      <div className="upcoming-card__poster-wrap">
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title} className="upcoming-card__poster" loading="lazy" />
          : <div className="upcoming-card__poster-empty">🎬</div>
        }
        <div className="upcoming-card__date-badge">{formattedDate}</div>
        {loading   && <div className="upcoming-card__spinner" />}
        {notFound  && <div className="upcoming-card__not-found">Not available yet</div>}
      </div>
      <div className="upcoming-card__info">
        <p className="upcoming-card__title">{movie.title}</p>
      </div>
    </div>
  );
}
