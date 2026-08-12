/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MovieRepository

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-INF-DB-0001

LOL-ID..............: LOL-DB-CORE-0003

File................: database.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central SQLite persistence layer for Library Of Legends.

Responsibilities:

- Initialize SQLite database
- Preserve existing movie data
- Create missing columns automatically
- Store movie metadata
- Prevent duplicate Telegram File-IDs
- Persist Archive IDs
- Persist collection names
- Automatically resolve legacy collections from movie titles
- Provide movie lookup
- Provide collection lookup
- Provide collection counting
- Provide archive counting
- Support the search system

Important:

- better-sqlite3 is loaded through require()
- No @types/better-sqlite3 dependency is required
- MovieRepository remains the public database API
- Existing library.db data is preserved
- Missing columns are added automatically
- file_id is UNIQUE
- archive_id is UNIQUE when present

===============================================================================
*/

// =============================================================================
// BETTER-SQLITE3
// =============================================================================
//
// IMPORTANT:
//
// Do NOT replace this with:
//
// import Database from "better-sqlite3";
//
// The current project intentionally uses require() because the project does
// not contain TypeScript declarations for better-sqlite3.
//
// =============================================================================

const BetterSqlite3 =
    require(
        "better-sqlite3"
    ) as any;

// =============================================================================
// DATABASE INSTANCE
// =============================================================================

const db =
    new BetterSqlite3(
        "library.db"
    );

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
        string | null;

    archiveId?:
        string;

    createdAt?:
        string;
}

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

function initializeDatabase(): void {

    // =========================================================================
    // BASE TABLE
    // =========================================================================
    //
    // CREATE TABLE IF NOT EXISTS only creates the table when it does not
    // exist yet. Existing databases are therefore preserved.
    //
    // =========================================================================

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

            archive_id
                TEXT
                UNIQUE,

            created_at
                TEXT
                DEFAULT (
                    datetime('now')
                )
        );
    `);

    // =========================================================================
    // MIGRATION
    // =========================================================================
    //
    // Older versions of the project may already have a movies table but not
    // all of the current columns. We add missing columns individually.
    //
    // =========================================================================

    const columns =
        db
            .prepare(
                `
                PRAGMA table_info(movies)
                `
            )
            .all() as Array<{
                name:
                    string;
            }>;

    const existingColumns =
        new Set(
            columns.map(
                column =>
                    column.name
            )
        );

    // =========================================================================
    // COLLECTION
    // =========================================================================

    if (
        !existingColumns.has(
            "collection"
        )
    ) {

        db.exec(`
            ALTER TABLE movies
            ADD COLUMN collection TEXT
        `);

        console.log(
            "🛠️ Datenbank erweitert: collection"
        );
    }

    // =========================================================================
    // ARCHIVE ID
    // =========================================================================

    if (
        !existingColumns.has(
            "archive_id"
        )
    ) {

        db.exec(`
            ALTER TABLE movies
            ADD COLUMN archive_id TEXT
        `);

        console.log(
            "🛠️ Datenbank erweitert: archive_id"
        );
    }

    // =========================================================================
    // CREATED AT
    // =========================================================================

    if (
        !existingColumns.has(
            "created_at"
        )
    ) {

        db.exec(`
            ALTER TABLE movies
            ADD COLUMN created_at TEXT
        `);

        console.log(
            "🛠️ Datenbank erweitert: created_at"
        );
    }

    // =========================================================================
    // INDEXES
    // =========================================================================

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_title
        ON movies(title);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_collection
        ON movies(collection);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_archive_id
        ON movies(archive_id);
    `);

    console.log(
        "💾 SQLite Datenbank bereit."
    );
}

// =============================================================================
// INITIALIZE
// =============================================================================

