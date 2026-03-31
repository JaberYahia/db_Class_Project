// ─────────────────────────────────────────────────────────────────────────────
// components/Navbar.jsx — Top navigation bar
//
// Features:
//   • Logo linking to home
//   • Nav links (Home, For You, Genres) with active-state highlighting
//   • Live OMDB search with 400ms debounce and a dropdown of results
//   • User section: username → profile link, Sign out button (or Sign In link)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { searchMovies } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout }             = useAuth();   // Current user and logout function
  const navigate                     = useNavigate();
  const location                     = useLocation(); // Used to highlight the active nav link
  const [query,        setQuery]     = useState('');  // Current text in the search input
  const [results,      setResults]   = useState([]);  // OMDB search results
  const [searching,    setSearching] = useState(false); // Shows a spinner while fetching
  const [showDropdown, setShowDrop]  = useState(false); // Controls the results dropdown visibility
  const searchRef  = useRef(null); // Ref to the search container for click-outside detection
  const debounceRef = useRef(null); // Ref to store the debounce timer ID

  // Close the search dropdown when the user clicks anywhere outside of it
  useEffect(() => {
    function handler(e) {
      // If the click was outside the search box, hide the dropdown
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler); // Cleanup on unmount
  }, []);

  // Handle search input changes with a 400ms debounce.
  // Debouncing means we wait until the user stops typing before making the API call,
  // avoiding a new request on every single keystroke.
  function handleSearch(e) {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current); // Cancel any previously scheduled search

    if (!val.trim()) {
      setResults([]);    // Clear results if the input is empty
      setShowDrop(false);
      return;
    }

    // Schedule a search to run 400ms after the user stops typing
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await searchMovies(val);
        setResults(data.slice(0, 6)); // Cap dropdown at 6 results for cleanliness
        setShowDrop(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  // When a search result is clicked, navigate to that movie's detail page
  function handleResultClick(omdbId) {
    setQuery('');       // Clear the search input
    setResults([]);     // Clear results
    setShowDrop(false); // Hide dropdown
    navigate(`/movie/${omdbId}`);
  }

  // Log the user out and redirect to the auth page
  function handleLogout() {
    logout();
    navigate('/auth');
  }

  // Define nav links in an array so they're easy to loop over
  const navLinks = [
    { to: '/',                label: 'Home'    },
    { to: '/recommendations', label: 'For You' },
    { to: '/genres',          label: 'Genres'  },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__inner">

        {/* Logo — always links back to the home page */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🎬</span>
          <span className="navbar__logo-text">Movie Rank</span>
        </Link>

        {/* Nav Links — the active link gets a highlighted style */}
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

        {/* Search Box with live OMDB results dropdown */}
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

          {/* Dropdown appears when results are available */}
          {showDropdown && results.length > 0 && (
            <ul className="navbar__dropdown">
              {results.map((m) => (
                <li
                  key={m.omdb_id}
                  className="navbar__dropdown-item"
                  onClick={() => handleResultClick(m.omdb_id)}
                >
                  {/* Show poster thumbnail or a placeholder if no image */}
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

        {/* User Section — shows username/sign-out if logged in, sign-in link otherwise */}
        {user ? (
          <div className="navbar__user">
            <Link to="/profile" className="navbar__username">
              {user.username} {/* Clicking username navigates to profile page */}
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
