#!/usr/bin/env node

/**
 * ============================================================
 * Library Of Legends 2.0
 * Database Verify Engine
 * ------------------------------------------------------------
 * Überprüft:
 *
 * • Datenbank vorhanden
 * • Migration History
 * • Integritätsprüfung
 * • Foreign Keys
 * • WAL-Modus
 * • Tabellen
 * ============================================================
 */

"use strict";

const fs = require("fs");

const {

    db,

    DATABASE_FILE

} = require("../src/config/database");

/**
 * ============================================================
 * Statistik
 * ============================================================
 */

const statistics = {

    warnings: 0,

    errors: 0

};

/**
 * ============================================================
 * Logger
 * ============================================================
 */

function info(message) {

    console.log(`[INFO] ${message}`);

}

function success(message) {

    console.log(`[SUCCESS] ${message}`);

}

function warning(message) {

    statistics.warnings++;

    console.log(`[WARNING] ${message}`);

}

function failure(message) {

    statistics.errors++;

    console.log(`[ERROR] ${message}`);

}

/**
 * ============================================================
 * Datenbank vorhanden?
 * ============================================================
 */

info("Prüfe Datenbankdatei...");

if (!fs.existsSync(DATABASE_FILE)) {

    failure("Datenbankdatei nicht gefunden.");

    process.exit(1);

}

success("Datenbank gefunden.");

/**
 * ============================================================
 * SQLite Version
 * ============================================================
 */

try {

    const version = db.prepare(

        "SELECT sqlite_version() AS version"

    ).get();

    success(

        `SQLite Version ${version.version}`

    );

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Integritätsprüfung
 * ============================================================
 */

info("Prüfe Datenbankintegrität...");

try {

    const integrity =

        db.prepare(

            "PRAGMA integrity_check"

        ).get();

    if (

        integrity.integrity_check === "ok"

    ) {

        success(

            "Integritätsprüfung erfolgreich."

        );

    }
    else {

        failure(

            "Integritätsprüfung fehlgeschlagen."

        );

    }

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Foreign Keys
 * ============================================================
 */

info("Prüfe Foreign Keys...");

try {

    const foreignKeys =

        db.pragma(

            "foreign_keys",

            {

                simple: true

            }

        );

    if (foreignKeys === 1) {

        success(

            "Foreign Keys aktiviert."

        );

    }
    else {

        warning(

            "Foreign Keys deaktiviert."

        );

    }

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Journal Mode
 * ============================================================
 */

info("Prüfe Journal Mode...");

try {

    const mode =

        db.pragma(

            "journal_mode",

            {

                simple: true

            }

        );

    success(

        `Journal Mode: ${mode}`

    );

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Tabellen zählen
 * ============================================================
 */

info("Prüfe Tabellen...");

try {

    const result = db.prepare(`

SELECT COUNT(*) AS total

FROM sqlite_master

WHERE type='table'

AND name NOT LIKE 'sqlite_%'

`).get();

    success(

        `${result.total} Tabellen gefunden.`

    );

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Migration History
 * ============================================================
 */

info("Prüfe Migration History...");

try {

    const result = db.prepare(`

SELECT COUNT(*) AS total

FROM migration_history

`).get();

    success(

        `${result.total} Migrationen installiert.`

    );

}
catch {

    warning(

        "Migration History existiert noch nicht."

    );

}

/**
 * ============================================================
 * Abschlussbericht
 * ============================================================
 */

console.log("");

console.log("============================================================");

console.log("             DATABASE VERIFY REPORT");

console.log("============================================================");

console.log("");

console.log(

    `Warnungen : ${statistics.warnings}`

);

console.log(

    `Fehler    : ${statistics.errors}`

);

console.log("");

if (

    statistics.errors === 0

) {

    success(

        "Verifizierung erfolgreich abgeschlossen."

    );

}
else {

    failure(

        "Verifizierung mit Fehlern beendet."

    );

}

console.log("");

db.close();

process.exit(

    statistics.errors > 0

        ? 1

        : 0

);