initializeDatabase();

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

            archiveId?:
                string;
        }
    ): boolean {

        try {

            const statement =
                db.prepare(
                    `
                    INSERT INTO movies (

                        title,
                        year,
                        file_id,
                        file_name,
                        file_size,
                        collection,
                        archive_id,
                        created_at

                    )
                    VALUES (

                        @title,
                        @year,
                        @fileId,
                        @fileName,
                        @fileSize,
                        @collection,
                        @archiveId,
                        datetime('now')

                    )
                    `
                );

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
                    null,

                archiveId:
                    data.archiveId ??
                    null
            });

            console.log(
                `💾 Film gespeichert: ${data.title}`
            );

            return true;

        } catch (
            error
        ) {

            console.error(
                "❌ Film konnte nicht gespeichert werden:",
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
                .prepare(
                    `
                    SELECT id

                    FROM movies

                    WHERE file_id = ?

                    LIMIT 1
                    `
                )
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
    ):
        MovieRecord |
        undefined {

        const row =
            db
                .prepare(
                    `
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

                        archive_id
                            AS archiveId,

                        created_at
                            AS createdAt

                    FROM movies

                    WHERE file_id = ?

                    LIMIT 1
                    `
                )
                .get(
                    fileId
                );

        if (
            !row
        ) {

            return undefined;
        }

        const movie =
            row as MovieRecord;

        return this.applyCollectionFallback(
            movie
        );
    }

    // =========================================================================
    // GET BY TITLE
    // =========================================================================

    public static getByTitle(
        title: string
    ): MovieRecord[] {

        const rows =
            db
                .prepare(
                    `
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

                        archive_id
                            AS archiveId,

                        created_at
                            AS createdAt

                    FROM movies

                    WHERE LOWER(title)
                        = LOWER(?)

                    ORDER BY
                        year ASC,
                        id ASC
                    `
                )
                .all(
                    title
                ) as MovieRecord[];

        return rows.map(
            movie =>
                this.applyCollectionFallback(
                    movie
                )
        );
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static search(
        query: string
    ): MovieRecord[] {

        const cleanQuery =
            String(
                query ||
                ""
            )
                .trim()
                .toLowerCase();

        if (
            !cleanQuery
        ) {

            return [];
        }

        const pattern =
            `%${cleanQuery}%`;

        const rows =
            db
                .prepare(
                    `
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

                        archive_id
                            AS archiveId,

                        created_at
                            AS createdAt

                    FROM movies

                    WHERE
                        LOWER(title)
                            LIKE ?

                        OR

                        LOWER(
                            COALESCE(
                                collection,
                                ''
                            )
                        )
                            LIKE ?

                    ORDER BY
                        year DESC,
                        id DESC
                    `
                )
                .all(
                    pattern,
                    pattern
                ) as MovieRecord[];

        return rows.map(
            movie =>
                this.applyCollectionFallback(
                    movie
                )
        );
    }

    // =========================================================================
    // GET BY COLLECTION
    // =========================================================================

    public static getByCollection(
        collection: string
    ): MovieRecord[] {

        const cleanCollection =
            this.normalizeCollection(
                collection
            );

        const allMovies =
            this.getAll();

        return allMovies.filter(
            movie => {

                const movieCollection =
                    this.normalizeCollection(
                        movie.collection ||
                        ""
                    );

                return (
                    movieCollection ===
                    cleanCollection
                );
            }
        );
    }

    // =========================================================================
    // COUNT BY COLLECTION
    // =========================================================================

    public static countByCollection(
        collection: string
    ): number {

        return this.getByCollection(
            collection
        ).length;
    }

    // =========================================================================
    // GET LAST ARCHIVE ID
    // =========================================================================

    public static getLastArchiveId(
        code: string
    ):
        string |
        null {

        const row =
            db
                .prepare(
                    `
                    SELECT
                        archive_id

                    FROM movies

                    WHERE archive_id LIKE ?

                    ORDER BY
                        id DESC

                    LIMIT 1
                    `
                )
                .get(
                    `#LIB-${code}-%`
                ) as
                {
                    archive_id?:
                        string;
                } |
                undefined;

        return (
            row?.archive_id ||
            null
        );
    }

    // =========================================================================
    // GET ALL
    // =========================================================================

    public static getAll():
        MovieRecord[] {

        const rows =
            db
                .prepare(
                    `
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

                        archive_id
                            AS archiveId,

                        created_at
                            AS createdAt

                    FROM movies

                    ORDER BY
                        id DESC
                    `
                )
                .all() as MovieRecord[];

        return rows.map(
            movie =>
                this.applyCollectionFallback(
                    movie
                )
        );
    }

    // =========================================================================
    // COUNT
    // =========================================================================

    public static count():
        number {

        const row =
            db
                .prepare(
                    `
                    SELECT
                        COUNT(*) AS count

                    FROM movies
                    `
                )
                .get() as
                {
                    count:
                        number;
                };

        return Number(
            row.count
        );
    }

    // =========================================================================
    // COUNT ARCHIVED MOVIES WITH COLLECTION
    // =========================================================================

    public static countWithCollection(
        collection: string
    ):
        number {

        return this.getByCollection(
            collection
        ).length;
    }

    // =========================================================================
    // UPDATE COLLECTION
    // =========================================================================

    public static updateCollection(
        fileId: string,
        collection: string
    ): boolean {

        try {

            db
                .prepare(
                    `
                    UPDATE movies

                    SET collection = ?

                    WHERE file_id = ?
                    `
                )
                .run(
                    collection,
                    fileId
                );

            return true;

        } catch (
            error
        ) {

            console.error(
                "❌ Collection konnte nicht aktualisiert werden:",
                error
            );

            return false;
        }
    }

    // =========================================================================
    // UPDATE ARCHIVE ID
    // =========================================================================

    public static updateArchiveId(
        fileId: string,
        archiveId: string
    ): boolean {

        try {

            db
                .prepare(
                    `
                    UPDATE movies

                    SET archive_id = ?

                    WHERE file_id = ?
                    `
                )
                .run(
                    archiveId,
                    fileId
                );

            return true;

        } catch (
            error
        ) {

            console.error(
                "❌ Archive-ID konnte nicht aktualisiert werden:",
                error
            );

            return false;
        }
    }

    // =========================================================================
    // APPLY COLLECTION FALLBACK
    // =========================================================================

    private static applyCollectionFallback(
        movie: MovieRecord
    ):
        MovieRecord {

        if (
            movie.collection &&
            movie.collection.trim()
        ) {

            return {
                ...movie,
                collection:
                    this.normalizeCollection(
                        movie.collection
                    )
            };
        }

        const detected =
            this.detectCollectionFromTitle(
                movie.title
            );

        return {
            ...movie,
            collection:
                detected
        };
    }

    // =========================================================================
    // DETECT COLLECTION FROM TITLE
    // =========================================================================

    private static detectCollectionFromTitle(
        title: string
    ):
        string |
        null {

        const value =
            String(
                title ||
                ""
            )
                .toLowerCase()
                .trim();

        // =========================================================================
        // JOHN WICK
        // =========================================================================

        if (
            value.includes(
                "john wick"
            )
        ) {

            return "John Wick";
        }

        // =========================================================================
        // THE EQUALIZER
        // =========================================================================

        if (
            value.includes(
                "equalizer"
            )
        ) {

            return "The Equalizer";
        }

        // =========================================================================
        // FAST & FURIOUS
        // =========================================================================

        if (
            (
                value.includes(
                    "fast"
                ) &&
                value.includes(
                    "furious"
                )
            ) ||
            value.includes(
                "fast & furious"
            )
        ) {

            return "Fast & Furious";
        }

        // =========================================================================
        // HARRY POTTER
        // =========================================================================

        if (
            value.includes(
                "harry potter"
            )
        ) {

            return "Harry Potter";
        }

        // =========================================================================
        // TRANSFORMERS
        // =========================================================================

        if (
            value.includes(
                "transformers"
            )
        ) {

            return "Transformers";
        }

        // =========================================================================
        // SPIDER-MAN
        // =========================================================================

        if (
            value.includes(
                "spider-man"
            ) ||
            value.includes(
                "spiderman"
            )
        ) {

            return "Spider-Man";
        }

        // =========================================================================
        // BATMAN
        // =========================================================================

        if (
            value.includes(
                "batman"
            )
        ) {

            return "Batman";
        }

        // =========================================================================
        // SUPERMAN
        // =========================================================================

        if (
            value.includes(
                "superman"
            )
        ) {

            return "Superman";
        }

        // =========================================================================
        // JURASSIC
        // =========================================================================

        if (
            value.includes(
                "jurassic"
            )
        ) {

            return "Jurassic Park";
        }

        // =========================================================================
        // SCREAM
        // =========================================================================

        if (
            value.includes(
                "scream"
            )
        ) {

            return "Scream";
        }

        return null;
    }

    // =========================================================================
    // NORMALIZE COLLECTION
    // =========================================================================

    private static normalizeCollection(
        value: string
    ):
        string {

        const clean =
            String(
                value ||
                ""
            )
                .trim();

        const aliases:
            Record<string, string> = {

            "John Wick Reihe":
                "John Wick",

            "The Equalizer Reihe":
                "The Equalizer",

            "The Equalizer Filmreihe":
                "The Equalizer",

            "Fast & Furious Reihe":
                "Fast & Furious",

            "Harry Potter Reihe":
                "Harry Potter",

            "Transformers Reihe":
                "Transformers",

            "Spider-Man Reihe":
                "Spider-Man",

            "Spider-Man Universe":
                "Spider-Man",

            "Batman Reihe":
                "Batman",

            "Superman Reihe":
                "Superman",

            "Scream Filmreihe":
                "Scream"
        };

        return (
            aliases[
                clean
            ] ||
            clean
        );
    }

    // =========================================================================
    // CLOSE
    // =========================================================================

    public static close():
        void {

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