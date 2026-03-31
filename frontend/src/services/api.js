// ─────────────────────────────────────────────────────────────────────────────
// services/api.js — Centralised HTTP client for all backend requests
//
// Uses Axios to communicate with the Express API.
// All API functions are defined here so the rest of the frontend never
// needs to hard-code URLs or deal with headers directly.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

// Create a pre-configured Axios instance with the backend base URL.
// REACT_APP_API_URL comes from the .env file in the frontend folder.
// Falls back to localhost:5001 (the default dev server port) if not set.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Runs before every request is sent.
// If the user is logged in, their JWT token is stored in localStorage.
// We read it here and attach it as an Authorization header automatically,
// so individual API calls don't each need to handle this themselves.

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // JWT stored at login/signup
  if (token) config.headers.Authorization = `Bearer ${token}`; // Standard Bearer token format
  return config; // Return the modified config so Axios sends the request
});

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

export const signup = (data) => api.post('/api/auth/signup', data); // Register a new account
export const login  = (data) => api.post('/api/auth/login',  data); // Log in, receive JWT

// ─── Movie Endpoints ─────────────────────────────────────────────────────────

export const getMovies      = ()       => api.get('/api/movies');                          // All movies
export const searchMovies   = (q)      => api.get('/api/movies/search', { params: { q } }); // OMDB search
export const getMovieDetail = (omdbId) => api.get(`/api/movies/${omdbId}`);                // Single movie

// ─── Rating Endpoints ────────────────────────────────────────────────────────

export const submitRating = (data) => api.post('/api/ratings',    data); // Save or update a rating
export const getMyRatings = ()     => api.get('/api/ratings/me');         // Current user's rating history

// ─── Recommendation Endpoint ─────────────────────────────────────────────────

export const getRecommendations = () => api.get('/api/recommendations'); // AI-personalized picks

// ─── Review Endpoints ─────────────────────────────────────────────────────────

export const getReviews    = (movieId) => api.get(`/api/reviews/${movieId}`);
export const submitReview  = (data)    => api.post('/api/reviews', data);
export const deleteReview  = (movieId) => api.delete(`/api/reviews/${movieId}`);

export default api;
