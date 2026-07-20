const { postgres } = require("./connection");

// =========================================================
// Userbot Import Tabellen
// =========================================================

async function ensureUserbotImportTables() {
    if (!postgres) {
        console.log(
            "ℹ️ Keine DATABASE_URL gesetzt. Userbot-Importe werden nicht in Supabase gespeichert."
        );
        return;
    }

    await postgres.query(`
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

// =========================================================
// Library Tabellen
// =========================================================

async function ensureLibraryTables() {
    if (!postgres) return;

    // Den restlichen Inhalt übernehmen wir im nächsten Schritt 1:1.
    // Dadurch bleibt jeder Schritt klein und leicht testbar.
}

module.exports = {
    ensureUserbotImportTables,
    ensureLibraryTables,
};