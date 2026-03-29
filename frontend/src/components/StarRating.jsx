import { useState } from 'react';
import './StarRating.css';

export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);

  const display = hovered || value || 0;

  return (
    <div className={`star-rating star-rating--${size} ${readonly ? 'star-rating--readonly' : ''}`}>
      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-rating__star ${n <= display ? 'star-rating__star--on' : ''}`}
          onClick={!readonly ? () => onChange(n) : undefined}
          onMouseEnter={!readonly ? () => setHovered(n) : undefined}
          onMouseLeave={!readonly ? () => setHovered(0) : undefined}
          aria-label={`Rate ${n} out of 10`}
        >
          ★
        </button>
      ))}
      {display > 0 && (
        <span className="star-rating__label">{display}/10</span>
      )}
    </div>
  );
}
