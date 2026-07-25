#!/usr/bin/env node

/**
 * ============================================================
 * Library Of Legends 2.0
 * Database Migration Engine
 * Version 3.0 Enterprise Edition
 * ------------------------------------------------------------
 * Verantwortlich für:
 *
 * • automatische Migrationen
 * • rekursive Verzeichnissuche
 * • Datenbank-Backups
 * • SHA-256 Integritätsprüfung
 * • Transaktionen
 * • Lock-Datei
 * • Performance-Messung
 * • Datenbankoptimierung
 * • Integritätsprüfung
 * • Migration History
 * ============================================================
 */

"use strict";

/**
 * ============================================================
 * Module
 * ============================================================
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const {
    db,
    DATABASE_FILE,
    BACKUP_DIR
} = require("../src/config/database");

/**
 * ============================================================
 * Konstanten
 * ============================================================
 */

const ROOT =
    process.cwd();

const MIGRATIONS_ROOT =
    path.join(
        ROOT,
        "database",
        "migrations"
    );

const LOCK_FILE =
    path.join(
        ROOT,
        "database",
        "migration.lock"
    );

const MIGRATION_PATTERN =
    /^\d{6}_.+\.sql$/i;

const DOWN_PATTERN =
    /\.down\.sql$/i;

/**
 * ============================================================
 * Statistik
 * ============================================================
 */

const statistics = {

    total: 0,

    executed: 0,

    skipped: 0,

    failed: 0,

    invalid: 0,

    startedAt: Date.now()

};

/**
 * ============================================================
 * Logger
 * ============================================================
 */

function timestamp() {

    return new Date().toLocaleTimeString(
        "de-DE",
        {
            hour12: false
        }
    );

}

function log(type, message) {

    console.log(
        `[${timestamp()}] ${type} ${message}`
    );

}

function info(message) {

    log(
        "INFO    ",
        message
    );

}

function success(message) {

    log(
        "SUCCESS ",
        message
    );

}

function warning(message) {

    log(
        "WARNING ",
        message
    );

}

function failure(message) {

    log(
        "ERROR   ",
        message
    );

}

/**
 * ============================================================
 * SHA256
 * ============================================================
 */

function checksum(content) {

    return crypto

        .createHash("sha256")

        .update(content)

        .digest("hex");

}

/**
 * ============================================================
 * Lock-Datei
 * ============================================================
 */

function createLockFile() {

    if (fs.existsSync(LOCK_FILE)) {

        failure("");

        failure(
            "Migration bereits aktiv."
        );

        failure(
            "migration.lock gefunden."
        );

        process.exit(1);

    }

    fs.writeFileSync(

        LOCK_FILE,

        JSON.stringify({

            started: new Date(),

            hostname: os.hostname(),

            pid: process.pid

        }, null, 4)

    );

}

function removeLockFile() {

    if (

        fs.existsSync(
            LOCK_FILE
        )

    ) {

        fs.unlinkSync(
            LOCK_FILE
        );

    }

}

/**
 * ============================================================
 * Backup
 * ============================================================
 */

function createBackup() {

    if (

        !fs.existsSync(
            DATABASE_FILE
        )

    ) {

        warning(
            "Keine Datenbank vorhanden. Backup übersprungen."
        );

        return;

    }

    const now =
        new Date();

    const filename =
        `backup_${
            now.getFullYear()
        }-${
            String(
                now.getMonth() + 1
            ).padStart(2,"0")
        }-${
            String(
                now.getDate()
            ).padStart(2,"0")
        }_${
            String(
                now.getHours()
            ).padStart(2,"0")
        }-${
            String(
                now.getMinutes()
            ).padStart(2,"0")
        }-${
            String(
                now.getSeconds()
            ).padStart(2,"0")
        }.db`;

    const destination =
        path.join(
            BACKUP_DIR,
            filename
        );

    fs.copyFileSync(

        DATABASE_FILE,

        destination

    );

    success(
        `Backup erstellt: ${filename}`
    );

}

/**
 * ============================================================
 * Migration History
 * ============================================================
 */

