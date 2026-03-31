// ─────────────────────────────────────────────────────────────────────────────
// database/dbSetup.js — One-time database initialisation script
//
// Run this once before starting the server for the first time:
//   npm run setup-db   (from the backend/ folder)
//
// What it does:
//   1. Creates the movie_rating_app database if it doesn't exist
//   2. Creates the users, movies, and ratings tables (IF NOT EXISTS — safe to re-run)
//   3. Seeds the movies table with ~80 classic/popular films
//   4. Seeds the users table with 6 test accounts (passwords are hashed)
// ─────────────────────────────────────────────────────────────────────────────

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');    // Used to hash seed user passwords
const path   = require('path');

// Load environment variables from the backend's .env file
// (this script lives in database/ so we navigate up to backend/)
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Database connection config — no 'database' field here because the DB
// doesn't exist yet when this script first runs
const dbConfig = {
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true, // Allows running multiple SQL statements in one query call
};

// ─── Schema SQL ───────────────────────────────────────────────────────────────

// Create the database with full Unicode support (utf8mb4 handles all characters including emoji)
const CREATE_DB = `
  CREATE DATABASE IF NOT EXISTS movie_rating_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
`;

const USE_DB = `USE movie_rating_app;`; // Switch to our database for subsequent queries

// Users table — stores credentials and profile info
// password_hash stores the bcrypt output, never the raw password
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

// Movies table — local cache of OMDB data, keyed by IMDB ID
const CREATE_MOVIES = `
  CREATE TABLE IF NOT EXISTS movies (
    id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    omdb_id    VARCHAR(20)   NOT NULL,  -- IMDB ID, e.g. "tt0111161"
    title      VARCHAR(255)  NOT NULL,
    year       YEAR          NOT NULL,
    genre      VARCHAR(255)  NOT NULL,
    poster_url VARCHAR(500)      NULL,  -- Populated by fetchMovies.js or on-demand
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_movies_omdb_id (omdb_id)
  );
`;

// Ratings table — the core data that powers recommendations
// Each row = one user's rating of one movie (1-10 scale)
const CREATE_RATINGS = `
  CREATE TABLE IF NOT EXISTS ratings (
    id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED     NOT NULL,
    movie_id   INT UNSIGNED     NOT NULL,
    rating     TINYINT UNSIGNED NOT NULL,  -- Constrained to 1-10
    created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ratings_user_movie (user_id, movie_id),  -- One rating per user per movie
    CONSTRAINT fk_ratings_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    CONSTRAINT fk_ratings_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 10)
  );
`;

// ─── Seed Data ────────────────────────────────────────────────────────────────

