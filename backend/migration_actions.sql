-- Run this once against your movie_rating_app database.
-- Usage:  mysql -u <user> -p movie_rating_app < migration_actions.sql

CREATE TABLE IF NOT EXISTS user_watched (
  id         INT       AUTO_INCREMENT PRIMARY KEY,
  user_id    INT       NOT NULL,
  movie_id   INT       NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_watched (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS user_likes (
  id         INT       AUTO_INCREMENT PRIMARY KEY,
  user_id    INT       NOT NULL,
  movie_id   INT       NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_likes (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS user_watchlist (
  id         INT       AUTO_INCREMENT PRIMARY KEY,
  user_id    INT       NOT NULL,
  movie_id   INT       NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_watchlist (user_id, movie_id)
);
