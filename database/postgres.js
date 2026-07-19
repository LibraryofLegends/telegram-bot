const { postgres: pgPool } = require("./connection");

async function testPostgresConnection() {
  if (!pgPool) {
    console.log("⚠️ Keine DATABASE_URL gesetzt — nutze SQLite");
    return;
  }

  try {
    const result = await pgPool.query("SELECT NOW() AS now");
    console.log("✅ Supabase verbunden:", result.rows[0].now);
  } catch (err) {
    console.error("❌ Supabase Verbindung Fehler:", err.message);
  }
}

async function ensurePostgresTables() {
  if (!pgPool) return;

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      topic_id INTEGER NOT NULL,
      unique_key TEXT UNIQUE,
      hub_message_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await pgPool.query(`
  CREATE TABLE IF NOT EXISTS series_news (
    id SERIAL PRIMARY KEY,
    series_title TEXT NOT NULL,
    headline TEXT NOT NULL,
    body TEXT,
    tag TEXT,
    news_date TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS knowledge (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    related_movie TEXT,
    related_series TEXT,
    related_person TEXT,
    library_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,

    telegram_user_id BIGINT NOT NULL,

    item_type TEXT NOT NULL
      CHECK (item_type IN ('movie', 'series')),

    item_ref TEXT NOT NULL,
    title TEXT,
    year TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (telegram_user_id, item_type, item_ref)
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS deleted_library_items (
    id BIGSERIAL PRIMARY KEY,

    item_type TEXT NOT NULL,
    item_ref TEXT NOT NULL,

    title TEXT,
    reason TEXT,

    item_data JSONB NOT NULL,

    deleted_by BIGINT,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),

    restored_by BIGINT,
    restored_at TIMESTAMPTZ
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS library_edit_logs (
    id BIGSERIAL PRIMARY KEY,

    item_type TEXT NOT NULL,
    item_ref TEXT NOT NULL,

    action TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,

    edited_by BIGINT,
    edited_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS bot_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_library_edit_logs_item
  ON library_edit_logs (item_type, item_ref, edited_at DESC);
`);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_deleted_library_items_type_ref
  ON deleted_library_items (item_type, item_ref);
`);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_user_favorites_user
  ON user_favorites (telegram_user_id, created_at DESC);
`);
  
  await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS movie_hub_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS movie_banner_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS series_banner_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS episode_list_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS season_separators TEXT DEFAULT '{}';
`);

await pgPool.query(`
  ALTER TABLE series_news
  ADD COLUMN IF NOT EXISTS category TEXT;
`);
  
  await pgPool.query(`
  CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title TEXT,
    year TEXT,
    genre TEXT,
    rating TEXT,
    runtime TEXT,
    overview TEXT,
    poster_url TEXT,
    file_name TEXT,
    file_id TEXT,
    unique_key TEXT UNIQUE,
    telegram_message_id INTEGER,
    topic_id INTEGER,
    collection TEXT,
    quality TEXT,
    audio TEXT,
    source TEXT,
    fsk TEXT,
    director TEXT,
    cast_list TEXT,
    library_id TEXT,
    resolution TEXT,
    file_size TEXT,
    file_size_bytes BIGINT,
    video_codec TEXT,
    audio_codec TEXT,
    audio_channels TEXT,
    hdr TEXT,
    universe TEXT,
    universe_phase TEXT,
    starwars_era TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
`);

await pgPool.query(`
  ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS starwars_era TEXT;
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS series (
    id SERIAL PRIMARY KEY,
    series_title TEXT,
    season INTEGER,
    episode INTEGER,
    episode_title TEXT,
    genre TEXT,
    rating TEXT,
    overview TEXT,
    poster_url TEXT,
    file_name TEXT,
    file_id TEXT,
    unique_key TEXT UNIQUE,
    telegram_message_id INTEGER,
    topic_id INTEGER,
    series_library_id INTEGER,
    universe TEXT,
    universe_phase TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS series_library (
    id SERIAL PRIMARY KEY,

    title TEXT UNIQUE NOT NULL,
    tmdb_id INTEGER,

    first_air_date TEXT,
    last_air_date TEXT,

    genres TEXT,
    rating TEXT,

    overview TEXT,
    poster_url TEXT,

    total_seasons INTEGER,
    total_episodes INTEGER,

    status TEXT,

    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS series_topics (
    id SERIAL PRIMARY KEY,

    series_name TEXT UNIQUE NOT NULL,

    topic_id BIGINT,
    topic_title TEXT,

    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  ALTER TABLE series_topics
  ADD COLUMN IF NOT EXISTS hub_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE series
  ADD COLUMN IF NOT EXISTS starwars_era TEXT;
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    collection_name TEXT,
    tmdb_collection_id INTEGER UNIQUE,
    topic_id INTEGER,
    poster_url TEXT,
    hub_message_id INTEGER,
    banner_message_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS universes (
    id SERIAL PRIMARY KEY,
    universe_name TEXT UNIQUE,
    topic_id INTEGER,
    hub_message_id INTEGER,
    banner_message_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS bot_users (
    telegram_user_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,

    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'blocked', 'rejected')),

    role TEXT NOT NULL DEFAULT 'member'
      CHECK (role IN ('member', 'vip', 'admin')),

    search_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    download_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    daily_movie_limit INTEGER NOT NULL DEFAULT 3,
    daily_season_limit INTEGER NOT NULL DEFAULT 1,
    daily_series_limit INTEGER NOT NULL DEFAULT 0,

    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by BIGINT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

await pgPool.query(`
  ALTER TABLE bot_users
  ADD COLUMN IF NOT EXISTS daily_episode_limit INTEGER NOT NULL DEFAULT 3;
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS bot_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    action_type TEXT NOT NULL
      CHECK (action_type IN ('movie', 'episode', 'season', 'series_all')),
    item_id TEXT,
    usage_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_bot_usage_user_date
  ON bot_usage_logs (telegram_user_id, usage_date);
`);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_bot_users_status
  ON bot_users (status);
`);

  console.log("✅ Supabase Tabellen bereit");
}

module.exports = {
  testPostgresConnection,
  ensurePostgresTables
};