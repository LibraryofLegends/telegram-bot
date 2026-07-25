#!/usr/bin/env node

/**
 * ============================================================
 * Library Of Legends 2.0
 * Database Seeder
 * ------------------------------------------------------------
 * Erstellt Standarddaten für die Datenbank.
 * Kann beliebig oft ausgeführt werden.
 * ============================================================
 */

"use strict";

const { db } = require("../src/config/database");

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

    console.log(`[WARNING] ${message}`);

}

function failure(message) {

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

console.log("                 DATABASE SEEDER");

console.log("============================================================");

console.log("");

/**
 * ============================================================
 * Genres
 * ============================================================
 */

function seedGenres() {

    info("Importiere Genres...");

    const genres = [

        "Action",
        "Abenteuer",
        "Animation",
        "Anime",
        "Biografie",
        "Comedy",
        "Dokumentation",
        "Drama",
        "Familie",
        "Fantasy",
        "Historie",
        "Horror",
        "Krimi",
        "Musik",
        "Mystery",
        "Romanze",
        "Science Fiction",
        "Sport",
        "Thriller",
        "Western"

    ];

    const statement = db.prepare(`

INSERT OR IGNORE INTO genres
(

    name

)

VALUES
(

    ?

)

`);

    const transaction = db.transaction(() => {

        for (const genre of genres) {

            statement.run(genre);

        }

    });

    transaction();

    success(`${genres.length} Genres verarbeitet.`);

}

/**
 * ============================================================
 * Sprachen
 * ============================================================
 */

function seedLanguages() {

    info("Importiere Sprachen...");

    const languages = [

        "Deutsch",
        "Englisch",
        "Französisch",
        "Spanisch",
        "Italienisch",
        "Japanisch",
        "Koreanisch",
        "Chinesisch",
        "Russisch",
        "Türkisch"

    ];

    const statement = db.prepare(`

INSERT OR IGNORE INTO languages
(

    name

)

VALUES
(

    ?

)

`);

    const transaction = db.transaction(() => {

        for (const language of languages) {

            statement.run(language);

        }

    });

    transaction();

    success(`${languages.length} Sprachen verarbeitet.`);

}

/**
 * ============================================================
 * Länder
 * ============================================================
 */

function seedCountries() {

    info("Importiere Länder...");

    const countries = [

        "Deutschland",
        "USA",
        "Kanada",
        "Großbritannien",
        "Frankreich",
        "Italien",
        "Spanien",
        "Japan",
        "Südkorea",
        "Australien"

    ];

    const statement = db.prepare(`

INSERT OR IGNORE INTO countries
(

    name

)

VALUES
(

    ?

)

`);

    const transaction = db.transaction(() => {

        for (const country of countries) {

            statement.run(country);

        }

    });

    transaction();

    success(`${countries.length} Länder verarbeitet.`);

}

/**
 * ============================================================
 * Zertifizierungen
 * ============================================================
 */

function seedCertifications() {

    info("Importiere FSK...");

    const certifications = [

        "FSK 0",
        "FSK 6",
        "FSK 12",
        "FSK 16",
        "FSK 18"

    ];

    const statement = db.prepare(`

INSERT OR IGNORE INTO certifications
(

    name

)

VALUES
(

    ?

)

`);

    const transaction = db.transaction(() => {

        for (const certification of certifications) {

            statement.run(certification);

        }

    });

    transaction();

    success(`${certifications.length} Zertifizierungen verarbeitet.`);

}

/**
 * ============================================================
 * Ausführung
 * ============================================================
 */

try {

    seedGenres();

    seedLanguages();

    seedCountries();

    seedCertifications();

}
catch (exception) {

    failure(exception.message);

    db.close();

    process.exit(1);

}

/**
 * ============================================================
 * Abschluss
 * ============================================================
 */

console.log("");

console.log("============================================================");

console.log("Seed erfolgreich abgeschlossen.");

console.log("============================================================");

console.log("");

db.close();

process.exit(0);