/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MovieRepository

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-INF-DB-0001

LOL-ID..............: LOL-DB-CORE-0004

File................: database.ts

Location............
Library Of Legend/src/infrastructure/database/

Version.............: 4.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

High-performance SQLite persistence layer for Library Of Legends.

Responsibilities:

- Initialize SQLite database
- Preserve existing movie data
- Automatically add missing columns
- Store movie metadata
- Prevent duplicate Telegram File-IDs
- Perform intelligent duplicate detection
- Persist Archive IDs
- Persist collections
- Resolve legacy collections
- Normalize movie titles
- Support fast title/year lookups
- Support collection queries
- Support archive queries
- Support search
- Optimize database indexes

Duplicate detection strategy:

1. Telegram File-ID
2. Normalized title
3. Release year
4. File size with tolerance

Important:

- better-sqlite3 is loaded through require()
- No @types/better-sqlite3 dependency is required
- MovieRepository remains the public database API
- Existing library.db data is preserved
- Missing columns are migrated automatically
- file_id remains UNIQUE
- archive_id remains UNIQUE
- normalized_title is stored for fast duplicate detection

===============================================================================
*/

// =============================================================================
// BETTER-SQLITE3
// =============================================================================
//
// IMPORTANT:
//
// The project intentionally uses require() here because the current project
// does not provide TypeScript declarations for better-sqlite3.
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

    normalizedTitle?:
        string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DUPLICATE_SIZE_TOLERANCE =
    50 * 1024 * 1024;

// =============================================================================
// TITLE NORMALIZATION
// =============================================================================

function normalizeTitle(
    value: string
): string {

    return String(
        value ||
        ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()

        // ---------------------------------------------------------------------
        // File extension
        // ---------------------------------------------------------------------

        .replace(
            /\.[a-z0-9]{2,5}$/i,
            ""
        )

        // ---------------------------------------------------------------------
        // Technical metadata
        // ---------------------------------------------------------------------

        .replace(
            /\b(2160p|1080p|720p|576p|480p|4k|uhd|fhd|hd)\b/gi,
            " "
        )
        .replace(
            /\b(web[- ]dl|webrip|web|bluray|bdrip|hdtv|dvdrip|hdrip)\b/gi,
            " "
        )
        .replace(
            /\b(x264|x265|h264|h265|hevc|av1)\b/gi,
            " "
        )

        // ---------------------------------------------------------------------
        // Audio metadata
        // ---------------------------------------------------------------------

        .replace(
            /\b(de|en|de-en|eng|ger|german|english)\b/gi,
            " "
        )

        // ---------------------------------------------------------------------
        // Common title separators
        // ---------------------------------------------------------------------

        .replace(
            /[._\-–—()[\]{}:]+/g,
            " "
        )

        // ---------------------------------------------------------------------
        // Words that should not influence movie identity
        // ---------------------------------------------------------------------

        .replace(
            /\b(chapter|part|movie|film|the final chapter|final chapter)\b/gi,
            " "
        )

        // ---------------------------------------------------------------------
        // Remove year
        // ---------------------------------------------------------------------

        .replace(
            /\b(19\d{2}|20\d{2})\b/g,
            " "
        )

        // ---------------------------------------------------------------------
        // Keep letters and numbers
        // ---------------------------------------------------------------------

        .replace(
            /[^\p{L}\p{N}]+/gu,
            ""
        )

        .trim();
}

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

function initializeDatabase(): void {

    // =========================================================================
    // BASE TABLE
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

            normalized_title
                TEXT,

            created_at
                TEXT
                DEFAULT (
                    datetime('now')
                )
        );
    `);

    // =========================================================================
    // EXISTING COLUMNS
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
    // COLLECTION MIGRATION
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
    // ARCHIVE ID MIGRATION
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
    // CREATED AT MIGRATION
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
    // NORMALIZED TITLE MIGRATION
    // =========================================================================

    if (
        !existingColumns.has(
            "normalized_title"
        )
    ) {

        db.exec(`
            ALTER TABLE movies
            ADD COLUMN normalized_title TEXT
        `);

        console.log(
            "🛠️ Datenbank erweitert: normalized_title"
        );
    }

    // =========================================================================
    // BACKFILL NORMALIZED TITLES
    // =========================================================================

    const moviesWithoutNormalizedTitle =
        db
            .prepare(
                `
                SELECT
                    id,
                    title
                FROM movies
                WHERE
                    normalized_title IS NULL
                    OR normalized_title = ''
                `
            )
            .all() as Array<{
                id:
                    number;

                title:
                    string;
            }>;

    const updateNormalizedTitle =
        db.prepare(
            `
            UPDATE movies

            SET normalized_title = ?

            WHERE id = ?
            `
        );

    const backfillTransaction =
        db.transaction(
            (
                rows:
                    Array<{
                        id:
                            number;

                        title:
                            string;
                    }>
            ) => {

                for (
                    const row of rows
                ) {

                    updateNormalizedTitle.run(
                        normalizeTitle(
                            row.title
                        ),
                        row.id
                    );
                }
            }
        );

    if (
        moviesWithoutNormalizedTitle.length > 0
    ) {

        backfillTransaction(
            moviesWithoutNormalizedTitle
        );

        console.log(
            `🛠️ ${moviesWithoutNormalizedTitle.length} Filmtitel normalisiert.`
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
        CREATE INDEX IF NOT EXISTS idx_movies_title_year
        ON movies(title, year);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_normalized_title
        ON movies(normalized_title);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_normalized_title_year
        ON movies(normalized_title, year);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_collection
        ON movies(collection);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_archive_id
        ON movies(archive_id);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_file_size
        ON movies(file_size);
    `);

    // =========================================================================
    // SQLITE PERFORMANCE
    // =========================================================================

    db.pragma(
        "journal_mode = WAL"
    );

    db.pragma(
        "synchronous = NORMAL"
    );

    db.pragma(
        "temp_store = MEMORY"
    );

    console.log(
        "⚡ SQLite Performance Mode aktiv."
    );

    console.log(
        "💾 SQLite Datenbank bereit."
    );
}

