/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Database

Architecture Layer..: Infrastructure

Module..............: Database

File................: database.ts

Description.........

SQLite Database Layer with intelligent fallback logic.

Features:

- Persist movies
- Retrieve movies
- Auto-detect collections for legacy entries
- Fix broken collection progress

===============================================================================
*/

import Database from "better-sqlite3";

// =============================================================================
// TYPES
// =============================================================================

export interface MovieRecord {

    id?: number;

    title:
        string;

    year?:
        number;

    collection?:
        string | null;

    archiveId?:
        string;
}

// =============================================================================
// DATABASE
// =============================================================================

export class DatabaseService {

    private db: Database.Database;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor() {

        this.db =
            new Database(
                "library.db"
            );

        this.init();
    }

    // =========================================================================
    // INIT
    // =========================================================================

    private init(): void {

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS movies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                year INTEGER,
                collection TEXT,
                archiveId TEXT
            )
        `);
    }

    // =========================================================================
    // INSERT
    // =========================================================================

    public insertMovie(
        movie: MovieRecord
    ): void {

        const stmt =
            this.db.prepare(`
                INSERT INTO movies (title, year, collection, archiveId)
                VALUES (?, ?, ?, ?)
            `);

        stmt.run(
            movie.title,
            movie.year ?? null,
            movie.collection ?? null,
            movie.archiveId ?? null
        );
    }

    // =========================================================================
    // GET ALL (WITH AUTO COLLECTION FIX)
    // =========================================================================

    public getAllMovies():
        MovieRecord[] {

        const rows =
            this.db.prepare(`
                SELECT * FROM movies
            `).all();

        return rows.map(
            (row: any) => {

                let collection =
                    row.collection;

                // =============================================================
                // 🔥 AUTO FIX FOR OLD DATA
                // =============================================================

                if (
                    !collection ||
                    collection.trim() === ""
                ) {

                    collection =
                        this.detectCollectionFromTitle(
                            row.title
                        );
                }

                return {
                    id: row.id,
                    title: row.title,
                    year: row.year,
                    collection,
                    archiveId: row.archiveId
                };
            }
        );
    }

    // =========================================================================
    // COUNT BY COLLECTION
    // =========================================================================

    public countByCollection(
        collectionName: string
    ): number {

        const movies =
            this.getAllMovies();

        return movies.filter(
            m =>
                m.collection ===
                collectionName
        ).length;
    }

    // =========================================================================
    // DETECT COLLECTION FROM TITLE (🔥 KEY FIX)
    // =========================================================================

    private detectCollectionFromTitle(
        title: string
    ): string | null {

        const value =
            String(title || "")
                .toLowerCase();

        // =============================================================
        // KNOWN COLLECTIONS
        // =============================================================

        if (value.includes("john wick")) {
            return "John Wick";
        }

        if (value.includes("equalizer")) {
            return "The Equalizer";
        }

        if (value.includes("spider-man") || value.includes("spiderman")) {
            return "Spider-Man";
        }

        if (value.includes("harry potter")) {
            return "Harry Potter";
        }

        if (value.includes("fast") && value.includes("furious")) {
            return "Fast & Furious";
        }

        if (value.includes("transformers")) {
            return "Transformers";
        }

        if (value.includes("batman")) {
            return "Batman";
        }

        if (value.includes("superman")) {
            return "Superman";
        }

        if (value.includes("jurassic")) {
            return "Jurassic Park";
        }

        if (value.includes("scream")) {
            return "Scream";
        }

        return null;
    }
}