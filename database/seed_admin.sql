-- ============================================================
-- seed_admin.sql — Create the admin account
--
-- Run once against the movie_rating_app database:
--   mysql -u root -p movie_rating_app < database/seed_admin.sql
--
-- Safe to re-run: INSERT ... ON DUPLICATE KEY UPDATE will update
-- the password/role if the email already exists instead of failing.
-- ============================================================

USE movie_rating_app;

-- Insert the admin user, or update their password and role if the
-- email already exists (e.g. they signed up normally before this ran).
--
-- password_hash is bcrypt(cost=10) of "Password2" — never store plain text.
-- role = 'admin' grants access to the /admin dashboard and all admin API routes.

INSERT INTO users (username, email, password_hash, role)
VALUES (
  'Admin',
  'Yjaber@email.com',
  '$2b$10$/AfxR9IY8UdSwGzK70ubT.SmN/NCFQNxAjYdXwfrzDPj4YSCldFPi',
  'admin'
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role          = 'admin';
