import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar          from './components/Navbar';
import Auth            from './pages/Auth';
import Onboarding      from './pages/Onboarding';
import Home            from './pages/Home';
import MovieDetail     from './pages/MovieDetail';
import Recommendations from './pages/Recommendations';
import Genres          from './pages/Genres';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />;
  return user ? children : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/auth"            element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/onboarding"      element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/"                element={<Home />} />
        <Route path="/movie/:omdbId"   element={<MovieDetail />} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/genres"          element={<Genres />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
