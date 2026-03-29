const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbConfig = {
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const CREATE_DB = `
  CREATE DATABASE IF NOT EXISTS movie_rating_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
`;

const USE_DB = `USE movie_rating_app;`;

const CREATE_USERS = `
  CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)   NOT NULL,
    email         VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email    (email),
    UNIQUE KEY uq_users_username (username)
  );
`;

const CREATE_MOVIES = `
  CREATE TABLE IF NOT EXISTS movies (
    id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    omdb_id    VARCHAR(20)   NOT NULL,
    title      VARCHAR(255)  NOT NULL,
    year       YEAR          NOT NULL,
    genre      VARCHAR(255)  NOT NULL,
    poster_url VARCHAR(500)      NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_movies_omdb_id (omdb_id)
  );
`;

const CREATE_RATINGS = `
  CREATE TABLE IF NOT EXISTS ratings (
    id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED     NOT NULL,
    movie_id   INT UNSIGNED     NOT NULL,
    rating     TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ratings_user_movie (user_id, movie_id),
    CONSTRAINT fk_ratings_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    CONSTRAINT fk_ratings_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 10)
  );
`;

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_MOVIES = [
  { omdb_id: 'tt0111161', title: 'The Shawshank Redemption',    year: 1994, genre: 'Drama'              },
  { omdb_id: 'tt0068646', title: 'The Godfather',               year: 1972, genre: 'Crime, Drama'       },
  { omdb_id: 'tt0071562', title: 'The Godfather Part II',       year: 1974, genre: 'Crime, Drama'       },
  { omdb_id: 'tt0468569', title: 'The Dark Knight',             year: 2008, genre: 'Action, Crime'      },
  { omdb_id: 'tt0050083', title: '12 Angry Men',                year: 1957, genre: 'Crime, Drama'       },
  { omdb_id: 'tt0108052', title: "Schindler's List",            year: 1993, genre: 'Biography, Drama'   },
  { omdb_id: 'tt0167260', title: 'The Return of the King',      year: 2003, genre: 'Adventure, Drama'   },
  { omdb_id: 'tt0110912', title: 'Pulp Fiction',                year: 1994, genre: 'Crime, Drama'       },
  { omdb_id: 'tt0060196', title: 'The Good, the Bad and Ugly',  year: 1966, genre: 'Western'            },
  { omdb_id: 'tt0137523', title: 'Fight Club',                  year: 1999, genre: 'Drama'              },
  { omdb_id: 'tt0120737', title: 'The Fellowship of the Ring',  year: 2001, genre: 'Adventure, Drama'   },
  { omdb_id: 'tt0109830', title: 'Forrest Gump',                year: 1994, genre: 'Drama, Romance'     },
  { omdb_id: 'tt0816692', title: 'Interstellar',                year: 2014, genre: 'Adventure, Sci-Fi'  },
  { omdb_id: 'tt0133093', title: 'The Matrix',                  year: 1999, genre: 'Action, Sci-Fi'     },
  { omdb_id: 'tt1375666', title: 'Inception',                   year: 2010, genre: 'Action, Sci-Fi'     },
  { omdb_id: 'tt0099685', title: 'Goodfellas',                  year: 1990, genre: 'Biography, Crime'   },
  { omdb_id: 'tt0073486', title: "One Flew Over Cuckoo's Nest", year: 1975, genre: 'Drama'              },
  { omdb_id: 'tt0047478', title: 'Seven Samurai',               year: 1954, genre: 'Action, Drama'      },
  { omdb_id: 'tt0102926', title: 'The Silence of the Lambs',    year: 1991, genre: 'Crime, Thriller'    },
  { omdb_id: 'tt0076759', title: 'Star Wars: A New Hope',       year: 1977, genre: 'Action, Adventure'  },
];

const SEED_USERS = [
  { username: 'alice', email: 'alice@example.com', password: 'password123' },
  { username: 'bob',   email: 'bob@example.com',   password: 'password123' },
  { username: 'carol', email: 'carol@example.com', password: 'password123' },
  { username: 'dave',  email: 'dave@example.com',  password: 'password123' },
  { username: 'eve',   email: 'eve@example.com',   password: 'password123' },
];

// movie_index is 1-based to match INSERT order above
const SEED_RATINGS = [
  // Alice — likes drama, sci-fi
  [1,1,9],[1,4,8],[1,13,10],[1,14,9],[1,15,10],[1,9,7],[1,10,8],[1,12,7],[1,16,8],
  // Bob — likes crime, drama; overlaps Alice on sci-fi
  [2,1,8],[2,2,9],[2,3,9],[2,4,7],[2,8,10],[2,13,8],[2,15,9],[2,19,9],[2,16,9],
  // Carol — likes action, adventure
  [3,4,10],[3,7,9],[3,11,8],[3,14,7],[3,15,8],[3,18,9],[3,20,10],[3,5,6],[3,13,7],
  // Dave — broad taste
  [4,1,7],[4,2,8],[4,4,9],[4,6,10],[4,8,8],[4,9,7],[4,12,9],[4,14,8],[4,17,8],[4,19,7],
  // Eve — similar to Bob on crime; also likes adventure
  [5,2,9],[5,3,8],[5,8,9],[5,7,8],[5,11,9],[5,16,7],[5,19,10],[5,4,6],[5,20,8],
];

// ─── Setup Runner ─────────────────────────────────────────────────────────────

async function setup() {
  const conn = await mysql.createConnection(dbConfig);

  console.log('Creating database...');
  await conn.query(CREATE_DB);
  await conn.query(USE_DB);

  console.log('Creating tables...');
  await conn.query(CREATE_USERS);
  await conn.query(CREATE_MOVIES);
  await conn.query(CREATE_RATINGS);

  // Seed movies (skip if already present)
  const [existingMovies] = await conn.query('SELECT COUNT(*) AS count FROM movies');
  if (existingMovies[0].count === 0) {
    console.log('Seeding movies...');
    for (const movie of SEED_MOVIES) {
      await conn.query(
        'INSERT INTO movies (omdb_id, title, year, genre) VALUES (?, ?, ?, ?)',
        [movie.omdb_id, movie.title, movie.year, movie.genre]
      );
    }
  } else {
    console.log('Movies already seeded, skipping.');
  }

  // Seed users with real bcrypt hashes
  const [existingUsers] = await conn.query('SELECT COUNT(*) AS count FROM users');
  if (existingUsers[0].count === 0) {
    console.log('Seeding users...');
    for (const user of SEED_USERS) {
      const hash = await bcrypt.hash(user.password, 10);
      await conn.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [user.username, user.email, hash]
      );
    }
  } else {
    console.log('Users already seeded, skipping.');
  }

  // Seed ratings
  const [existingRatings] = await conn.query('SELECT COUNT(*) AS count FROM ratings');
  if (existingRatings[0].count === 0) {
    console.log('Seeding ratings...');
    for (const [userId, movieId, rating] of SEED_RATINGS) {
      await conn.query(
        'INSERT INTO ratings (user_id, movie_id, rating) VALUES (?, ?, ?)',
        [userId, movieId, rating]
      );
    }
  } else {
    console.log('Ratings already seeded, skipping.');
  }

  console.log('Database setup complete.');
  await conn.end();
}

setup().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
