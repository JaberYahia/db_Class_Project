-- ============================================================
-- migration_admin.sql — Admin system migration
--
-- Run once against the movie_rating_app database:
--   mysql -u root -p movie_rating_app < database/migration_admin.sql
--
-- Safe to re-run: IF NOT EXISTS / IF COLUMN EXISTS guards are used.
-- ============================================================

USE movie_rating_app;

-- ── 1. Add role column to users ───────────────────────────────────────────────
-- ENUM restricts values to 'user' or 'admin'. DEFAULT 'user' means every
-- existing and future row starts as a regular user.
-- To promote someone: UPDATE users SET role = 'admin' WHERE username = 'Jay';

-- Adds role column; safe to re-run because the procedure checks first
DROP PROCEDURE IF EXISTS add_role_column;
DELIMITER //
CREATE PROCEDURE add_role_column()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';
  END IF;
END //
DELIMITER ;
CALL add_role_column();
DROP PROCEDURE IF EXISTS add_role_column;

-- ── 2. Create user_bans table ─────────────────────────────────────────────────
-- Stores active bans and timeouts issued by admins.
--
-- type = 'ban'     → permanent (expires_at IS NULL)
-- type = 'timeout' → temporary (expires_at is a future datetime)
--
-- UNIQUE KEY on user_id means one active record per user at a time.
-- ON DUPLICATE KEY UPDATE in the repo lets admins modify an existing ban
-- without needing to delete and re-insert.
--
-- Cascade: if a user is deleted, their ban record is cleaned up automatically.

CREATE TABLE IF NOT EXISTS user_bans (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED  NOT NULL,
  admin_id   INT UNSIGNED  NOT NULL,           -- which admin issued the ban
  type       ENUM('ban', 'timeout') NOT NULL,
  reason     VARCHAR(255)      NULL,            -- optional explanation shown to the user
  expires_at DATETIME          NULL,            -- NULL = permanent ban
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_active_ban (user_id),          -- one active entry per user
  CONSTRAINT  fk_ban_user   FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT  fk_ban_admin  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);
