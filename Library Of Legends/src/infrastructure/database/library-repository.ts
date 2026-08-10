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

Version.............: 11.0.0

Status..............: STABLE

Lifecycle...........: Production Ready

Description.........

FINAL stable PostgreSQL repository for Library Of Legends.

NOW WITH:
- Flexible getAll() (Type OR Limit)
- Favorites system
- Trending system
- Telegram compatibility
- Future-ready filtering

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

        console.log("💾 DB bereit.");
        this.initialized = true;
    }

    // =========================================================================
    // SAVE
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

            return;
        }

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
    }

    // =========================================================================
    // 🔥 GET ALL (FLEXIBLE – FINAL FIX)
    // =========================================================================

    public static async getAll(
        typeOrLimit?: LibraryMediaType | number,
        limitParam?: number
    ): Promise<LibraryRepositoryItem[]> {

        await this.init();

        let type: LibraryMediaType | undefined;
        let limit: number | undefined;

        // ============================================================
        // FLEXIBLE PARAMETER HANDLING
        // ============================================================

        if (typeof typeOrLimit === "number") {
            limit = typeOrLimit;
        } else {
            type = typeOrLimit;
            limit = limitParam;
        }

        let query = `SELECT * FROM library_items`;
        const conditions: string[] = [];
        const values: unknown[] = [];

        // FILTER TYPE
        if (type) {
            values.push(type);
            conditions.push(`type = $${values.length}`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(" AND ");
        }

        query += ` ORDER BY created_at DESC`;

        // LIMIT
        if (limit) {
            values.push(limit);
            query += ` LIMIT $${values.length}`;
        }

        const result = await this.pool.query(query, values);

        return result.rows;
    }

    // =========================================================================
    // FAVORITES
    // =========================================================================

    public static async getFavorites(): Promise<LibraryRepositoryItem[]> {

        await this.init();

        return (
            await this.pool.query(`
                SELECT * FROM library_items
                WHERE is_favorite = true
                ORDER BY created_at DESC
            `)
        ).rows;
    }

    public static async toggleFavorite(id: string): Promise<void> {

        await this.init();

        await this.pool.query(`
            UPDATE library_items
            SET is_favorite = NOT is_favorite
            WHERE id = $1
        `, [id]);
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static async search(query: string): Promise<LibraryRepositoryItem[]> {

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
    // MOVIES / SERIES
    // =========================================================================

    public static async getMovies(): Promise<LibraryRepositoryItem[]> {
        return this.getAll("MOVIE");
    }

    public static async getSeries(): Promise<LibraryRepositoryItem[]> {
        return this.getAll("SERIES");
    }

    // =========================================================================
    // TRENDING
    // =========================================================================

    public static async getTrending(): Promise<LibraryRepositoryItem[]> {

        await this.init();

        return (
            await this.pool.query(`
                SELECT * FROM library_items
                ORDER BY views DESC
                LIMIT 10
            `)
        ).rows;
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    public static async increaseViews(id: string): Promise<void> {

        await this.init();

        await this.pool.query(`
            UPDATE library_items
            SET views = views + 1
            WHERE id = $1
        `, [id]);
    }
}