async function ensureUserbotImportTables(pgPool) {
    if (!pgPool) {
        console.log("ℹ️ Keine DATABASE_URL gesetzt. Userbot-Importe werden nicht in Supabase gespeichert.");
        return;
    }

    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS userbot_imports (
            id SERIAL PRIMARY KEY,
            unique_key TEXT UNIQUE,
            source_chat TEXT,
            staging_chat TEXT,
            source_message_id TEXT,
            staging_message_id TEXT,
            media_type TEXT,
            title TEXT,
            year INTEGER,
            season INTEGER,
            episode INTEGER,
            episode_title TEXT,
            file_name TEXT,
            file_size TEXT,
            mime_type TEXT,
            width INTEGER,
            height INTEGER,
            duration_minutes INTEGER,
            quality TEXT,
            media_source TEXT,
            codec TEXT,
            audio TEXT,
            status TEXT DEFAULT 'staged',
            raw_json JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    console.log("✅ Userbot Import Tabelle bereit");
}

async function ensureLibraryTables(pgPool) {
    if (!pgPool) {
        return;
    }

    // =========================================================
    // Serien
    // =========================================================

    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS series (
            id SERIAL PRIMARY KEY,
            title TEXT UNIQUE NOT NULL,
            original_title TEXT,
            year INTEGER,
            tmdb_id INTEGER,
            imdb_id TEXT,
            overview TEXT,
            poster_path TEXT,
            backdrop_path TEXT,
            vote_average NUMERIC,
            vote_count INTEGER,
            genres TEXT[],
            number_of_seasons INTEGER,
            number_of_episodes INTEGER,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    // =========================================================
    // Staffeln
    // =========================================================

    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS seasons (
            id SERIAL PRIMARY KEY,
            series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
            season_number INTEGER NOT NULL,
            episode_count INTEGER DEFAULT 0,
            imported_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(series_id, season_number)
        );
    `);

    // =========================================================
    // Episoden
    // =========================================================

    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS episodes (
            id SERIAL PRIMARY KEY,
            season_id INTEGER REFERENCES seasons(id) ON DELETE CASCADE,
            episode_number INTEGER NOT NULL,
            title TEXT,
            staging_message_id TEXT,
            imported BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(season_id, episode_number)
        );
    `);

    // =========================================================
    // Filme
    // =========================================================

    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS movies (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            original_title TEXT,
            year INTEGER,
            tmdb_id INTEGER UNIQUE,
            imdb_id TEXT,
            overview TEXT,
            poster_path TEXT,
            backdrop_path TEXT,
            vote_average NUMERIC,
            vote_count INTEGER,
            runtime INTEGER,
            genres TEXT[],
            quality TEXT,
            source TEXT,
            codec TEXT,
            audio TEXT,
            staging_message_id TEXT,
            imported BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    // =========================================================
    // Collections
    // =========================================================

    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS collections (
            id SERIAL PRIMARY KEY,
            tmdb_collection_id INTEGER UNIQUE,
            name TEXT NOT NULL,
            slug TEXT UNIQUE,
            overview TEXT,
            poster_path TEXT,
            backdrop_path TEXT,
            movie_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    // =========================================================
    // Film ↔ Collection
    // =========================================================

    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS movie_collections (
            movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
            collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
            position INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (movie_id, collection_id)
        );
    `);

    // =========================================================
    // Logs
    // =========================================================

    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS logs (
            id BIGSERIAL PRIMARY KEY,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    console.log("✅ Library Tabellen bereit");
}

async function initializeDatabase(pgPool) {
    await ensureUserbotImportTables(pgPool);
    await ensureLibraryTables(pgPool);
}

module.exports = {
    ensureUserbotImportTables,
    ensureLibraryTables,
    initializeDatabase,
};