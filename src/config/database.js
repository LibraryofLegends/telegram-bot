/**
 * ============================================================
 * Library Of Legends 2.0
 * Database Configuration
 * ------------------------------------------------------------
 * Zentraler Datenbankzugriff
 * SQLite + better-sqlite3
 * ============================================================
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

/**
 * ------------------------------------------------------------
 * Verzeichnisse
 * ------------------------------------------------------------
 */

const DATABASE_DIR = path.join(process.cwd(), "database");
const DATABASE_FILE = path.join(DATABASE_DIR, "database.db");
const BACKUP_DIR = path.join(DATABASE_DIR, "backups");
const LOG_DIR = path.join(DATABASE_DIR, "logs");

/**
 * ------------------------------------------------------------
 * Verzeichnisse automatisch erstellen
 * ------------------------------------------------------------
 */

[
    DATABASE_DIR,
    BACKUP_DIR,
    LOG_DIR
].forEach((directory) => {

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {
            recursive: true
        });
    }

});

/**
 * ------------------------------------------------------------
 * Datenbank öffnen
 * ------------------------------------------------------------
 */

const db = new Database(DATABASE_FILE);

/**
 * ------------------------------------------------------------
 * SQLite Einstellungen
 * ------------------------------------------------------------
 */

db.pragma("foreign_keys = ON");

db.pragma("journal_mode = WAL");

db.pragma("synchronous = NORMAL");

db.pragma("temp_store = MEMORY");

db.pragma("cache_size = -64000");

db.pragma("busy_timeout = 10000");

db.pragma("automatic_index = ON");

db.pragma("optimize");

db.pragma("wal_autocheckpoint = 1000");

/**
 * ------------------------------------------------------------
 * Datenbankinformationen
 * ------------------------------------------------------------
 */

function getDatabaseInfo() {

    return {

        path: DATABASE_FILE,

        version: db.prepare(
            "SELECT sqlite_version() AS version"
        ).get().version,

        journalMode: db.pragma("journal_mode", {
            simple: true
        }),

        foreignKeys: db.pragma("foreign_keys", {
            simple: true
        }),

        cacheSize: db.pragma("cache_size", {
            simple: true
        })

    };

}

/**
 * ------------------------------------------------------------
 * Datenbank schließen
 * ------------------------------------------------------------
 */

function closeDatabase() {

    db.close();

}

/**
 * ------------------------------------------------------------
 * Exporte
 * ------------------------------------------------------------
 */

module.exports = {

    db,

    DATABASE_FILE,

    DATABASE_DIR,

    BACKUP_DIR,

    LOG_DIR,

    getDatabaseInfo,

    closeDatabase

};