db.exec(`

CREATE TABLE IF NOT EXISTS migration_history
(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    filename TEXT NOT NULL UNIQUE,

    checksum TEXT NOT NULL,

    file_size INTEGER NOT NULL,

    duration_ms INTEGER NOT NULL,

    executed_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP

);

`);

/**
 * ============================================================
 * Bereits ausgeführte Migrationen laden
 * ============================================================
 */

const executedMigrations = new Map();

const historyRows = db.prepare(`

SELECT

    filename,

    checksum

FROM migration_history

`).all();

for (const row of historyRows) {

    executedMigrations.set(

        row.filename,

        row.checksum

    );

}

/**
 * ============================================================
 * Migrationen rekursiv suchen
 * ============================================================
 */

const migrations = [];

function scanDirectory(directory) {

    if (!fs.existsSync(directory)) {

        return;

    }

    const entries = fs.readdirSync(
        directory,
        {
            withFileTypes: true
        }
    );

    for (const entry of entries) {

        const fullPath = path.join(
            directory,
            entry.name
        );

        if (entry.isDirectory()) {

            scanDirectory(fullPath);

            continue;

        }

        if (!entry.isFile()) {

            continue;

        }

        if (DOWN_PATTERN.test(entry.name)) {

            continue;

        }

        if (!MIGRATION_PATTERN.test(entry.name)) {

            statistics.invalid++;

            warning(
                `Ungültiger Dateiname: ${entry.name}`
            );

            continue;

        }

        migrations.push({

            filename: entry.name,

            filepath: fullPath

        });

    }

}

scanDirectory(
    MIGRATIONS_ROOT
);

/**
 * ============================================================
 * Migrationen sortieren
 * ============================================================
 */

migrations.sort(

    (a, b) =>

        a.filename.localeCompare(
            b.filename
        )

);

statistics.total =
    migrations.length;

/**
 * ============================================================
 * Lock erstellen
 * ============================================================
 */

createLockFile();

/**
 * ============================================================
 * Backup erstellen
 * ============================================================
 */

createBackup();

/**
 * ============================================================
 * Migrationen ausführen
 * ============================================================
 */

for (const migration of migrations) {

    info(
        `Prüfe ${migration.filename}`
    );

    const sql = fs.readFileSync(

        migration.filepath,

        "utf8"

    );

    if (!sql.trim()) {

        statistics.failed++;

        failure(
            `Leere Migration: ${migration.filename}`
        );

        removeLockFile();

        process.exit(1);

    }

    const currentChecksum =
        checksum(sql);

    if (

        executedMigrations.has(
            migration.filename
        )

    ) {

        const storedChecksum =

            executedMigrations.get(
                migration.filename
            );

        if (

            storedChecksum !==
            currentChecksum

        ) {

            statistics.failed++;

            failure(
                "Migration wurde verändert:"
            );

            failure(
                migration.filename
            );

            removeLockFile();

            process.exit(1);

        }

        statistics.skipped++;

        warning(
            `${migration.filename} bereits installiert`
        );

        continue;

    }

    info(
        `Starte ${migration.filename}`
    );

    const started =
        Date.now();
        
            /**
     * ============================================================
     * Migration innerhalb einer Transaktion ausführen
     * ============================================================
     */

    try {

        const transaction = db.transaction(() => {

            db.exec(sql);

            const fileSize =
                fs.statSync(
                    migration.filepath
                ).size;

            const duration =
                Date.now() - started;

            db.prepare(`

INSERT INTO migration_history
(

    filename,

    checksum,

    file_size,

    duration_ms

)

VALUES
(

    ?,

    ?,

    ?,

    ?

)

`).run(

                migration.filename,

                currentChecksum,

                fileSize,

                duration

            );

        });

        transaction();

        const finished =
            Date.now() - started;

        statistics.executed++;

        success(

            `${migration.filename} erfolgreich (${finished} ms)`

        );

    }

    catch (exception) {

        statistics.failed++;

        console.log("");

        console.log("============================================================");

        failure("Migration fehlgeschlagen");

        console.log("");

        failure(`Datei : ${migration.filename}`);

        console.log("");

        failure(`Fehler: ${exception.message}`);

        console.log("");

        console.log("============================================================");

        removeLockFile();

        process.exit(1);

    }

}

