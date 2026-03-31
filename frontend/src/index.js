// ─────────────────────────────────────────────────────────────────────────────
// index.js — React application entry point
//
// This is the very first file that runs in the browser.
// It mounts the root React component (<App />) into the <div id="root">
// element defined in public/index.html.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css'; // Global styles (reset, utilities, fonts)
import App from './App';       // Root component that contains all routes and providers

// Find the <div id="root"> in index.html and create a React root inside it
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app inside React.StrictMode, which enables extra runtime warnings
// in development to help catch common mistakes (no effect in production)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
