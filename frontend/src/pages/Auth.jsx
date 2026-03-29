import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export default function Auth() {
  const [mode,    setMode]    = useState('login');   // 'login' | 'signup'
  const [form,    setForm]    = useState({ username: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate          = useNavigate();

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/');
      } else {
        await signup(form.username, form.email, form.password);
        navigate('/onboarding'); // take new users through questionnaire
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__bg" />

      <div className="auth__card fade-in">
        {/* Logo */}
        <div className="auth__logo">
          <span>🎬</span>
          <span>Movie Rank</span>
        </div>

        <p className="auth__subtitle">
          {mode === 'login'
            ? 'Welcome back. Sign in to your account.'
            : 'Create an account to start rating movies.'}
        </p>

        {/* Toggle */}
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

        {/* Form */}
        <form className="auth__form" onSubmit={handleSubmit}>
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

          {error && <p className="auth__error">{error}</p>}

          <button className="auth__submit" type="submit" disabled={loading}>
            {loading
              ? <span className="auth__submit-spinner" />
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

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
