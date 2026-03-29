import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { searchMovies } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout }            = useAuth();
  const navigate                    = useNavigate();
  const location                    = useLocation();
  const [query,       setQuery]     = useState('');
  const [results,     setResults]   = useState([]);
  const [searching,   setSearching] = useState(false);
  const [showDropdown,setShowDrop]  = useState(false);
  const searchRef                   = useRef(null);
  const debounceRef                 = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSearch(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await searchMovies(val);
        setResults(data.slice(0, 6));
        setShowDrop(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  function handleResultClick(omdbId) {
    setQuery('');
    setResults([]);
    setShowDrop(false);
    navigate(`/movie/${omdbId}`);
  }

  function handleLogout() {
    logout();
    navigate('/auth');
  }

  const navLinks = [
    { to: '/',               label: 'Home' },
    { to: '/recommendations',label: 'For You' },
    { to: '/genres',         label: 'Genres' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__inner">

        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🎬</span>
          <span className="navbar__logo-text">Movie Rank</span>
        </Link>

        {/* Nav Links */}
        <ul className="navbar__links">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`navbar__link ${location.pathname === to ? 'navbar__link--active' : ''}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Search */}
        <div className="navbar__search" ref={searchRef}>
          <div className="navbar__search-wrap">
            <span className="navbar__search-icon">🔍</span>
            <input
              className="navbar__search-input"
              type="text"
              placeholder="Search movies..."
              value={query}
              onChange={handleSearch}
            />
            {searching && <span className="navbar__search-spinner" />}
          </div>
          {showDropdown && results.length > 0 && (
            <ul className="navbar__dropdown">
              {results.map((m) => (
                <li
                  key={m.omdb_id}
                  className="navbar__dropdown-item"
                  onClick={() => handleResultClick(m.omdb_id)}
                >
                  {m.poster_url
                    ? <img src={m.poster_url} alt={m.title} className="navbar__dropdown-poster" />
                    : <div className="navbar__dropdown-poster navbar__dropdown-poster--empty">?</div>
                  }
                  <div>
                    <p className="navbar__dropdown-title">{m.title}</p>
                    <p className="navbar__dropdown-year">{m.year}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User */}
        {user ? (
          <div className="navbar__user">
            <Link to="/profile" className="navbar__username">
              {user.username}
            </Link>
            <button className="navbar__logout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/auth" className="navbar__signin">Sign In</Link>
        )}

      </div>
    </nav>
  );
}
