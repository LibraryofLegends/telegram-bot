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
Library Of Legends/src/infrastructure/database/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

SQLite database layer for Library Of Legends.

Responsibilities:

- Initialize SQLite database
- Create movie table
- Store movie metadata
- Prevent duplicate Telegram File-IDs
- Provide movie lookup
- Provide collection progress data
- Provide basic archive queries

Important:

- better-sqlite3 is loaded through require()
- No TypeScript declaration file for better-sqlite3 is required
- file_id is UNIQUE
- Database remains intentionally minimal during the clean restart

===============================================================================
*/

// =============================================================================
// BETTER-SQLITE3
// =============================================================================
//
// We intentionally use require() here.
//
// Reason:
//
// The current project does not have usable TypeScript declarations for
// better-sqlite3. Using require() avoids TS7016 and keeps the database layer
// independent from external declaration files.
//
// =============================================================================

const Database =
    require(
        "better-sqlite3"
    ) as any;

// =============================================================================
// DATABASE INSTANCE
// =============================================================================

const db =
    new Database(
        "library.db"
    );

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS movies (

        id
            INTEGER
            PRIMARY KEY
            AUTOINCREMENT,

        title
            TEXT
            NOT NULL,

        year
            INTEGER,

        file_id
            TEXT
            UNIQUE
            NOT NULL,

        file_name
            TEXT,

        file_size
            INTEGER,

        collection
            TEXT,

        created_at
            TEXT
            DEFAULT (
                datetime('now')
            )
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

// =============================================================================
// TYPES
// =============================================================================

export interface MovieRecord {

    id:
        number;

    title:
        string;

    year?:
        number;

    fileId:
        string;

    fileName?:
        string;

    fileSize?:
        number;

    collection?:
        string;

    createdAt?:
        string;
}

// =============================================================================
// MOVIE REPOSITORY
// =============================================================================

export class MovieRepository {

    // =========================================================================
    // ADD MOVIE
    // =========================================================================

    public static addMovie(
        data: {
            title:
                string;

            year?:
                number;

            fileId:
                string;

            fileName:
                string;

            fileSize?:
                number;

            collection?:
                string;
        }
    ): boolean {

        try {

            const statement =
                db.prepare(`
                    INSERT INTO movies (

                        title,
                        year,
                        file_id,
                        file_name,
                        file_size,
                        collection

                    )
                    VALUES (

                        @title,
                        @year,
                        @fileId,
                        @fileName,
                        @fileSize,
                        @collection

                    );
                `);

            statement.run({

                title:
                    data.title,

                year:
                    data.year ??
                    null,

                fileId:
                    data.fileId,

                fileName:
                    data.fileName,

                fileSize:
                    data.fileSize ??
                    null,

                collection:
                    data.collection ??
                    null
            });

            console.log(
                `💾 Film gespeichert: ${data.title}`
            );

            return true;

        } catch (
            error
        ) {

            /*
             * A UNIQUE constraint violation on file_id means
             * the Telegram media already exists in the archive.
             */

            console.log(
                "⚠️ Film bereits im Archiv oder konnte nicht gespeichert werden:",
                error
            );

            return false;
        }
    }

    // =========================================================================
    // EXISTS
    // =========================================================================

    public static exists(
        fileId: string
    ): boolean {

        const row =
            db
                .prepare(`
                    SELECT id
                    FROM movies
                    WHERE file_id = ?
                    LIMIT 1
                `)
                .get(
                    fileId
                );

        return Boolean(
            row
        );
    }

    // =========================================================================
    // GET BY FILE ID
    // =========================================================================

    public static getByFileId(
        fileId: string
    ): MovieRecord | undefined {

        const row =
            db
                .prepare(`
                    SELECT

                        id,

                        title,

                        year,

                        file_id
                            AS fileId,

                        file_name
                            AS fileName,

                        file_size
                            AS fileSize,

                        collection,

                        created_at
                            AS createdAt

                    FROM movies

                    WHERE file_id = ?

                    LIMIT 1
                `)
                .get(
                    fileId
                );

        if (
            !row
        ) {

            return undefined;
        }

        return row as MovieRecord;
    }

    // =========================================================================
    // GET BY TITLE
    // =========================================================================

    public static getByTitle(
        title: string
    ): MovieRecord[] {

        const rows =
            db
                .prepare(`
                    SELECT

                        id,

                        title,

                        year,

                        file_id
                            AS fileId,

                        file_name
                            AS fileName,

                        file_size
                            AS fileSize,

                        collection,

                        created_at
                            AS createdAt

                    FROM movies

                    WHERE LOWER(title)
                        = LOWER(?)

                    ORDER BY
                        id ASC
                `)
                .all(
                    title
                );

        return rows as MovieRecord[];
    }

    // =========================================================================
    // GET BY COLLECTION
    // =========================================================================

    public static getByCollection(
        collection: string
    ): MovieRecord[] {

        const rows =
            db
                .prepare(`
                    SELECT

                        id,

                        title,

                        year,

                        file_id
                            AS fileId,

                        file_name
                            AS fileName,

                        file_size
                            AS fileSize,

                        collection,

                        created_at
                            AS createdAt

                    FROM movies

                    WHERE LOWER(collection)
                        = LOWER(?)

                    ORDER BY
                        year ASC,
                        id ASC
                `)
                .all(
                    collection
                );

        return rows as MovieRecord[];
    }

    // =========================================================================
    // COUNT
    // =========================================================================

    public static count(): number {

        const row =
            db
                .prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM movies
                `)
                .get() as {
                    count:
                        number;
                };

        return Number(
            row.count
        );
    }

    // =========================================================================
    // GET ALL
    // =========================================================================

    public static getAll(): MovieRecord[] {

        const rows =
            db
                .prepare(`
                    SELECT

                        id,

                        title,

                        year,

                        file_id
                            AS fileId,

                        file_name
                            AS fileName,

                        file_size
                            AS fileSize,

                        collection,

                        created_at
                            AS createdAt

                    FROM movies

                    ORDER BY
                        id DESC
                `)
                .all();

        return rows as MovieRecord[];
    }

    // =========================================================================
    // COLLECTION COUNT
    // =========================================================================

    public static countCollection(
        collection: string
    ): number {

        const row =
            db
                .prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM movies
                    WHERE LOWER(collection)
                        = LOWER(?)
                `)
                .get(
                    collection
                ) as {
                    count:
                        number;
                };

        return Number(
            row.count
        );
    }

    // =========================================================================
    // CLOSE
    // =========================================================================

    public static close(): void {

        try {

            db.close();

            console.log(
                "💾 SQLite Datenbank geschlossen."
            );

        } catch (
            error
        ) {

            console.error(
                "❌ SQLite Shutdown Fehler:",
                error
            );
        }
    }
}