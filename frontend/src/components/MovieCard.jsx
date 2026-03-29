import { useNavigate } from 'react-router-dom';
import './MovieCard.css';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();

  const avgRating = movie.avg_rating || movie.predicted_rating || null;
  const stars     = avgRating ? Math.round(avgRating / 2) : 0; // convert 1-10 → 1-5

  return (
    <div className="movie-card" onClick={() => navigate(`/movie/${movie.omdb_id}`)}>
      <div className="movie-card__poster-wrap">
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title} className="movie-card__poster" loading="lazy" />
          : <div className="movie-card__poster-empty">🎬</div>
        }
        {avgRating && (
          <div className="movie-card__badge">{avgRating}</div>
        )}
      </div>

      <div className="movie-card__info">
        <p className="movie-card__title">{movie.title}</p>
        <p className="movie-card__meta">{movie.year} · {movie.genre?.split(',')[0]}</p>
        {avgRating && (
          <div className="movie-card__stars">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`movie-card__star ${s <= stars ? 'movie-card__star--on' : ''}`}>★</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
