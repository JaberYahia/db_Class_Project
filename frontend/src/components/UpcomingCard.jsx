import './UpcomingCard.css';

export default function UpcomingCard({ movie }) {
  const formattedDate = movie.release_date
    ? new Date(movie.release_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : 'Coming Soon';

  return (
    <div className="upcoming-card">
      <div className="upcoming-card__poster-wrap">
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title} className="upcoming-card__poster" loading="lazy" />
          : <div className="upcoming-card__poster-empty">🎬</div>
        }
        <div className="upcoming-card__date-badge">{formattedDate}</div>
      </div>
      <div className="upcoming-card__info">
        <p className="upcoming-card__title">{movie.title}</p>
      </div>
    </div>
  );
}
