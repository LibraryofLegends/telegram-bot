/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: DatabaseService

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-INFRA-DB-0001

LOL-ID..............: LOL-DB-CORE-0001

File................: database.ts

Location............
Library Of Legend/src/infrastructure/database/

Version.............: 1.0.2

Status..............: Core

Lifecycle...........: Production

Description.........

SQLite persistence layer for the clean Library Of Legends restart.

Responsibilities:

- Initialize SQLite database
- Create media table
- Store parsed media information
- Provide duplicate detection
- Provide basic lookup
- Provide record count
- Avoid TypeScript declaration conflicts
- Keep database implementation isolated

Important:

The better-sqlite3 package is loaded through require()
because the current project does not use its external TypeScript
declaration package.

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export type MediaType =
    | "movie"
    | "series"
    | "unknown";

export interface MediaRecord {

    type:
        MediaType;

    title:
        string;

    year?:
        number;

    season?:
        number;

    episode?:
        number;

    episodeTitle?:
        string;

    quality?:
        string;

    source?:
        string;

    fileName:
        string;

    fileId:
        string;

    fileSize?:
        number;
}

// =============================================================================
// BETTER-SQLITE3
// =============================================================================
//
// IMPORTANT:
//
// We intentionally do NOT use:
//
// import Database from "better-sqlite3";
//
// because the current project does not have TypeScript declarations
// for better-sqlite3.
//
// @types/node is already installed, so require() is available.
//
// =============================================================================

const DatabaseConstructor =
    require(
        "better-sqlite3"
    ) as any;

// =============================================================================
// DATABASE SERVICE
// =============================================================================

export class DatabaseService {

    // =========================================================================
    // DATABASE INSTANCE
    // =========================================================================

    private readonly db:
        any;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor() {

        this.db =
            new DatabaseConstructor(
                "library.db"
            );

        this.initialize();

        console.log(
            "💾 SQLite Datenbank initialisiert."
        );
    }

    // =========================================================================
    // INITIALIZE
    // =========================================================================

    private initialize(): void {

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS media (

                id
                    INTEGER
                    PRIMARY KEY
                    AUTOINCREMENT,

                type
                    TEXT
                    NOT NULL,

                title
                    TEXT
                    NOT NULL,

                year
                    INTEGER,

                season
                    INTEGER,

                episode
                    INTEGER,

                episode_title
                    TEXT,

                quality
                    TEXT,

                source
                    TEXT,

                file_name
                    TEXT
                    NOT NULL,

                file_id
                    TEXT
                    NOT NULL
                    UNIQUE,

                file_size
                    INTEGER,

                created_at
                    DATETIME
                    DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // =====================================================================
        // INDEX: FILE ID
        // =====================================================================

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_media_file_id
            ON media(file_id);
        `);

        // =====================================================================
        // INDEX: TITLE
        // =====================================================================

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_media_title
            ON media(title);
        `);

        // =====================================================================
        // INDEX: TYPE
        // =====================================================================

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_media_type
            ON media(type);
        `);
    }

    // =========================================================================
    // INSERT MEDIA
    // =========================================================================

    public insertMedia(
        data: MediaRecord
    ): void {

        // =====================================================================
        // DUPLICATE CHECK
        // =====================================================================

        if (
            this.exists(
                data.fileId
            )
        ) {

            console.log(
                `♻️ Media bereits vorhanden: ${data.fileId}`
            );

            return;
        }

        // =====================================================================
        // PREPARE
        // =====================================================================

        const statement =
            this.db.prepare(`
                INSERT INTO media (

                    type,
                    title,
                    year,
                    season,
                    episode,
                    episode_title,
                    quality,
                    source,
                    file_name,
                    file_id,
                    file_size

                )
                VALUES (

                    @type,
                    @title,
                    @year,
                    @season,
                    @episode,
                    @episodeTitle,
                    @quality,
                    @source,
                    @fileName,
                    @fileId,
                    @fileSize

                );
            `);

        // =====================================================================
        // EXECUTE
        // =====================================================================

        statement.run({

            type:
                data.type,

            title:
                data.title,

            year:
                data.year ??
                null,

            season:
                data.season ??
                null,

            episode:
                data.episode ??
                null,

            episodeTitle:
                data.episodeTitle ??
                null,

            quality:
                data.quality ??
                null,

            source:
                data.source ??
                null,

            fileName:
                data.fileName,

            fileId:
                data.fileId,

            fileSize:
                data.fileSize ??
                null
        });

        console.log(
            `💾 Media gespeichert: ${data.title}`
        );
    }

    // =========================================================================
    // GET BY FILE ID
    // =========================================================================

    public getByFileId(
        fileId: string
    ): MediaRecord | undefined {

        const row =
            this.db
                .prepare(`
                    SELECT

                        type,

                        title,

                        year,

                        season,

                        episode,

                        episode_title
                            AS episodeTitle,

                        quality,

                        source,

                        file_name
                            AS fileName,

                        file_id
                            AS fileId,

                        file_size
                            AS fileSize

                    FROM media

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

        return row as MediaRecord;
    }

    // =========================================================================
    // EXISTS
    // =========================================================================

    public exists(
        fileId: string
    ): boolean {

        const row =
            this.db
                .prepare(`
                    SELECT id

                    FROM media

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
    // GET BY TITLE
    // =========================================================================

    public getByTitle(
        title: string
    ): MediaRecord[] {

        const rows =
            this.db
                .prepare(`
                    SELECT

                        type,

                        title,

                        year,

                        season,

                        episode,

                        episode_title
                            AS episodeTitle,

                        quality,

                        source,

                        file_name
                            AS fileName,

                        file_id
                            AS fileId,

                        file_size
                            AS fileSize

                    FROM media

                    WHERE LOWER(title)
                        = LOWER(?)

                    ORDER BY
                        created_at DESC
                `)
                .all(
                    title
                );

        return rows as MediaRecord[];
    }

    // =========================================================================
    // GET ALL
    // =========================================================================

    public getAll(): MediaRecord[] {

        const rows =
            this.db
                .prepare(`
                    SELECT

                        type,

                        title,

                        year,

                        season,

                        episode,

                        episode_title
                            AS episodeTitle,

                        quality,

                        source,

                        file_name
                            AS fileName,

                        file_id
                            AS fileId,

                        file_size
                            AS fileSize

                    FROM media

                    ORDER BY
                        created_at DESC
                `)
                .all();

        return rows as MediaRecord[];
    }

    // =========================================================================
    // COUNT
    // =========================================================================

    public count(): number {

        const row =
            this.db
                .prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM media
                `)
                .get() as {
                    count: number;
                };

        return Number(
            row.count
        );
    }

    // =========================================================================
    // CLOSE
    // =========================================================================

    public close(): void {

        try {

            this.db.close();

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