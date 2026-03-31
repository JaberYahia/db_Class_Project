// ─────────────────────────────────────────────────────────────────────────────
// pages/Auth.jsx — Login and Signup page
//
// This single page handles both modes:
//   • 'login'  — email + password → receive JWT, redirect to home
//   • 'signup' — username + email + password → receive JWT, redirect to onboarding
//
// The toggle at the top of the card switches between the two modes without
// navigating away from the page.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export default function Auth() {
  const [mode,    setMode]    = useState('login');  // Current form mode: 'login' or 'signup'
  const [form,    setForm]    = useState({ username: '', email: '', password: '' });
  const [error,   setError]   = useState('');       // Error message to display below the form
  const [loading, setLoading] = useState(false);    // Disables the submit button while the request is in-flight

  const { login, signup } = useAuth(); // Auth functions from the global context
  const navigate          = useNavigate();

  // Generic change handler — updates any field in the form object by name.
  // e.target.name matches the 'name' attribute on each <input> element.
  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(''); // Clear any previous error when the user starts typing
  }

  // Form submission — called when the user clicks "Sign In" or "Create Account"
  async function handleSubmit(e) {
    e.preventDefault(); // Prevent the browser's default form submission (page reload)
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/'); // Logged-in users go straight to the home page
      } else {
        await signup(form.username, form.email, form.password);
        navigate('/onboarding'); // New users go through the setup wizard first
      }
    } catch (err) {
      // Display the server's error message (e.g. "Email already in use.")
      // Fall back to a generic message if the response format is unexpected
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false); // Re-enable the submit button regardless of outcome
    }
  }

  return (
    <div className="auth">
      <div className="auth__bg" /> {/* Decorative background gradient */}

      <div className="auth__card fade-in">

        {/* App logo at top of card */}
        <div className="auth__logo">
          <span>🎬</span>
          <span>Movie Rank</span>
        </div>

        <p className="auth__subtitle">
          {mode === 'login'
            ? 'Welcome back. Sign in to your account.'
            : 'Create an account to start rating movies.'}
        </p>

        {/* Mode toggle: Sign In / Create Account */}
        <div className="auth__toggle">
          <button
            className={`auth__toggle-btn ${mode === 'login'  ? 'auth__toggle-btn--active' : ''}`}
            onClick={() => { setMode('login');  setError(''); }}
          >Sign In</button>
          <button
            className={`auth__toggle-btn ${mode === 'signup' ? 'auth__toggle-btn--active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >Create Account</button>
        </div>

        {/* Form fields */}
        <form className="auth__form" onSubmit={handleSubmit}>

          {/* Username field — only shown in signup mode */}
          {mode === 'signup' && (
            <div className="auth__field">
              <label className="auth__label">Username</label>
              <input
                className="auth__input"
                type="text"
                name="username"
                placeholder="e.g. moviebuff99"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="auth__field">
            <label className="auth__label">Email</label>
            <input
              className="auth__input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth__field">
            <label className="auth__label">Password</label>
            <input
              className="auth__input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Show any error returned from the server */}
          {error && <p className="auth__error">{error}</p>}

          {/* Submit button — shows a spinner while the request is in-flight */}
          <button className="auth__submit" type="submit" disabled={loading}>
            {loading
              ? <span className="auth__submit-spinner" />
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Text link to switch modes at the bottom of the card */}
        <p className="auth__switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          {' '}
          <button
            className="auth__switch-btn"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