// A curated list of well-known films used to populate the database.
// omdb_id is the IMDB ID — used to fetch posters and full details from OMDB.
// These are inserted with INSERT IGNORE so re-running the script is safe.
const SEED_MOVIES = [
  // Drama
  { omdb_id: 'tt0111161', title: 'The Shawshank Redemption',         year: 1994, genre: 'Drama'                  },
  { omdb_id: 'tt0068646', title: 'The Godfather',                    year: 1972, genre: 'Crime, Drama'            },
  { omdb_id: 'tt0071562', title: 'The Godfather Part II',            year: 1974, genre: 'Crime, Drama'            },
  { omdb_id: 'tt0050083', title: '12 Angry Men',                     year: 1957, genre: 'Crime, Drama'            },
  { omdb_id: 'tt0108052', title: "Schindler's List",                 year: 1993, genre: 'Biography, Drama'        },
  { omdb_id: 'tt0110912', title: 'Pulp Fiction',                     year: 1994, genre: 'Crime, Drama'            },
  { omdb_id: 'tt0137523', title: 'Fight Club',                       year: 1999, genre: 'Drama'                   },
  { omdb_id: 'tt0109830', title: 'Forrest Gump',                     year: 1994, genre: 'Drama, Romance'          },
  { omdb_id: 'tt0073486', title: "One Flew Over Cuckoo's Nest",      year: 1975, genre: 'Drama'                   },
  { omdb_id: 'tt0099685', title: 'Goodfellas',                       year: 1990, genre: 'Biography, Crime'        },
  { omdb_id: 'tt0114369', title: 'Se7en',                            year: 1995, genre: 'Crime, Drama, Mystery'   },
  { omdb_id: 'tt0172495', title: 'Gladiator',                        year: 2000, genre: 'Action, Adventure, Drama'},
  { omdb_id: 'tt0078748', title: 'Alien',                            year: 1979, genre: 'Horror, Sci-Fi'          },
  { omdb_id: 'tt0407887', title: 'The Departed',                     year: 2006, genre: 'Crime, Drama, Thriller'  },
  { omdb_id: 'tt0095765', title: 'Cinema Paradiso',                  year: 1988, genre: 'Drama, Romance'          },
  { omdb_id: 'tt0253474', title: 'The Pianist',                      year: 2002, genre: 'Biography, Drama, Music' },
  { omdb_id: 'tt0071853', title: 'Monty Python and the Holy Grail',  year: 1975, genre: 'Adventure, Comedy'       },
  { omdb_id: 'tt0056172', title: 'Lawrence of Arabia',               year: 1962, genre: 'Adventure, Biography'    },

  // Action / Sci-Fi
  { omdb_id: 'tt0468569', title: 'The Dark Knight',                  year: 2008, genre: 'Action, Crime, Drama'    },
  { omdb_id: 'tt0816692', title: 'Interstellar',                     year: 2014, genre: 'Adventure, Drama, Sci-Fi'},
  { omdb_id: 'tt0133093', title: 'The Matrix',                       year: 1999, genre: 'Action, Sci-Fi'          },
  { omdb_id: 'tt1375666', title: 'Inception',                        year: 2010, genre: 'Action, Adventure, Sci-Fi'},
  { omdb_id: 'tt0076759', title: 'Star Wars: A New Hope',            year: 1977, genre: 'Action, Adventure, Sci-Fi'},
  { omdb_id: 'tt0080684', title: 'Star Wars: The Empire Strikes Back',year:1980, genre: 'Action, Adventure, Sci-Fi'},
  { omdb_id: 'tt0086190', title: 'Star Wars: Return of the Jedi',    year: 1983, genre: 'Action, Adventure, Sci-Fi'},
  { omdb_id: 'tt0082971', title: 'Raiders of the Lost Ark',          year: 1981, genre: 'Action, Adventure'       },
  { omdb_id: 'tt0088763', title: 'Back to the Future',               year: 1985, genre: 'Adventure, Comedy, Sci-Fi'},
  { omdb_id: 'tt0103064', title: 'Terminator 2: Judgment Day',       year: 1991, genre: 'Action, Sci-Fi'          },
  { omdb_id: 'tt1160419', title: 'Dune: Part One',                   year: 2021, genre: 'Action, Adventure, Sci-Fi'},
  { omdb_id: 'tt1745960', title: 'Top Gun: Maverick',                year: 2022, genre: 'Action, Drama'           },
  { omdb_id: 'tt4154796', title: 'Avengers: Endgame',                year: 2019, genre: 'Action, Adventure, Sci-Fi'},
  { omdb_id: 'tt0325980', title: 'Pirates of the Caribbean',         year: 2003, genre: 'Action, Adventure, Fantasy'},
  { omdb_id: 'tt0119116', title: 'The Fifth Element',                year: 1997, genre: 'Action, Adventure, Sci-Fi'},
  { omdb_id: 'tt0268978', title: 'A Beautiful Mind',                 year: 2001, genre: 'Biography, Drama'        },
  { omdb_id: 'tt0209144', title: 'Memento',                          year: 2000, genre: 'Mystery, Thriller'       },
  { omdb_id: 'tt0482571', title: 'The Prestige',                     year: 2006, genre: 'Drama, Mystery, Sci-Fi'  },

  // Adventure / Fantasy / Animation
  { omdb_id: 'tt0167260', title: 'The Return of the King',           year: 2003, genre: 'Adventure, Drama, Fantasy'},
  { omdb_id: 'tt0120737', title: 'The Fellowship of the Ring',       year: 2001, genre: 'Adventure, Drama, Fantasy'},
  { omdb_id: 'tt0167261', title: 'The Two Towers',                   year: 2002, genre: 'Adventure, Drama, Fantasy'},
  { omdb_id: 'tt0266543', title: 'Finding Nemo',                     year: 2003, genre: 'Animation, Adventure'    },
  { omdb_id: 'tt0435761', title: 'Toy Story 3',                      year: 2010, genre: 'Animation, Adventure, Comedy'},
  { omdb_id: 'tt0114709', title: 'Toy Story',                        year: 1995, genre: 'Animation, Adventure, Comedy'},
  { omdb_id: 'tt0198781', title: 'Monsters, Inc.',                   year: 2001, genre: 'Animation, Adventure, Comedy'},
  { omdb_id: 'tt2096673', title: 'Inside Out',                       year: 2015, genre: 'Animation, Adventure, Comedy'},
  { omdb_id: 'tt4633694', title: 'Spider-Man: Into the Spider-Verse',year: 2018, genre: 'Animation, Action, Adventure'},
  { omdb_id: 'tt0107290', title: 'Jurassic Park',                    year: 1993, genre: 'Action, Adventure, Sci-Fi'},
  { omdb_id: 'tt0245429', title: 'Spirited Away',                    year: 2001, genre: 'Animation, Adventure, Family'},

  // Thriller / Horror
  { omdb_id: 'tt0102926', title: 'The Silence of the Lambs',         year: 1991, genre: 'Crime, Thriller'         },
  { omdb_id: 'tt0081505', title: 'The Shining',                      year: 1980, genre: 'Drama, Horror'           },
  { omdb_id: 'tt0073195', title: 'Jaws',                             year: 1975, genre: 'Adventure, Drama, Thriller'},
  { omdb_id: 'tt0083658', title: 'Blade Runner',                     year: 1982, genre: 'Sci-Fi, Thriller'        },
  { omdb_id: 'tt1856101', title: 'Blade Runner 2049',                year: 2017, genre: 'Drama, Mystery, Sci-Fi'  },
  { omdb_id: 'tt0054215', title: 'Psycho',                           year: 1960, genre: 'Horror, Mystery, Thriller'},
  { omdb_id: 'tt0364569', title: 'Oldboy',                           year: 2003, genre: 'Action, Drama, Mystery'  },
  { omdb_id: 'tt0105236', title: 'Reservoir Dogs',                   year: 1992, genre: 'Crime, Drama, Thriller'  },
  { omdb_id: 'tt0053125', title: 'North by Northwest',               year: 1959, genre: 'Adventure, Mystery, Thriller'},
  { omdb_id: 'tt0052357', title: 'Vertigo',                          year: 1958, genre: 'Mystery, Romance, Thriller'},

  // Crime / Drama
  { omdb_id: 'tt0120586', title: 'American History X',               year: 1998, genre: 'Crime, Drama'            },
  { omdb_id: 'tt0110413', title: 'Léon: The Professional',           year: 1994, genre: 'Action, Crime, Drama'    },
  { omdb_id: 'tt0118715', title: 'The Big Lebowski',                 year: 1998, genre: 'Comedy, Crime'           },
  { omdb_id: 'tt0208092', title: 'Snatch',                           year: 2000, genre: 'Comedy, Crime, Thriller'  },
  { omdb_id: 'tt0119488', title: 'L.A. Confidential',                year: 1997, genre: 'Crime, Drama, Mystery'   },

  // War / History
  { omdb_id: 'tt0120815', title: 'Saving Private Ryan',              year: 1998, genre: 'Drama, War'              },
  { omdb_id: 'tt0361748', title: 'Inglourious Basterds',             year: 2009, genre: 'Adventure, Drama, War'   },
  { omdb_id: 'tt0057565', title: 'The Great Escape',                 year: 1963, genre: 'Adventure, Drama, History'},
  { omdb_id: 'tt0057012', title: 'Dr. Strangelove',                  year: 1964, genre: 'Comedy, Drama, War'      },

  // Western
  { omdb_id: 'tt0060196', title: 'The Good, the Bad and Ugly',       year: 1966, genre: 'Western'                 },
  { omdb_id: 'tt1853728', title: 'Django Unchained',                 year: 2012, genre: 'Drama, Western'          },

  // Romance / Classic
  { omdb_id: 'tt0034583', title: 'Casablanca',                       year: 1942, genre: 'Drama, Romance, War'     },
  { omdb_id: 'tt0038650', title: "It's a Wonderful Life",            year: 1946, genre: 'Drama, Family, Fantasy'  },
  { omdb_id: 'tt0118799', title: 'Life is Beautiful',                year: 1997, genre: 'Comedy, Drama, Romance'  },
  { omdb_id: 'tt0338013', title: 'Eternal Sunshine of the Spotless Mind', year: 2004, genre: 'Drama, Romance, Sci-Fi'},

  // Biographical
  { omdb_id: 'tt2582802', title: 'Whiplash',                         year: 2014, genre: 'Drama, Music'            },
  { omdb_id: 'tt1504320', title: "The King's Speech",                year: 2010, genre: 'Biography, Drama, History'},
  { omdb_id: 'tt0112573', title: 'Braveheart',                       year: 1995, genre: 'Biography, Drama, History'},
  { omdb_id: 'tt1517289', title: 'Oppenheimer',                      year: 2023, genre: 'Biography, Drama, History'},

  // Modern
  { omdb_id: 'tt0372784', title: 'Batman Begins',                    year: 2005, genre: 'Action, Adventure'       },
  { omdb_id: 'tt1345836', title: 'The Dark Knight Rises',            year: 2012, genre: 'Action, Adventure, Thriller'},
  { omdb_id: 'tt2015381', title: 'Guardians of the Galaxy',          year: 2014, genre: 'Action, Adventure, Comedy'},
  { omdb_id: 'tt1517268', title: 'Barbie',                           year: 2023, genre: 'Adventure, Comedy, Fantasy'},

  // Sci-Fi Classics
  { omdb_id: 'tt0062622', title: '2001: A Space Odyssey',            year: 1968, genre: 'Adventure, Sci-Fi'       },
  { omdb_id: 'tt0047478', title: 'Seven Samurai',                    year: 1954, genre: 'Action, Drama'           },
];

