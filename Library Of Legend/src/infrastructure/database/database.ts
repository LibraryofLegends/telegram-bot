/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Database

Architecture Layer..: Infrastructure

Module..............: Persistence

Module ID...........: LOL-MOD-INFRA-DB-0001

LOL-ID..............: LOL-DB-CORE-0001

File................: database.ts

Location............
Library Of Legend/src/infrastructure/database/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

SQLite Database Layer (Clean Foundation)

Responsibilities:

- Initialize SQLite database
- Create tables (if not exists)
- Provide insert method for media entries

Important:

- No ORM
- No external DB
- No relations yet
- Single table design (initial phase)

===============================================================================
*/

import Database from "better-sqlite3";

// =============================================================================
// TYPES
// =============================================================================

export interface MediaRecord {

    type: "movie" | "series" | "unknown";

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
// DATABASE
// =============================================================================

export class DatabaseService {

    private db: Database.Database;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor() {

        this.db = new Database("library.db");

        this.init();

        console.log("💾 SQLite Datenbank initialisiert.");
    }

    // =========================================================================
    // INIT
    // =========================================================================

    private init(): void {

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                type TEXT,
                title TEXT,
                year INTEGER,

                season INTEGER,
                episode INTEGER,
                episode_title TEXT,

                quality TEXT,
                source TEXT,

                file_name TEXT,
                file_id TEXT,
                file_size INTEGER,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    // =========================================================================
    // INSERT
    // =========================================================================

    public insertMedia(
        data: MediaRecord
    ): void {

        const stmt =
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
                ) VALUES (
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

        stmt.run({
            type: data.type,
            title: data.title,
            year: data.year ?? null,
            season: data.season ?? null,
            episode: data.episode ?? null,
            episodeTitle: data.episodeTitle ?? null,
            quality: data.quality ?? null,
            source: data.source ?? null,
            fileName: data.fileName,
            fileId: data.fileId,
            fileSize: data.fileSize ?? null
        });
    }
}