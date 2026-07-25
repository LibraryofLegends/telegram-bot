#!/usr/bin/env node

/**
 * ============================================================
 * Library Of Legends 2.0
 * Database Doctor
 * ------------------------------------------------------------
 * Analysiert den Zustand der Datenbank und gibt
 * Empfehlungen zur Optimierung.
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

    info: 0,

    warnings: 0,

    errors: 0

};

/**
 * ============================================================
 * Logger
 * ============================================================
 */

function info(message) {

    statistics.info++;

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
 * Start
 * ============================================================
 */

console.log("");

console.log("============================================================");

console.log("              LIBRARY OF LEGENDS 2.0");

console.log("                  DATABASE DOCTOR");

console.log("============================================================");

console.log("");

/**
 * ============================================================
 * Datenbank vorhanden
 * ============================================================
 */

if (!fs.existsSync(DATABASE_FILE)) {

    failure("Datenbankdatei wurde nicht gefunden.");

    process.exit(1);

}

success("Datenbankdatei gefunden.");

/**
 * ============================================================
 * SQLite Version
 * ============================================================
 */

try {

    const version = db.prepare(

        "SELECT sqlite_version() AS version"

    ).get();

    info(`SQLite Version: ${version.version}`);

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Integritätsprüfung
 * ============================================================
 */

try {

    const integrity = db.prepare(

        "PRAGMA integrity_check"

    ).get();

    if (integrity.integrity_check === "ok") {

        success("Integritätsprüfung erfolgreich.");

    }
    else {

        failure("Integritätsprüfung fehlgeschlagen.");

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

try {

    const foreignKeys = db.pragma(

        "foreign_keys",

        {

            simple: true

        }

    );

    if (foreignKeys === 1) {

        success("Foreign Keys aktiviert.");

    }
    else {

        warning("Foreign Keys sind deaktiviert.");

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

try {

    const mode = db.pragma(

        "journal_mode",

        {

            simple: true

        }

    );

    info(`Journal Mode: ${mode}`);

    if (mode !== "wal") {

        warning("WAL-Modus wird empfohlen.");

    }

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Tabellen
 * ============================================================
 */

try {

    const result = db.prepare(`

SELECT COUNT(*) AS total

FROM sqlite_master

WHERE type='table'

AND name NOT LIKE 'sqlite_%'

`).get();

    info(`${result.total} Tabellen vorhanden.`);

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Indizes
 * ============================================================
 */

try {

    const result = db.prepare(`

SELECT COUNT(*) AS total

FROM sqlite_master

WHERE type='index'
AND name NOT LIKE 'sqlite_%'

`).get();

    info(`${result.total} Indizes vorhanden.`);

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Trigger
 * ============================================================
 */

try {

    const result = db.prepare(`

SELECT COUNT(*) AS total

FROM sqlite_master

WHERE type='trigger'

`).get();

    info(`${result.total} Trigger vorhanden.`);

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Views
 * ============================================================
 */

try {

    const result = db.prepare(`

SELECT COUNT(*) AS total

FROM sqlite_master

WHERE type='view'

`).get();

    info(`${result.total} Views vorhanden.`);

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Datenbankgröße
 * ============================================================
 */

try {

    const size = fs.statSync(

        DATABASE_FILE

    ).size;

    const sizeMB = (

        size / 1024 / 1024

    ).toFixed(2);

    info(`Datenbankgröße: ${sizeMB} MB`);

}
catch (exception) {

    failure(exception.message);

}

/**
 * ============================================================
 * Optimierungsempfehlung
 * ============================================================
 */

if (statistics.warnings === 0) {

    success("Keine Optimierungen notwendig.");

}
else {

    console.log("");

    console.log("Empfehlungen");

    console.log("--------------------------------------------");

    console.log("• VACUUM regelmäßig ausführen");

    console.log("• ANALYZE nach großen Importen");

    console.log("• Backups regelmäßig erstellen");

    console.log("• Migrationen aktuell halten");

}

/**
 * ============================================================
 * Abschlussbericht
 * ============================================================
 */

console.log("");

console.log("============================================================");

console.log("                 DOCTOR REPORT");

console.log("============================================================");

console.log("");

console.log(`Informationen : ${statistics.info}`);

console.log(`Warnungen     : ${statistics.warnings}`);

console.log(`Fehler        : ${statistics.errors}`);

console.log("");

if (statistics.errors === 0) {

    success("Datenbankstatus: OK");

}
else {

    failure("Datenbankstatus: Fehler erkannt");

}

console.log("");

console.log("============================================================");

db.close();

process.exit(

    statistics.errors > 0

        ? 1

        : 0

);