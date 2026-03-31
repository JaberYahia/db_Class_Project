// ─────────────────────────────────────────────────────────────────────────────
// pages/Onboarding.jsx — New user setup wizard (4 steps)
//
// Shown once after a new user signs up. Helps bootstrap their taste profile
// so the recommendation engine has data to work with immediately.
//
// Steps:
//   0. welcome — Introduction screen
//   1. pick    — Click every movie you've seen (searchable catalog)
//   2. rate    — Rate the selected movies with the star widget
//   3. done    — Confirmation, save all ratings, then go to home
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovies, submitRating } from '../services/api';
import StarRating from '../components/StarRating';
import './Onboarding.css';

// Step keys — drive the conditional rendering below
const STEPS = ['welcome', 'pick', 'rate', 'done'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step,         setStep]        = useState(0);          // Index into STEPS array
  const [movies,       setMovies]      = useState([]);         // All movies from the database
  const [selectedIds,  setSelectedIds] = useState(new Set()); // IDs of movies the user has seen
  const [ratings,      setRatings]     = useState({});         // { movie.id: rating } built in step 2
  const [search,       setSearch]      = useState('');         // Search filter for the catalog
  const [saving,       setSaving]      = useState(false);

  // Fetch all movies when the component mounts — used in both the pick and rate steps
  useEffect(() => {
    getMovies().then(({ data }) => setMovies(data)).catch(() => {});
  }, []);

  // Filter movies for the catalog based on the search input.
  // Matches against both title and genre for flexible search.
  const filteredMovies = movies.filter((m) =>
    search.trim() === '' ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.genre?.toLowerCase().includes(search.toLowerCase())
  );

  // Determine which movies to show in the rating step:
  // If the user selected specific movies in step 1, only rate those.
  // If they skipped selection, show the first 12 movies as a default sample.
  const moviesToRate = selectedIds.size > 0
    ? movies.filter((m) => selectedIds.has(m.id))
    : movies.slice(0, 12);

  // Toggle a movie's selection state — adds it if not selected, removes it if already selected
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id); // Toggle membership
      return next;
    });
  }

  // Called on the final step — submits all non-zero ratings to the backend in parallel
  async function handleFinish() {
    setSaving(true);
    const entries = Object.entries(ratings).filter(([, v]) => v > 0); // Only save actual ratings
    try {
      // Promise.allSettled continues even if some individual submissions fail
      await Promise.allSettled(
        entries.map(([movie_id, rating]) =>
          submitRating({ movie_id: Number(movie_id), rating })
        )
      );
    } finally {
      setSaving(false);
      navigate('/'); // Always redirect home regardless of partial failures
    }
  }

  const currentStep = STEPS[step]; // String name of the active step

  return (
    <div className="onboarding">
      <div className="onboarding__bg" />

      <div className="onboarding__card fade-in">

        {/* Progress dots — one per step, filled up to and including the current step */}
        <div className="onboarding__progress">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`onboarding__progress-dot ${i <= step ? 'onboarding__progress-dot--done' : ''}`}
            />
          ))}
        </div>

        {/* ── Step 0: Welcome ────────────────────────────────────────────────── */}
        {currentStep === 'welcome' && (
          <div className="onboarding__step fade-in">
            <div className="onboarding__emoji">🎬</div>
            <h1 className="onboarding__heading">Welcome to Movie Rank</h1>
            <p className="onboarding__body">
              Let's build your taste profile. Tell us what you've watched and
              rate them — we'll use that to recommend movies you'll actually love.
            </p>
            <p className="onboarding__body onboarding__body--dim">Takes about 2 minutes.</p>
            <button className="onboarding__btn" onClick={() => setStep(1)}>
              Let's go →
            </button>
          </div>
        )}

        {/* ── Step 1: Pick movies you've seen ────────────────────────────────── */}
        {currentStep === 'pick' && (
          <div className="onboarding__step fade-in">
            <h2 className="onboarding__heading">What have you watched?</h2>
            <p className="onboarding__body">
              Click every movie you've seen. We'll ask you to rate them next.
            </p>

            {/* Search input — filters the catalog grid in real-time */}
            <div className="onboarding__search-wrap">
              <span className="onboarding__search-icon">🔍</span>
              <input
                className="onboarding__search"
                type="text"
                placeholder="Search by title or genre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Show how many movies are currently selected */}
            {selectedIds.size > 0 && (
              <p className="onboarding__selected-count">
                ✓ {selectedIds.size} movie{selectedIds.size !== 1 ? 's' : ''} selected
              </p>
            )}

            {/* Poster grid — clicking a poster toggles it as selected/seen */}
            <div className="onboarding__catalog">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  className={`onboarding__catalog-movie ${selectedIds.has(movie.id) ? 'onboarding__catalog-movie--selected' : ''}`}
                  onClick={() => toggleSelect(movie.id)}
                >
                  {movie.poster_url
                    ? <img src={movie.poster_url} alt={movie.title} loading="lazy" />
                    : <div className="onboarding__catalog-movie__empty">🎬</div>
                  }
                  <div className="onboarding__catalog-movie__overlay">{movie.title}</div>
                  <div className="onboarding__catalog-movie__check">✓</div>
                </div>
              ))}
            </div>

            <div className="onboarding__actions">
              <button className="onboarding__btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="onboarding__btn" onClick={() => setStep(2)}>
                {/* Button label changes based on whether the user selected any movies */}
                {selectedIds.size > 0
                  ? `Rate ${selectedIds.size} movie${selectedIds.size !== 1 ? 's' : ''} →`
                  : 'Skip →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Rate selected movies ───────────────────────────────────── */}
        {currentStep === 'rate' && (
          <div className="onboarding__step fade-in">
            <h2 className="onboarding__heading">
              {selectedIds.size > 0 ? 'Rate what you selected' : "Rate movies you've seen"}
            </h2>
            <p className="onboarding__body">
              Skip any you haven't watched. More ratings = better recommendations.
            </p>

            {/* List of movies to rate — each has a StarRating widget */}
            <div className="onboarding__movies">
              {moviesToRate.map((movie) => (
                <div key={movie.id} className="onboarding__movie-row">
                  {movie.poster_url
                    ? <img src={movie.poster_url} alt={movie.title} className="onboarding__movie-poster" />
                    : <div className="onboarding__movie-poster onboarding__movie-poster--empty">🎬</div>
                  }
                  <div className="onboarding__movie-info">
                    <p className="onboarding__movie-title">{movie.title}</p>
                    <p className="onboarding__movie-meta">{movie.year} · {movie.genre?.split(',')[0]}</p>
                    {/* Rating stored in state keyed by movie.id — saved to DB on finish */}
                    <StarRating
                      value={ratings[movie.id] || 0}
                      onChange={(val) => setRatings((r) => ({ ...r, [movie.id]: val }))}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="onboarding__actions">
              <button className="onboarding__btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="onboarding__btn" onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ───────────────────────────────────────────────────── */}
        {currentStep === 'done' && (
          <div className="onboarding__step onboarding__step--center fade-in">
            <div className="onboarding__emoji">🏆</div>
            <h2 className="onboarding__heading">You're all set!</h2>
            <p className="onboarding__body">
              We've captured{' '}
              <strong style={{ color: 'var(--gold-500)' }}>
                {/* Count entries where the user gave a non-zero rating */}
                {Object.values(ratings).filter((v) => v > 0).length} ratings
              </strong>
              . Your personalized recommendations are ready.
            </p>
            {/* Clicking submits all ratings and navigates home */}
            <button className="onboarding__btn" onClick={handleFinish} disabled={saving}>
              {saving ? 'Saving…' : 'Go to Home →'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
