'use strict';

const Database = require('better-sqlite3');
const path = require('path');

class LibraryDatabase {

    constructor(options = {}) {

        this.databasePath =
            options.databasePath ??
            path.join(
                process.cwd(),
                'library.db'
            );

        this.db =
            new Database(this.databasePath);

        this.db.pragma(
            'journal_mode = WAL'
        );

        this.db.pragma(
            'foreign_keys = ON'
        );

        this.prepare();

    }

    /**
     * Datenbank vorbereiten.
     */
    prepare() {

        this.createMoviesTable();

        this.createSeriesTable();

        this.createSeasonsTable();

        this.createEpisodesTable();

        this.createCollectionsTable();

        this.createSearchIndexTable();

    }

    createMoviesTable() {

        this.db.exec(`

            CREATE TABLE IF NOT EXISTS movies (

                id INTEGER PRIMARY KEY,

                tmdbId INTEGER,

                imdbId TEXT,

                title TEXT,

                originalTitle TEXT,

                overview TEXT,

                year INTEGER,

                runtime INTEGER,

                genres TEXT,

                country TEXT,

                language TEXT,

                resolution TEXT,

                source TEXT,

                videoCodec TEXT,

                audioCodec TEXT,

                qualityScore INTEGER,

                qualityTier TEXT,

                poster TEXT,

                backdrop TEXT,

                logo TEXT,

                filePath TEXT,

                fileHash TEXT,

                fileSize INTEGER,

                createdAt TEXT,

                updatedAt TEXT

            );

        `);

    }

    createSeriesTable() {

        this.db.exec(`

            CREATE TABLE IF NOT EXISTS series (

                id INTEGER PRIMARY KEY,

                tmdbId INTEGER,

                imdbId TEXT,

                title TEXT,

                overview TEXT,

                poster TEXT,

                backdrop TEXT,

                logo TEXT,

                createdAt TEXT,

                updatedAt TEXT

            );

        `);

    }

    createSeasonsTable() {

        this.db.exec(`

            CREATE TABLE IF NOT EXISTS seasons (

                id INTEGER PRIMARY KEY,

                seriesId INTEGER,

                seasonNumber INTEGER,

                poster TEXT,

                episodeCount INTEGER,

                FOREIGN KEY(seriesId)

                REFERENCES series(id)

            );

        `);

    }

    createEpisodesTable() {

        this.db.exec(`

            CREATE TABLE IF NOT EXISTS episodes (

                id INTEGER PRIMARY KEY,

                seasonId INTEGER,

                episodeNumber INTEGER,

                title TEXT,

                overview TEXT,

                runtime INTEGER,

                still TEXT,

                FOREIGN KEY(seasonId)

                REFERENCES seasons(id)

            );

        `);

    }

    createCollectionsTable() {

        this.db.exec(`

            CREATE TABLE IF NOT EXISTS collections (

                id INTEGER PRIMARY KEY,

                tmdbId INTEGER,

                name TEXT,

                poster TEXT,

                backdrop TEXT,

                overview TEXT,

                movieCount INTEGER

            );

        `);

    }

    createSearchIndexTable() {

        this.db.exec(`

            CREATE TABLE IF NOT EXISTS searchIndex (

                id INTEGER PRIMARY KEY,

                mediaId INTEGER,

                type TEXT,

                value TEXT,

                normalized TEXT

            );

        `);

    }

    close() {

        this.db.close();

    }

}

module.exports = LibraryDatabase;