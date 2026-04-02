// ─────────────────────────────────────────────────────────────────────────────
// hooks/useAuth.js — Global authentication state via React Context
//
// HOW IT WORKS:
//   • <AuthProvider> wraps the entire app (in App.jsx) and holds auth state.
//   • Any component can call useAuth() to access { user, login, signup, logout }.
//   • The JWT token and user object are persisted in localStorage so the user
//     stays logged in after a page refresh.
//
// WHY CONTEXT?
//   Without context, we'd have to pass user state down through every component
//   as props ("prop drilling"). Context lets any component access it directly.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, createContext, useContext } from 'react';
import { login as apiLogin, signup as apiSignup } from '../services/api';

// Create the context — this is the "global store" for auth state.
// The null default is only used if useAuth() is called outside of AuthProvider.
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
// Wrap your component tree with this to make auth state available everywhere.

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);  // The logged-in user object { id, username, email }
  const [loading, setLoading] = useState(true);  // True while restoring session from localStorage

  // On first render, try to restore the user session from localStorage.
  // This runs once (empty dependency array) and keeps the user logged in
  // even after a full page refresh.
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored)); // Restore user from previous session
    setLoading(false); // Done checking — app can now render
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  // Sends credentials to the API, saves the returned token and user to
  // localStorage, and updates the in-memory user state.
  async function login(email, password) {
    const { data } = await apiLogin({ email, password });
    localStorage.setItem('token', data.token);        // Save JWT for API requests
    localStorage.setItem('user',  JSON.stringify(data.user)); // Save user for session restore
    setUser(data.user);  // Update React state → triggers re-render throughout the app
    return data;
  }

  // ── Signup ─────────────────────────────────────────────────────────────────
  // Same as login but calls the signup endpoint. New users are also immediately
  // logged in (the backend issues a token on successful registration).
  async function signup(username, email, password) {
    const { data } = await apiSignup({ username, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  // Clears token and user from both localStorage and React state.
  // After this, all protected routes will redirect to /auth.
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null); // Clears the user → triggers redirect in ProtectedRoute
  }

  // isAdmin is derived from the user object — no extra API call needed because
  // the role is included in the JWT payload and returned in the user object.
  const isAdmin = user?.role === 'admin';

  // Provide { user, isAdmin, loading, login, signup, logout } to all child components
  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
// Call this in any component to access auth state.
// Example: const { user, logout } = useAuth();

export function useAuth() {
  return useContext(AuthContext);
}
