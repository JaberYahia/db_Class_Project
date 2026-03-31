// ─────────────────────────────────────────────────────────────────────────────
// components/MovieRow.jsx — Horizontally scrolling row of MovieCards
//
// Props:
//   title  — section heading displayed above the row (e.g. "Top Rated")
//   movies — array of movie objects to display
//   badge  — optional label shown next to the title (e.g. "AI Picks")
//
// The row supports left/right arrow buttons that smoothly scroll the track
// by 540px per click (roughly the width of two cards).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';
import MovieCard from './MovieCard';
import './MovieRow.css';

export default function MovieRow({ title, movies, badge }) {
  // scrollRef points to the scrollable div so we can programmatically scroll it
  const scrollRef = useRef(null);

  // Scroll the track left (dir = -1) or right (dir = 1) by 540 pixels
  function scroll(dir) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 540, behavior: 'smooth' }); // smooth = animated scroll
    }
  }

  // Don't render anything if there are no movies to show
  if (!movies || movies.length === 0) return null;

  return (
    <section className="movie-row">

      {/* Row header: title on the left, scroll arrows on the right */}
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

      {/* Scrollable track — overflow-x is hidden in CSS, scrolled programmatically */}
      <div className="movie-row__track" ref={scrollRef}>
        {movies.map((movie) => (
          // Use omdb_id as key when available; fall back to internal id
          <MovieCard key={movie.omdb_id || movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
