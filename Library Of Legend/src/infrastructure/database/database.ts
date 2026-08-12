/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Database

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-INF-DB-0001

LOL-ID..............: LOL-DB-CORE-0002

File................: database.ts

Location............
Library Of Legend/src/infrastructure/database/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

SQLite database layer for Library Of Legends.

Responsibilities:

- Initialize SQLite database
- Store movie metadata
- Prevent duplicate Telegram File-IDs
- Persist Archive IDs (#LIB-XXX-0001)
- Provide collection and archive queries

Important:

- better-sqlite3 is loaded via require()
- No TypeScript typings required
- archive_id is UNIQUE and persistent
- Used for real archive system

===============================================================================
*/

// =============================================================================
// DEPENDENCIES
// =============================================================================

const Database = require("better-sqlite3") as any;

// =============================================================================
// DATABASE INSTANCE
// =============================================================================

const db = new Database("library.db");

// =============================================================================
// TABLE INITIALIZATION
// =============================================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS movies (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,
        year INTEGER,

        file_id TEXT UNIQUE NOT NULL,

        file_name TEXT,
        file_size INTEGER,

        collection TEXT,

        archive_id TEXT UNIQUE,

        created_at TEXT DEFAULT (datetime('now'))
    );
`);

// =============================================================================
// INDEXES
// =============================================================================

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_movies_title
    ON movies(title);
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_movies_collection
    ON movies(collection);
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_movies_archive
    ON movies(archive_id);
`);

// =============================================================================
// TYPES
// =============================================================================

export interface MovieRecord {
    id: number;
    title: string;
    year?: number;
    fileId: string;
    fileName?: string;
    fileSize?: number;
    collection?: string;
    archiveId?: string;
    createdAt?: string;
}

// =============================================================================
// MOVIE REPOSITORY
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
        collection?: string;
        archiveId?: string;
    }): boolean {

        try {

            const stmt = db.prepare(`
                INSERT INTO movies (
                    title,
                    year,
                    file_id,
                    file_name,
                    file_size,
                    collection,
                    archive_id
                )
                VALUES (
                    @title,
                    @year,
                    @fileId,
                    @fileName,
                    @fileSize,
                    @collection,
                    @archiveId
                );
            `);

            stmt.run({
                title: data.title,
                year: data.year ?? null,
                fileId: data.fileId,
                fileName: data.fileName,
                fileSize: data.fileSize ?? null,
                collection: data.collection ?? null,
                archiveId: data.archiveId ?? null
            });

            console.log(`💾 Film gespeichert: ${data.title}`);

            return true;

        } catch (error) {

            console.log("⚠️ Film existiert bereits oder Fehler:", error);

            return false;
        }
    }

    // =========================================================================
    // EXISTS
    // =========================================================================

    public static exists(fileId: string): boolean {

        const row = db.prepare(`
            SELECT id FROM movies
            WHERE file_id = ?
            LIMIT 1
        `).get(fileId);

        return Boolean(row);
    }

    // =========================================================================
    // GET LAST ARCHIVE ID (WICHTIG 🔥)
    // =========================================================================

    public static getLastArchiveId(code: string): string | null {

        const row = db.prepare(`
            SELECT archive_id
            FROM movies
            WHERE archive_id LIKE ?
            ORDER BY id DESC
            LIMIT 1
        `).get(`#LIB-${code}-%`) as any;

        return row?.archive_id || null;
    }

    // =========================================================================
    // GET ALL
    // =========================================================================

    public static getAll(): MovieRecord[] {

        const rows = db.prepare(`
            SELECT
                id,
                title,
                year,
                file_id AS fileId,
                file_name AS fileName,
                file_size AS fileSize,
                collection,
                archive_id AS archiveId,
                created_at AS createdAt
            FROM movies
            ORDER BY id DESC
        `).all();

        return rows as MovieRecord[];
    }

    // =========================================================================
    // GET BY TITLE
    // =========================================================================

    public static getByTitle(title: string): MovieRecord[] {

        const rows = db.prepare(`
            SELECT
                id,
                title,
                year,
                file_id AS fileId,
                file_name AS fileName,
                file_size AS fileSize,
                collection,
                archive_id AS archiveId,
                created_at AS createdAt
            FROM movies
            WHERE LOWER(title) = LOWER(?)
            ORDER BY id ASC
        `).all(title);

        return rows as MovieRecord[];
    }

    // =========================================================================
    // COUNT
    // =========================================================================

    public static count(): number {

        const row = db.prepare(`
            SELECT COUNT(*) as count FROM movies
        `).get() as any;

        return row.count;
    }

    // =========================================================================
    // CLOSE
    // =========================================================================

    public static close(): void {

        try {
            db.close();
            console.log("💾 DB geschlossen.");
        } catch (err) {
            console.error("❌ DB Fehler:", err);
        }
    }
}