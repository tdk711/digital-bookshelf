-- Digital Bookshelf D1 Schema
-- Run with: wrangler d1 execute digital-bookshelf --file=./schema.sql

-- Users table (stores PIN hash for verification, though auth is stateless via PBKDF2)
-- We keep this for potential future features like PIN change
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,           -- 'single-user' for single-PIN setup
  pin_hash TEXT NOT NULL,        -- PBKDF2-SHA256 hash for verification (optional)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'finished', 'abandoned')),
  genre TEXT,
  rating REAL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  date_started TEXT,
  date_finished TEXT,
  image_url TEXT,
  review TEXT,
  date_added TEXT NOT NULL,
  date_modified TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'finished', 'abandoned')),
  genre TEXT,
  rating REAL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  date_started TEXT,
  date_finished TEXT,
  image_url TEXT,
  review TEXT,
  platform TEXT CHECK (platform IS NULL OR platform IN ('mobile', 'ps4', 'pc')),
  date_added TEXT NOT NULL,
  date_modified TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'finished', 'abandoned')),
  genre TEXT,
  rating REAL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  date_watched TEXT,
  image_url TEXT,
  review TEXT,
  date_added TEXT NOT NULL,
  date_modified TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Music (Albums) table
CREATE TABLE IF NOT EXISTS music (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'finished', 'abandoned')),
  genre TEXT,
  rating REAL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  date_listened TEXT,
  image_url TEXT,
  review TEXT,
  artist TEXT,
  date_added TEXT NOT NULL,
  date_modified TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Songs table (embedded in music/albums)
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES music(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating REAL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  date_listened TEXT,
  status TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'finished', 'abandoned')),
  review TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- TV Shows (Seasons) table
CREATE TABLE IF NOT EXISTS tvshows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'finished', 'abandoned')),
  genre TEXT,
  rating REAL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  date_started TEXT,
  date_finished TEXT,
  image_url TEXT,
  review TEXT,
  date_added TEXT NOT NULL,
  date_modified TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Episodes table (embedded in tvshows/seasons)
CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES tvshows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating REAL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  date_watched TEXT,
  status TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'finished', 'abandoned')),
  review TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sync metadata table (tracks last sync timestamp per client)
CREATE TABLE IF NOT EXISTS sync_metadata (
  client_id TEXT PRIMARY KEY,
  last_pull_ts TEXT NOT NULL,
  last_push_ts TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Outbox table for offline-first writes (client-side mutations pending push)
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  record_id TEXT NOT NULL,
  payload TEXT NOT NULL,  -- JSON string of the record
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_updated_at ON movies(updated_at);
CREATE INDEX IF NOT EXISTS idx_music_status ON music(status);
CREATE INDEX IF NOT EXISTS idx_music_updated_at ON music(updated_at);
CREATE INDEX IF NOT EXISTS idx_tvshows_status ON tvshows(status);
CREATE INDEX IF NOT EXISTS idx_tvshows_updated_at ON tvshows(updated_at);
CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_outbox_client_unsynced ON outbox(client_id, synced_at) WHERE synced_at IS NULL;

-- Triggers to auto-update updated_at
CREATE TRIGGER IF NOT EXISTS trg_books_updated_at
AFTER UPDATE ON books
BEGIN
  UPDATE books SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_games_updated_at
AFTER UPDATE ON games
BEGIN
  UPDATE games SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_movies_updated_at
AFTER UPDATE ON movies
BEGIN
  UPDATE movies SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_music_updated_at
AFTER UPDATE ON music
BEGIN
  UPDATE music SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_tvshows_updated_at
AFTER UPDATE ON tvshows
BEGIN
  UPDATE tvshows SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_songs_updated_at
AFTER UPDATE ON songs
BEGIN
  UPDATE songs SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_episodes_updated_at
AFTER UPDATE ON episodes
BEGIN
  UPDATE episodes SET updated_at = datetime('now') WHERE id = NEW.id;
END;