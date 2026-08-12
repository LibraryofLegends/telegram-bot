/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Database

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-INF-DB-0001

LOL-ID..............: LOL-DB-CORE-0001

File................: database.ts

Location............
Library Of Legend/src/infrastructure/database/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

SQLite database layer for Library Of Legends.

Responsibilities:

- Initialize database
- Create tables
- Store movies
- Prevent duplicates
- Provide basic queries

Important:

- Uses better-sqlite3 (synchronous, fast, reliable)
- file_id is UNIQUE → prevents duplicates automatically
- Minimal structure (will be extended later)

===============================================================================
*/

import Database from "better-sqlite3";

// =============================================================================
// DATABASE INIT
// =============================================================================

const db = new Database("library.db");

// =============================================================================
// TABLE CREATION
// =============================================================================

db.prepare(`
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    year INTEGER,
    file_id TEXT UNIQUE NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
)
`).run();

// =============================================================================
// REPOSITORY
// =============================================================================

export class MovieRepository {

    // =========================================================================
    // ADD MOVIE
    // =========================================================================

    public static addMovie(data: {
        title: string;
        year?: number;
        fileId: string;
        fileName: string;
        fileSize?: number;
    }): boolean {

        try {

            db.prepare(`
                INSERT INTO movies (
                    title,
                    year,
                    file_id,
                    file_name,
                    file_size
                )
                VALUES (?, ?, ?, ?, ?)
            `).run(
                data.title,
                data.year ?? null,
                data.fileId,
                data.fileName,
                data.fileSize ?? null
            );

            return true;

        } catch (error) {

            console.log("⚠️ Duplicate erkannt – wird übersprungen.");

            return false;
        }
    }

    // =========================================================================
    // EXISTS
    // =========================================================================

    public static exists(
        fileId: string
    ): boolean {

        const row = db.prepare(`
            SELECT id FROM movies WHERE file_id = ?
        `).get(fileId);

        return !!row;
    }

    // =========================================================================
    // COUNT
    // =========================================================================

    public static count(): number {

        const row = db.prepare(`
            SELECT COUNT(*) as count FROM movies
        `).get() as { count: number };

        return row.count || 0;
    }

    // =========================================================================
    // GET ALL (DEBUG / FUTURE USE)
    // =========================================================================

    public static getAll(): any[] {

        return db.prepare(`
            SELECT * FROM movies ORDER BY id DESC
        `).all();
    }
}