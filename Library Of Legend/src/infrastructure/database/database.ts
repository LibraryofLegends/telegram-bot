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

Version.............: 1.0.1

Status..............: Core

Lifecycle...........: Production

Description.........

SQLite persistence layer for the clean Library Of Legends restart.

Responsibilities:

- Initialize SQLite database
- Create media table
- Store parsed media information
- Provide a small and isolated persistence API
- Avoid external database dependencies

===============================================================================
*/

/*
 * better-sqlite3 does not expose TypeScript declarations in the current
 * project configuration.
 *
 * The declaration is kept directly in this file so no additional .d.ts file
 * is required.
 */
declare module "better-sqlite3";

import Database from "better-sqlite3";

// =============================================================================
// TYPES
// =============================================================================

export type MediaType =
    | "movie"
    | "series"
    | "unknown";

export interface MediaRecord {

    type: MediaType;

    title: string;

    year?: number;

    season?: number;

    episode?: number;

    episodeTitle?: string;

    quality?: string;

    source?: string;

    fileName: string;

    fileId: string;

    fileSize?: number;
}

// =============================================================================
// DATABASE SERVICE
// =============================================================================

export class DatabaseService {

    private readonly db:
        any;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor() {

        this.db =
            new Database(
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
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                type TEXT NOT NULL,

                title TEXT NOT NULL,

                year INTEGER,

                season INTEGER,

                episode INTEGER,

                episode_title TEXT,

                quality TEXT,

                source TEXT,

                file_name TEXT NOT NULL,

                file_id TEXT NOT NULL,

                file_size INTEGER,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_media_file_id
            ON media(file_id);
        `);

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_media_title
            ON media(title);
        `);
    }

    // =========================================================================
    // INSERT MEDIA
    // =========================================================================

    public insertMedia(
        data: MediaRecord
    ): void {

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
                        episode_title AS episodeTitle,
                        quality,
                        source,
                        file_name AS fileName,
                        file_id AS fileId,
                        file_size AS fileSize
                    FROM media
                    WHERE file_id = ?
                    LIMIT 1
                `)
                .get(
                    fileId
                );

        return row as
            MediaRecord |
            undefined;
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
    // COUNT
    // =========================================================================

    public count(): number {

        const row =
            this.db
                .prepare(`
                    SELECT COUNT(*) AS count
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

        this.db.close();

        console.log(
            "💾 SQLite Datenbank geschlossen."
        );
    }
}