// Test user accounts — passwords will be hashed before insertion
// These let you log in immediately after setup without registering
const SEED_USERS = [
  { username: 'Jay',   email: 'tester1@email.com', password: 'Password1'   },
  { username: 'alice', email: 'alice@example.com', password: 'password123' },
  { username: 'bob',   email: 'bob@example.com',   password: 'password123' },
  { username: 'carol', email: 'carol@example.com', password: 'password123' },
  { username: 'dave',  email: 'dave@example.com',  password: 'password123' },
  { username: 'eve',   email: 'eve@example.com',   password: 'password123' },
];

// ─── Setup Runner ─────────────────────────────────────────────────────────────

async function setup() {
  // Open a single connection (not a pool) since this is a one-time script
  const conn = await mysql.createConnection(dbConfig);

  console.log('Creating database...');
  await conn.query(CREATE_DB); // Create the database if missing
  await conn.query(USE_DB);    // Switch to it

  console.log('Creating tables...');
  // IF NOT EXISTS on each table means re-running this script is safe — no data is lost
  await conn.query(CREATE_USERS);
  await conn.query(CREATE_MOVIES);
  await conn.query(CREATE_RATINGS);

  console.log('Seeding movies...');
  let newMovies = 0;
  for (const movie of SEED_MOVIES) {
    // INSERT IGNORE skips the row if the omdb_id already exists (safe to re-run)
    const [result] = await conn.query(
      'INSERT IGNORE INTO movies (omdb_id, title, year, genre) VALUES (?, ?, ?, ?)',
      [movie.omdb_id, movie.title, movie.year, movie.genre]
    );
    if (result.affectedRows > 0) newMovies++; // affectedRows = 0 if the row was skipped
  }
  console.log(`Movies: ${newMovies} added, ${SEED_MOVIES.length - newMovies} already existed.`);

  console.log('Seeding users...');
  let newUsers = 0;
  for (const user of SEED_USERS) {
    // Check if either the email or username is already taken before inserting
    const [existing] = await conn.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [user.email, user.username]
    );
    if (existing.length === 0) {
      // Hash the password with bcrypt before storing — 10 rounds is the cost factor
      const hash = await bcrypt.hash(user.password, 10);
      await conn.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [user.username, user.email, hash]
      );
      newUsers++;
    }
  }
  console.log(`Users: ${newUsers} added, ${SEED_USERS.length - newUsers} already existed.`);

  console.log('Database setup complete.');
  await conn.end(); // Close the connection cleanly
}

// Run the setup — if anything fails, print the error and exit with a non-zero code
setup().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