// =============================================================================
// INITIALIZE DATABASE
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

            const normalizedTitle =
                normalizeTitle(
                    data.title
                );

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
                        normalized_title,
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
                        @normalizedTitle,
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
                    null,

                normalizedTitle
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
    // EXISTS BY TELEGRAM FILE-ID
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
    // ADVANCED DUPLICATE DETECTION
    // =========================================================================
    //
    // Detection layers:
    //
    // 1. normalized title
    // 2. year compatibility
    // 3. file size compatibility
    //
    // A missing year or missing file size does not automatically reject a
    // potential duplicate.
    //
    // =========================================================================

    public static existsAdvanced(
        title: string,
        year?: number,
        fileSize?: number
    ): boolean {

        const normalizedTitle =
            normalizeTitle(
                title
            );

        if (
            !normalizedTitle
        ) {

            return false;
        }

        const rows =
            db
                .prepare(
                    `
                    SELECT

                        id,
                        title,
                        year,
                        file_size AS fileSize,
                        normalized_title AS normalizedTitle

                    FROM movies

                    WHERE normalized_title = ?
                    `
                )
                .all(
                    normalizedTitle
                ) as Array<{

                    id:
                        number;

                    title:
                        string;

                    year?:
                        number;

                    fileSize?:
                        number;

                    normalizedTitle?:
                        string;
                }>;

        if (
            rows.length ===
            0
        ) {

            return false;
        }

        return rows.some(
            movie => {

                // =============================================================
                // YEAR CHECK
                // =============================================================

                const sameYear =
                    !year ||
                    !movie.year ||
                    movie.year === year;

                if (
                    !sameYear
                ) {

                    return false;
                }

                // =============================================================
                // FILE SIZE CHECK
                // =============================================================

                const movieSize =
                    Number(
                        movie.fileSize ||
                        0
                    );

                const currentSize =
                    Number(
                        fileSize ||
                        0
                    );

                // =============================================================
                // NO SIZE AVAILABLE
                // =============================================================

                if (
                    !movieSize ||
                    !currentSize
                ) {

                    return true;
                }

                // =============================================================
                // SIZE TOLERANCE
                // =============================================================

                const sizeDifference =
                    Math.abs(
                        movieSize -
                        currentSize
                    );

                return (
                    sizeDifference <=
                    DUPLICATE_SIZE_TOLERANCE
                );
            }
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

                        normalized_title
                            AS normalizedTitle,

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

        const normalizedTitle =
            normalizeTitle(
                title
            );

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

                        normalized_title
                            AS normalizedTitle,

                        created_at
                            AS createdAt

                    FROM movies

                    WHERE normalized_title = ?

                    ORDER BY
                        year ASC,
                        id ASC
                    `
                )
                .all(
                    normalizedTitle
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

                        normalized_title
                            AS normalizedTitle,

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

                        normalized_title
                            AS normalizedTitle,

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
    // COUNT WITH COLLECTION
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