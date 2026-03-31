-- ============================================================
-- MovieRank — Database Schema
--
-- Three tables:
--   users   — registered accounts
--   movies  — local cache of OMDB movie data
--   ratings — one rating per user per movie (1-10 scale)
--
-- The ratings table is the join table that links users to movies.
-- It powers the collaborative filtering recommendation engine.
-- ============================================================

-- Create the database if it doesn't already exist.
-- utf8mb4 supports the full Unicode character set (including emoji).
CREATE DATABASE IF NOT EXISTS movie_rating_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE movie_rating_app;

-- ============================================================
-- USERS
-- Stores registered user accounts.
-- Passwords are stored as bcrypt hashes — never plain-text.
-- Both email and username must be globally unique (enforced by UNIQUE KEY).
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,  -- Primary key, auto-increments
  username      VARCHAR(50)   NOT NULL,                  -- Display name, max 50 characters
  email         VARCHAR(255)  NOT NULL,                  -- Login identifier
  password_hash VARCHAR(255)  NOT NULL,                  -- bcrypt hash (never the plain password)
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email    (email),    -- No two users can share an email
  UNIQUE KEY uq_users_username (username)  -- No two users can share a username
);

-- ============================================================
-- MOVIES
-- Local cache of movie data fetched from the OMDB API.
-- Full details (plot, cast, director) are fetched on-demand from OMDB
-- and are NOT stored here to keep the table lightweight.
-- omdb_id is the IMDB ID (e.g. "tt0111161") and must be unique.
-- ============================================================
CREATE TABLE IF NOT EXISTS movies (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  omdb_id    VARCHAR(20)   NOT NULL,    -- IMDB ID, e.g. "tt0111161" — used to fetch from OMDB
  title      VARCHAR(255)  NOT NULL,
  year       YEAR          NOT NULL,
  genre      VARCHAR(255)  NOT NULL,    -- Comma-separated list, e.g. "Action, Drama, Sci-Fi"
  poster_url VARCHAR(500)      NULL,    -- URL to the poster image from OMDB (can be null)
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_movies_omdb_id (omdb_id)  -- Prevents duplicate movies in the cache
);

-- ============================================================
-- RATINGS
-- One row per (user, movie) pair — the user's 1-10 score.
-- The composite UNIQUE KEY on (user_id, movie_id) means a user can only
-- have one rating per movie. Updating a rating replaces the old one.
--
-- Foreign keys with ON DELETE CASCADE:
--   If a user is deleted, their ratings are deleted too.
--   If a movie is deleted, its ratings are deleted too.
--
-- CHECK constraint ensures the rating value is always between 1 and 10.
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED     NOT NULL,             -- References users.id
  movie_id   INT UNSIGNED     NOT NULL,             -- References movies.id
  rating     TINYINT UNSIGNED NOT NULL,             -- 1 to 10 (enforced by CHECK constraint)
  created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_ratings_user_movie (user_id, movie_id),  -- One rating per user per movie

  -- Cascading deletes keep the ratings table clean when users or movies are removed
  CONSTRAINT fk_ratings_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ratings_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 10)  -- DB-level validation
);

-- ============================================================
-- RELATIONSHIPS
--
--   users ──┐
--           ├── ratings ──── movies
--           │    (user_id)   (movie_id)
--           └──────────────────────────
--
-- One user   → many ratings
-- One movie  → many ratings
-- ratings    = join table enabling collaborative filtering
-- ============================================================
