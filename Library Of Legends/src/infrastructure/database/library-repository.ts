/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LibraryRepository

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-DB-0001

LOL-ID..............: LOL-DB-0001

File................: library-repository.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 8.0.0

Status..............: STABLE

Lifecycle...........: Production Ready

Description.........

FINAL stable PostgreSQL repository for Library Of Legends.

Responsibilities:

- Save movies and series
- Prevent duplicates (File-ID priority)
- Search & filtering
- Favorites & trending
- View tracking
- Telegram routing storage
- Topic-ID handling
- Archive-ID system
- Automatic DB init + migration

===============================================================================
*/

import { Pool } from "pg";

// ============================================================================
// TYPES
// ============================================================================

export type LibraryMediaType =
    | "MOVIE"
    | "SERIES";

export interface LibraryRepositoryItem {
    id: string;
    title: string;
    file_name: string;
    type: LibraryMediaType;
    file_id: string;
    genre: string;
    archive_id?: string;
    telegram_chat_id?: string;
    topic_id?: number;
    views: number;
    is_favorite: boolean;
    created_at: Date;
}

// ============================================================================
// CLASS
// ============================================================================

export class LibraryRepository {

    private static pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    private static initialized = false;

    // =========================================================================
    // INIT
    // =========================================================================

    public static async init(): Promise<void> {

        if (this.initialized) return;

        await this.pool.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
        `);

        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS library_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                title TEXT NOT NULL,
                file_name TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL,

                file_id TEXT NOT NULL,
                genre TEXT DEFAULT 'Unbekannt',

                archive_id TEXT,
                telegram_chat_id TEXT,
                topic_id INTEGER,

                views INTEGER DEFAULT 0,
                is_favorite BOOLEAN DEFAULT FALSE,

                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await this.pool.query(`
            CREATE INDEX IF NOT EXISTS idx_file_id
            ON library_items(file_id);
        `);

        console.log("💾 DB bereit.");
        this.initialized = true;
    }

    // =========================================================================
    // SAVE (CORE LOGIC)
    // =========================================================================

    public static async save(
        title: string,
        fileName: string,
        type: LibraryMediaType,
        fileId: string,
        options: {
            genre?: string;
            archiveId?: string;
            telegramChatId?: string;
            topicId?: number;
        } = {}
    ): Promise<void> {

        await this.init();

        if (!title || !fileName || !fileId) {
            throw new Error("❌ Pflichtfelder fehlen.");
        }

        // ==============================================================
        // DUPLICATE BY FILE-ID
        // ==============================================================

        const existing = await this.pool.query(
            `SELECT * FROM library_items WHERE file_id = $1 LIMIT 1`,
            [fileId]
        );

        if (existing.rows.length > 0) {

            await this.pool.query(`
                UPDATE library_items SET
                    title = $1,
                    file_name = $2,
                    type = $3,
                    genre = $4,
                    archive_id = COALESCE($5, archive_id),
                    telegram_chat_id = COALESCE($6, telegram_chat_id),
                    topic_id = COALESCE($7, topic_id)
                WHERE file_id = $8
            `, [
                title,
                fileName,
                type,
                options.genre || "Unbekannt",
                options.archiveId || null,
                options.telegramChatId || null,
                options.topicId || null,
                fileId
            ]);

            console.log("♻️ Updated (File-ID match)");
            return;
        }

        // ==============================================================
        // INSERT
        // ==============================================================

        await this.pool.query(`
            INSERT INTO library_items (
                title,
                file_name,
                type,
                file_id,
                genre,
                archive_id,
                telegram_chat_id,
                topic_id
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [
            title,
            fileName,
            type,
            fileId,
            options.genre || "Unbekannt",
            options.archiveId || null,
            options.telegramChatId || null,
            options.topicId || null
        ]);

        console.log("💾 Gespeichert.");
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static async search(query: string) {

        await this.init();

        return (
            await this.pool.query(`
                SELECT * FROM library_items
                WHERE LOWER(title) LIKE LOWER($1)
                ORDER BY created_at DESC
                LIMIT 20
            `, [`%${query}%`])
        ).rows;
    }

    // =========================================================================
    // GET MOVIES
    // =========================================================================

    public static async getMovies() {

        await this.init();

        return (
            await this.pool.query(`
                SELECT * FROM library_items
                WHERE type = 'MOVIE'
                ORDER BY created_at DESC
            `)
        ).rows;
    }

    // =========================================================================
    // GET SERIES
    // =========================================================================

    public static async getSeries() {

        await this.init();

        return (
            await this.pool.query(`
                SELECT * FROM library_items
                WHERE type = 'SERIES'
                ORDER BY created_at DESC
            `)
        ).rows;
    }

    // =========================================================================
    // TRENDING
    // =========================================================================

    public static async getTrending() {

        await this.init();

        return (
            await this.pool.query(`
                SELECT * FROM library_items
                ORDER BY views DESC, created_at DESC
                LIMIT 10
            `)
        ).rows;
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    public static async increaseViews(id: string) {

        await this.init();

        await this.pool.query(`
            UPDATE library_items
            SET views = views + 1
            WHERE id = $1
        `, [id]);
    }
}