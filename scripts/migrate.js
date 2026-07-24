#!/usr/bin/env node

/**
 * ============================================================
 * Library Of Legends 2.0
 * Database Migration Engine
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const { db } = require("../src/config/database");

/**
 * ------------------------------------------------------------
 * Migration-Verzeichnisse
 * ------------------------------------------------------------
 */

const MIGRATION_DIRECTORIES = [
    path.join(process.cwd(), "database", "migrations", "tables"),
    path.join(process.cwd(), "database", "migrations", "indexes"),
    path.join(process.cwd(), "database", "migrations", "triggers"),
    path.join(process.cwd(), "database", "migrations", "views"),
    path.join(process.cwd(), "database", "migrations", "seed")
];

/**
 * ------------------------------------------------------------
 * Migration History Tabelle
 * ------------------------------------------------------------
 */

db.exec(`
CREATE TABLE IF NOT EXISTS migration_history
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    filename TEXT NOT NULL UNIQUE,

    executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

/**
 * ------------------------------------------------------------
 * Bereits ausgeführte Migrationen laden
 * ------------------------------------------------------------
 */

const executed = new Set(
    db.prepare(`
        SELECT filename
        FROM migration_history
    `).all().map(row => row.filename)
);

/**
 * ------------------------------------------------------------
 * Migrationen sammeln
 * ------------------------------------------------------------
 */

let migrations = [];

for (const directory of MIGRATION_DIRECTORIES) {

    if (!fs.existsSync(directory)) {
        continue;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {

        if (!file.endsWith(".sql")) {
            continue;
        }

        migrations.push({

            filename: file,

            filepath: path.join(directory, file)

        });

    }

}

/**
 * ------------------------------------------------------------
 * Nach Dateinamen sortieren
 * ------------------------------------------------------------
 */

migrations.sort((a, b) => a.filename.localeCompare(b.filename));

/**
 * ------------------------------------------------------------
 * Migrationen ausführen
 * ------------------------------------------------------------
 */

let executedCount = 0;

for (const migration of migrations) {

    if (executed.has(migration.filename)) {

        console.log(`✓ Übersprungen: ${migration.filename}`);

        continue;

    }

    console.log(`▶ Starte: ${migration.filename}`);

    const sql = fs.readFileSync(
        migration.filepath,
        "utf8"
    );

    try {

        db.exec(sql);

        db.prepare(`
            INSERT INTO migration_history
            (
                filename
            )
            VALUES
            (
                ?
            )
        `).run(migration.filename);

        console.log(`✅ Erfolgreich: ${migration.filename}`);

        executedCount++;

    }

    catch (error) {

        console.error("");

        console.error("========================================");

        console.error("Migration fehlgeschlagen");

        console.error(migration.filename);

        console.error("");

        console.error(error.message);

        console.error("========================================");

        process.exit(1);

    }

}

/**
 * ------------------------------------------------------------
 * Zusammenfassung
 * ------------------------------------------------------------
 */

console.log("");

console.log("----------------------------------------");

console.log(`Neue Migrationen: ${executedCount}`);

console.log(`Gesamt: ${migrations.length}`);

console.log("----------------------------------------");

process.exit(0);