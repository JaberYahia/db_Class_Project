import { useRef } from 'react';
import MovieCard from './MovieCard';
import './MovieRow.css';

export default function MovieRow({ title, movies, badge }) {
  const scrollRef = useRef(null);

  function scroll(dir) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 540, behavior: 'smooth' });
    }
  }

  if (!movies || movies.length === 0) return null;

  return (
    <section className="movie-row">
      <div className="movie-row__header">
        <h2 className="movie-row__title">
          {title}
          {badge && <span className="movie-row__badge">{badge}</span>}
        </h2>
        <div className="movie-row__arrows">
          <button className="movie-row__arrow" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
          <button className="movie-row__arrow" onClick={() => scroll(1)}  aria-label="Scroll right">›</button>
        </div>
      </div>

      <div className="movie-row__track" ref={scrollRef}>
        {movies.map((movie) => (
          <MovieCard key={movie.omdb_id || movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
