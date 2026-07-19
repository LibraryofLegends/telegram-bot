const { postgres } = require("./connection");

// =============================
// CONNECTION TEST
// =============================
async function testPostgresConnection() {

    if (!postgres) {
        console.log("⚠️ Keine DATABASE_URL gesetzt — nutze SQLite");
        return;
    }

    try {

        const result =
            await postgres.query(
                "SELECT NOW() AS now"
            );

        console.log(
            "✅ Supabase verbunden:",
            result.rows[0].now
        );

    } catch (err) {

        console.error(
            "❌ Supabase Verbindung Fehler:",
            err.message
        );

    }

}

// =============================
// MIGRATIONS
// =============================

async function ensurePostgresTables() {

    if (!postgres) return;

    // HIER kommt jetzt der komplette Inhalt
    // deiner bisherigen Funktion
    // ensurePostgresTables()

}

module.exports = {
    testPostgresConnection,
    ensurePostgresTables
};