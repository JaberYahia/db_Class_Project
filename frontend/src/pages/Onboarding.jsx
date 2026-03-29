import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovies, submitRating } from '../services/api';
import { useEffect } from 'react';
import StarRating from '../components/StarRating';
import './Onboarding.css';

const GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Romance', 'Horror', 'Adventure', 'Crime', 'Biography', 'Western', 'Animation'];

const STEPS = ['welcome', 'genres', 'rate', 'done'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step,         setStep]        = useState(0);
  const [likedGenres,  setLikedGenres] = useState([]);
  const [movies,       setMovies]      = useState([]);
  const [ratings,      setRatings]     = useState({});
  const [saving,       setSaving]      = useState(false);

  useEffect(() => {
    getMovies().then(({ data }) => setMovies(data)).catch(() => {});
  }, []);

  // Filter movies by selected genres for the rating step
  const moviesForRating = movies.filter((m) =>
    likedGenres.length === 0 ||
    likedGenres.some((g) => m.genre?.toLowerCase().includes(g.toLowerCase()))
  ).slice(0, 12);

  function toggleGenre(genre) {
    setLikedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }

  async function handleFinish() {
    setSaving(true);
    const entries = Object.entries(ratings).filter(([, v]) => v > 0);
    try {
      await Promise.all(
        entries.map(([movie_id, rating]) => submitRating({ movie_id: Number(movie_id), rating }))
      );
    } catch {
      // partial failures are fine, user can rate more later
    } finally {
      setSaving(false);
      navigate('/');
    }
  }

  const currentStep = STEPS[step];

  return (
    <div className="onboarding">
      <div className="onboarding__bg" />

      <div className="onboarding__card fade-in">

        {/* Progress bar */}
        <div className="onboarding__progress">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`onboarding__progress-dot ${i <= step ? 'onboarding__progress-dot--done' : ''}`}
            />
          ))}
        </div>

        {/* ── Step 0: Welcome ── */}
        {currentStep === 'welcome' && (
          <div className="onboarding__step fade-in">
            <div className="onboarding__emoji">🎬</div>
            <h1 className="onboarding__heading">Welcome to Movie Rank</h1>
            <p className="onboarding__body">
              Let's personalize your experience. We'll ask about your favorite genres
              and a few movies you've seen to build your taste profile.
            </p>
            <p className="onboarding__body onboarding__body--dim">Takes about 2 minutes.</p>
            <button className="onboarding__btn" onClick={() => setStep(1)}>
              Let's go →
            </button>
          </div>
        )}

        {/* ── Step 1: Genre Selection ── */}
        {currentStep === 'genres' && (
          <div className="onboarding__step fade-in">
            <h2 className="onboarding__heading">What genres do you enjoy?</h2>
            <p className="onboarding__body">Pick as many as you like.</p>
            <div className="onboarding__genres">
              {GENRES.map((g) => (
                <button
                  key={g}
                  className={`onboarding__genre-chip ${likedGenres.includes(g) ? 'onboarding__genre-chip--selected' : ''}`}
                  onClick={() => toggleGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="onboarding__actions">
              <button className="onboarding__btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="onboarding__btn" onClick={() => setStep(2)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Rate Movies ── */}
        {currentStep === 'rate' && (
          <div className="onboarding__step fade-in">
            <h2 className="onboarding__heading">Rate movies you've seen</h2>
            <p className="onboarding__body">Skip any you haven't watched. More ratings = better recs.</p>

            <div className="onboarding__movies">
              {moviesForRating.map((movie) => (
                <div key={movie.id} className="onboarding__movie-row">
                  {movie.poster_url
                    ? <img src={movie.poster_url} alt={movie.title} className="onboarding__movie-poster" />
                    : <div className="onboarding__movie-poster onboarding__movie-poster--empty">🎬</div>
                  }
                  <div className="onboarding__movie-info">
                    <p className="onboarding__movie-title">{movie.title}</p>
                    <p className="onboarding__movie-meta">{movie.year} · {movie.genre?.split(',')[0]}</p>
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
              <button className="onboarding__btn" onClick={() => setStep(3)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {currentStep === 'done' && (
          <div className="onboarding__step onboarding__step--center fade-in">
            <div className="onboarding__emoji">🏆</div>
            <h2 className="onboarding__heading">You're all set!</h2>
            <p className="onboarding__body">
              We've captured{' '}
              <strong style={{ color: 'var(--gold-500)' }}>
                {Object.values(ratings).filter((v) => v > 0).length} ratings
              </strong>
              . Your personalized recommendations are ready.
            </p>
            <button className="onboarding__btn" onClick={handleFinish} disabled={saving}>
              {saving ? 'Saving...' : 'Go to Home →'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
