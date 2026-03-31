const axios  = require('axios');
const mysql  = require('mysql2/promise');
const fs     = require('fs');
const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// ─── Config ───────────────────────────────────────────────────────────────────

const OMDB_KEY       = process.env.OMDB_API_KEY;
const OMDB_URL       = 'https://www.omdbapi.com/';
const DELAY_MS       = 200;
const MAX_CALLS      = 900;
const PAGES_PER_TERM = 3;
const PROGRESS_FILE  = path.join(__dirname, 'fetch_progress.json');

const DB_CONFIG = {
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// ─── Search Terms ─────────────────────────────────────────────────────────────

const SEARCH_TERMS = [
  'action thriller', 'romantic comedy', 'science fiction', 'horror mystery',
  'crime drama', 'fantasy adventure', 'war drama', 'animated film',
  'psychological thriller', 'biographical drama', 'spy thriller', 'dark comedy',
  '1950 classic', '1960 film', '1970 cinema', '1980 movie',
  '1990 drama', '2000 film', '2010 cinema', '2020 movie',
  'Nolan', 'Spielberg', 'Scorsese', 'Kubrick', 'Tarantino',
  'Fincher', 'Coppola', 'Ridley Scott', 'Wes Anderson', 'Denis Villeneuve',
  'Christopher Nolan', 'David Fincher', 'Paul Thomas Anderson',
  'Quentin Tarantino', 'Alfonso Cuaron',
  'heist', 'space', 'war', 'prison', 'gangster',
  'superhero', 'time travel', 'serial killer', 'zombie',
  'political', 'survival', 'revenge', 'boxing', 'racing',
  'oscar winner', 'academy award', 'best picture', 'cannes',
  'golden globe', 'film festival',
  'japanese', 'french cinema', 'korean film', 'italian',
  'british film', 'indian cinema',
];

// ─── Progress File ────────────────────────────────────────────────────────────

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return {
    lastRun:        null,
    callsUsedToday: 0,
    discoveredIds:  [],
    enrichedIds:    [],
    failedIds:      [],
    phase:          'discovery',
  };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isValidMovie(data) {
  if (data.Response === 'False')               return false;
  if (data.Type !== 'movie')                   return false;
  if (!data.Poster || data.Poster === 'N/A')   return false;
  if (!data.Genre  || data.Genre  === 'N/A')   return false;
  if (!data.Year   || data.Year.includes('–')) return false;
  const runtime = parseInt(data.Runtime, 10);
  if (runtime && runtime < 40)                 return false;
  return true;
}

const parseYear = (y) => { const n = parseInt(y, 10); return isNaN(n) ? null : n; };

// ─── API Calls ────────────────────────────────────────────────────────────────

async function searchOMDB(term, page, callCount) {
  await sleep(DELAY_MS);
  try {
    const { data } = await axios.get(OMDB_URL, {
      params: { s: term, type: 'movie', page, apikey: OMDB_KEY },
      timeout: 8000,
    });
    callCount.count++;
    if (data.Response === 'False') return [];
    return (data.Search || []).map((m) => m.imdbID).filter(Boolean);
  } catch { return []; }
}

async function fetchDetail(imdbID, callCount) {
  await sleep(DELAY_MS);
  try {
    const { data } = await axios.get(OMDB_URL, {
      params: { i: imdbID, plot: 'short', apikey: OMDB_KEY },
      timeout: 8000,
    });
    callCount.count++;
    return data;
  } catch { return null; }
}

// ─── Phase 1: Discovery ───────────────────────────────────────────────────────

async function runDiscovery(progress, callCount, existingIds) {
  console.log('\n── PHASE 1: DISCOVERY ──────────────────────────────────');

  const seen = new Set([...existingIds, ...progress.discoveredIds, ...progress.enrichedIds]);

  for (const term of SEARCH_TERMS) {
    if (callCount.count >= MAX_CALLS) {
      console.log('  ⚠ Daily call limit reached during discovery. Progress saved.');
      break;
    }
    for (let page = 1; page <= PAGES_PER_TERM; page++) {
      if (callCount.count >= MAX_CALLS) break;
      const ids    = await searchOMDB(term, page, callCount);
      const newIds = ids.filter((id) => !seen.has(id));
      newIds.forEach((id) => { seen.add(id); progress.discoveredIds.push(id); });
      if (ids.length < 10) break;
    }
    process.stdout.write(`  Discovered so far: ${progress.discoveredIds.length} IDs (${callCount.count} calls)\r`);
    saveProgress(progress);
  }

  console.log(`\n  Discovery complete: ${progress.discoveredIds.length} unique IDs found.`);
  progress.phase = 'enrichment';
  saveProgress(progress);
}

// ─── Phase 2: Enrichment ─────────────────────────────────────────────────────

async function runEnrichment(progress, callCount, conn) {
  console.log('\n── PHASE 2: ENRICHMENT ─────────────────────────────────');

  const enrichedSet = new Set(progress.enrichedIds);
  const failedSet   = new Set(progress.failedIds);
  const toEnrich    = progress.discoveredIds.filter((id) => !enrichedSet.has(id) && !failedSet.has(id));

  console.log(`  ${toEnrich.length} movies to enrich.`);

  let added = 0, skipped = 0;

  for (const imdbID of toEnrich) {
    if (callCount.count >= MAX_CALLS) {
      console.log('\n  ⚠ Daily call limit reached. Progress saved — run again tomorrow.');
      break;
    }

    const data = await fetchDetail(imdbID, callCount);

    if (!data || !isValidMovie(data)) {
      progress.failedIds.push(imdbID);
      failedSet.add(imdbID);
      skipped++;
      continue;
    }

    try {
      const [result] = await conn.query(
        `INSERT IGNORE INTO movies (omdb_id, title, year, genre, poster_url) VALUES (?, ?, ?, ?, ?)`,
        [data.imdbID, data.Title, parseYear(data.Year), data.Genre, data.Poster]
      );
      if (result.affectedRows > 0) added++;
      progress.enrichedIds.push(imdbID);
      enrichedSet.add(imdbID);
    } catch {
      progress.failedIds.push(imdbID);
    }

    if ((added + skipped) % 10 === 0) {
      saveProgress(progress);
      process.stdout.write(`  Added: ${added} | Skipped: ${skipped} | Calls: ${callCount.count}\r`);
    }
  }

  saveProgress(progress);
  return { added, skipped };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Movie Rank — Bulk Movie Fetcher              ');
  console.log('═══════════════════════════════════════════════');

  if (!OMDB_KEY) { console.error('ERROR: OMDB_API_KEY not set in backend/.env'); process.exit(1); }

  const progress  = loadProgress();
  const today     = new Date().toISOString().split('T')[0];
  const callCount = { count: 0 };

  if (progress.lastRun !== today) {
    console.log(`New day (${today}). Resetting daily call counter.`);
    progress.callsUsedToday = 0;
    progress.lastRun = today;
  } else {
    callCount.count = progress.callsUsedToday;
    console.log(`Resuming run for ${today}. Calls used today: ${callCount.count}`);
  }

  console.log(`Daily cap: ${MAX_CALLS} | Remaining: ${MAX_CALLS - callCount.count}`);

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Database connected.\n');

  const [existingRows] = await conn.query('SELECT omdb_id FROM movies');
  const existingIds = existingRows.map((r) => r.omdb_id);
  console.log(`Existing movies in DB: ${existingIds.length}`);

  if (progress.phase === 'discovery') {
    await runDiscovery(progress, callCount, existingIds);
  } else {
    console.log(`\nSkipping discovery — ${progress.discoveredIds.length} IDs already found.`);
  }

  await runEnrichment(progress, callCount, conn);

  progress.callsUsedToday = callCount.count;
  progress.lastRun = today;
  saveProgress(progress);

  const [countRow] = await conn.query('SELECT COUNT(*) AS total FROM movies');
  await conn.end();

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  API calls used this run:  ${callCount.count}`);
  console.log(`  Total movies now in DB:   ${countRow[0].total}`);
  console.log(`  Progress saved to:        database/fetch_progress.json`);
  console.log('═══════════════════════════════════════════════\n');
}

if (process.argv.includes('--reset')) {
  if (fs.existsSync(PROGRESS_FILE)) { fs.unlinkSync(PROGRESS_FILE); console.log('Progress reset.'); }
  process.exit(0);
}

main().catch((err) => { console.error('Fatal error:', err.message); process.exit(1); });
