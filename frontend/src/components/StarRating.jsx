// ─────────────────────────────────────────────────────────────────────────────
// components/StarRating.jsx — Interactive 1-10 star rating widget
//
// Props:
//   value    — the currently saved rating (0 = none)
//   onChange — callback fired when the user clicks a star: onChange(rating)
//   readonly — if true, disables hover and click (used for display-only ratings)
//   size     — 'sm' | 'md' | 'lg' — controls the star size via CSS class
//
// Hover behaviour: hovering over a star previews the rating before clicking.
//   e.g. hovering over star 7 fills stars 1-7 and shows "7/10" as a label.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import './StarRating.css';

export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0); // Which star the mouse is currently over (0 = none)

  // What to display: prefer hover preview, then saved value, then nothing
  const display = hovered || value || 0;

  return (
    <div className={`star-rating star-rating--${size} ${readonly ? 'star-rating--readonly' : ''}`}>

      {/* Render one button per star (1 through 10) */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          type="button"
          // Star is "on" (filled/highlighted) if its number is ≤ the display value
          className={`star-rating__star ${n <= display ? 'star-rating__star--on' : ''}`}
          onClick={!readonly ? () => onChange(n) : undefined}         // Save rating on click
          onMouseEnter={!readonly ? () => setHovered(n) : undefined}  // Preview on hover
          onMouseLeave={!readonly ? () => setHovered(0) : undefined}  // Clear preview on leave
          aria-label={`Rate ${n} out of 10`}                         // Accessibility label
        >
          ★
        </button>
      ))}

      {/* Show numeric label (e.g. "7/10") next to the stars when any are active */}
      {display > 0 && (
        <span className="star-rating__label">{display}/10</span>
      )}
    </div>
  );
}