/**
 * ============================================================
 * SQLite Integritätsprüfung
 * ============================================================
 */

info(
    "Prüfe Datenbankintegrität..."
);

try {

    const integrity =
        db.prepare(
            "PRAGMA integrity_check;"
        ).get();

    if (

        integrity.integrity_check ===
        "ok"

    ) {

        success(
            "Integritätsprüfung erfolgreich."
        );

    }
    else {

        warning(
            "SQLite meldet mögliche Inkonsistenzen."
        );

        console.log(
            integrity
        );

    }

}
catch (exception) {

    warning(
        `Integritätsprüfung fehlgeschlagen: ${exception.message}`
    );

}

/**
 * ============================================================
 * SQLite Optimierung
 * ============================================================
 */

info(
    "Optimiere Datenbank..."
);

try {

    db.pragma(
        "optimize"
    );

    success(
        "Optimierung abgeschlossen."
    );

}
catch (exception) {

    warning(
        `Optimierung fehlgeschlagen: ${exception.message}`
    );

}

/**
 * ============================================================
 * WAL Checkpoint
 * ============================================================
 */

try {

    db.pragma(
        "wal_checkpoint(TRUNCATE)"
    );

    success(
        "WAL-Checkpoint abgeschlossen."
    );

}
catch (exception) {

    warning(
        `WAL-Checkpoint fehlgeschlagen: ${exception.message}`
    );

}

/**
 * ============================================================
 * Datenbankinformationen
 * ============================================================
 */

let sqliteVersion = "Unbekannt";

try {

    sqliteVersion = db.prepare(`
        SELECT sqlite_version() AS version
    `).get().version;

}
catch {

    warning(
        "SQLite-Version konnte nicht ermittelt werden."
    );

}

/**
 * ============================================================
 * Abschlussbericht
 * ============================================================
 */

const totalDuration =
    Date.now() - statistics.startedAt;

console.log("");

console.log("============================================================");
console.log("              LIBRARY OF LEGENDS 2.0");
console.log("           DATABASE MIGRATION REPORT");
console.log("============================================================");

console.log("");

console.log("Migrationen");
console.log("------------------------------------------------------------");

console.log(
    `Gefunden              : ${statistics.total}`
);

console.log(
    `Ausgeführt            : ${statistics.executed}`
);

console.log(
    `Übersprungen          : ${statistics.skipped}`
);

console.log(
    `Ungültig              : ${statistics.invalid}`
);

console.log(
    `Fehlgeschlagen        : ${statistics.failed}`
);

console.log("");

console.log("Performance");
console.log("------------------------------------------------------------");

console.log(
    `Gesamtdauer           : ${totalDuration} ms`
);

console.log("");

console.log("Datenbank");
console.log("------------------------------------------------------------");

console.log(
    `SQLite Version        : ${sqliteVersion}`
);

console.log(
    `Datenbankdatei        : ${DATABASE_FILE}`
);

console.log("");

console.log("============================================================");

/**
 * ============================================================
 * Lock-Datei entfernen
 * ============================================================
 */

removeLockFile();

/**
 * ============================================================
 * Verbindung schließen
 * ============================================================
 */

try {

    db.close();

    success(
        "Datenbankverbindung geschlossen."
    );

}
catch (exception) {

    warning(
        `Verbindung konnte nicht sauber geschlossen werden: ${exception.message}`
    );

}

console.log("");

if (statistics.failed === 0) {

    success(
        "Migration erfolgreich abgeschlossen."
    );

}
else {

    failure(
        "Migration mit Fehlern beendet."
    );

}

console.log("");

console.log("============================================================");
console.log("        Vielen Dank für die Nutzung von");
console.log("             Library Of Legends");
console.log("============================================================");

process.exit(

    statistics.failed > 0
        ? 1
        : 0

);