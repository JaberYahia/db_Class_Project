// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root component: routing and global providers
//
// Structure:
//   <AuthProvider>        — Makes auth state (user, login, logout) available everywhere
//     <BrowserRouter>     — Enables React Router URL-based navigation
//       <Navbar />        — Always visible at the top
//       <Routes>          — Renders the page that matches the current URL
//         /auth           → Login / Signup page
//         /onboarding     → New user setup wizard (protected)
//         /               → Home feed (public)
//         /movie/:omdbId  → Movie detail page (public)
//         /recommendations→ AI picks (protected)
//         /genres         → Browse by genre (public)
//         /profile        → User ratings history (protected)
//         *               → Anything else redirects to Home
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';

export const PosterBackdropContext = createContext(null);
import Navbar          from './components/Navbar';
import Auth            from './pages/Auth';
import Onboarding      from './pages/Onboarding';
import Home            from './pages/Home';
import MovieDetail     from './pages/MovieDetail';
import Recommendations  from './pages/Recommendations';
import Genres           from './pages/Genres';
import Profile          from './pages/Profile';
import AdminDashboard   from './pages/AdminDashboard';

// ─── Protected Route ─────────────────────────────────────────────────────────
// Wraps any page that should only be accessible when the user is logged in.
// While auth state is still loading from localStorage, shows a spinner.
// If the user is not logged in, redirects them to /auth.

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />;
  return user ? children : <Navigate to="/auth" replace />;
}

// ─── Admin Route ──────────────────────────────────────────────────────────────
// Extends ProtectedRoute — also requires role === 'admin'.
// Non-admins who are logged in are redirected to home rather than /auth.

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />;
  if (!user)    return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/"    replace />;
  return children;
}

// ─── App Routes ───────────────────────────────────────────────────────────────
// Separated from App so it can use the useAuth hook, which requires being
// inside the AuthProvider. (Hooks can't be called in the same component that
// renders the Provider.)

function AppRoutes() {
  const { user } = useAuth();
  const [bgPoster, setBgPoster] = useState(null);

  return (
    <PosterBackdropContext.Provider value={setBgPoster}>
      <div
        className="app-backdrop"
        style={{
          backgroundImage: bgPoster ? `url(${bgPoster})` : 'none',
          opacity: bgPoster ? 1 : 0,
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/auth"            element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/onboarding"      element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/"                element={<Home />} />
        <Route path="/movie/:omdbId"   element={<MovieDetail />} />
        <Route path="/genres"          element={<Genres />} />
        <Route path="/admin"           element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </PosterBackdropContext.Provider>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
// The top-level component exported to index.js.
// Wraps everything in the auth context and the router so all child components
// can access authentication state and navigation.

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
