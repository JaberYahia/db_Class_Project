import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const signup = (data)  => api.post('/api/auth/signup', data);
export const login  = (data)  => api.post('/api/auth/login',  data);

// Movies
export const getMovies       = ()       => api.get('/api/movies');
export const searchMovies    = (q)      => api.get('/api/movies/search', { params: { q } });
export const getMovieDetail  = (omdbId) => api.get(`/api/movies/${omdbId}`);

// Ratings
export const submitRating    = (data)   => api.post('/api/ratings', data);
export const getMyRatings    = ()       => api.get('/api/ratings/me');

// Recommendations
export const getRecommendations = () => api.get('/api/recommendations');

export default api;
