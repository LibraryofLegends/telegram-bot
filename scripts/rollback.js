#!/usr/bin/env node

/**
 * ============================================================
 * Library Of Legends 2.0
 * Rollback Engine
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const { db } = require("../src/config/database");

/**
 * ------------------------------------------------------------
 * Verzeichnisse
 * ------------------------------------------------------------
 */

const TABLES_DIR = path.join(
    process.cwd(),
    "database",
    "migrations",
    "tables"
);

/**
 * ------------------------------------------------------------
 * Parameter
 * ------------------------------------------------------------
 */

const steps = Number(process.argv[2] || 1);

if (Number.isNaN(steps) || steps <= 0) {

    console.error("Ungültige Anzahl an Rollback-Schritten.");

    process.exit(1);

}

/**
 * ------------------------------------------------------------
 * Migration History vorhanden?
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
 * Letzte Migrationen laden
 * ------------------------------------------------------------
 */

const migrations = db.prepare(`
SELECT *
FROM migration_history
ORDER BY id DESC
LIMIT ?
`).all(steps);

if (migrations.length === 0) {

    console.log("Keine Migrationen zum Zurücksetzen gefunden.");

    process.exit(0);

}

/**
 * ------------------------------------------------------------
 * Rollback
 * ------------------------------------------------------------
 */

for (const migration of migrations) {

    console.log("");

    console.log("----------------------------------------");

    console.log(`Rollback: ${migration.filename}`);

    console.log("----------------------------------------");

    /**
     * Down-Datei bestimmen
     */

    const downFile = migration.filename.replace(
        ".sql",
        ".down.sql"
    );

    const downPath = path.join(
        TABLES_DIR,
        downFile
    );

    if (!fs.existsSync(downPath)) {

        console.log("Keine Down-Migration gefunden.");

        console.log("Rollback übersprungen.");

        continue;

    }

    const sql = fs.readFileSync(
        downPath,
        "utf8"
    );

    try {

        db.exec(sql);

        db.prepare(`
        DELETE FROM migration_history
        WHERE filename = ?
        `).run(migration.filename);

        console.log("Rollback erfolgreich.");

    }

    catch (error) {

        console.error("");

        console.error(error.message);

        process.exit(1);

    }

}

console.log("");

console.log("Rollback abgeschlossen.");

process.exit(0);