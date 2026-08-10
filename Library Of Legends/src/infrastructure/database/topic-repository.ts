/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TopicRepository

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-DB-0002

LOL-ID..............: LOL-DB-TOPIC-0001

File................: topic-repository.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 4.0.0

Status..............: STABLE

Lifecycle...........: Production Ready

Description.........

PostgreSQL Topic Repository for Library Of Legends.

Responsibilities:

- Persist Telegram forum topics
- Prevent duplicate topics per chat
- Store normalized names
- Provide fast lookup (chat + series)
- Provide thread ID mapping
- Provide statistics
- Handle migrations automatically

===============================================================================
*/

import { Pool } from "pg";

// ============================================================================
// TYPES
// ============================================================================

export interface TopicEntity {

    id: string;

    chat_id: string;

    name: string;

    normalized_name: string;

    message_thread_id: number;

    created_at: Date;
}

// ============================================================================
// CLASS
// ============================================================================

export class TopicRepository {

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
            CREATE TABLE IF NOT EXISTS topics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                chat_id TEXT NOT NULL,
                name TEXT NOT NULL,
                normalized_name TEXT NOT NULL,
                message_thread_id INTEGER NOT NULL,

                created_at TIMESTAMPTZ DEFAULT NOW(),

                UNIQUE(chat_id, normalized_name)
            );
        `);

        await this.pool.query(`
            CREATE INDEX IF NOT EXISTS idx_topics_chat
            ON topics(chat_id);
        `);

        console.log("📌 Topic DB bereit.");
        this.initialized = true;
    }

    // =========================================================================
    // SAVE / UPSERT
    // =========================================================================

    public static async save(
        chatId: string,
        name: string,
        normalizedName: string,
        threadId: number
    ): Promise<void> {

        await this.init();

        await this.pool.query(`
            INSERT INTO topics (
                chat_id,
                name,
                normalized_name,
                message_thread_id
            )
            VALUES ($1,$2,$3,$4)
            ON CONFLICT (chat_id, normalized_name)
            DO UPDATE SET
                name = EXCLUDED.name,
                message_thread_id = EXCLUDED.message_thread_id
        `, [
            chatId,
            name,
            normalizedName,
            threadId
        ]);

        console.log("📌 Topic gespeichert/aktualisiert.");
    }

    // =========================================================================
    // FIND BY SERIES
    // =========================================================================

    public static async find(
        chatId: string,
        normalizedName: string
    ): Promise<TopicEntity | undefined> {

        await this.init();

        const result = await this.pool.query(`
            SELECT * FROM topics
            WHERE chat_id = $1
            AND normalized_name = $2
            LIMIT 1
        `, [chatId, normalizedName]);

        return result.rows[0];
    }

    // =========================================================================
    // FIND BY THREAD ID
    // =========================================================================

    public static async findByThreadId(
        chatId: string,
        threadId: number
    ): Promise<TopicEntity | undefined> {

        await this.init();

        const result = await this.pool.query(`
            SELECT * FROM topics
            WHERE chat_id = $1
            AND message_thread_id = $2
            LIMIT 1
        `, [chatId, threadId]);

        return result.rows[0];
    }

    // =========================================================================
    // GET ALL FOR CHAT
    // =========================================================================

    public static async getAllForChat(
        chatId: string
    ): Promise<TopicEntity[]> {

        await this.init();

        const result = await this.pool.query(`
            SELECT * FROM topics
            WHERE chat_id = $1
            ORDER BY name ASC
        `, [chatId]);

        return result.rows;
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    public static async remove(
        chatId: string,
        normalizedName: string
    ): Promise<boolean> {

        await this.init();

        const result = await this.pool.query(`
            DELETE FROM topics
            WHERE chat_id = $1
            AND normalized_name = $2
        `, [chatId, normalizedName]);

        return result.rowCount > 0;
    }

    // =========================================================================
    // CLEAR CHAT
    // =========================================================================

    public static async clearChat(
        chatId: string
    ): Promise<number> {

        await this.init();

        const result = await this.pool.query(`
            DELETE FROM topics
            WHERE chat_id = $1
        `, [chatId]);

        return result.rowCount ?? 0;
    }

    // =========================================================================
    // COUNT ALL
    // =========================================================================

    public static async count(): Promise<number> {

        await this.init();

        const result = await this.pool.query(`
            SELECT COUNT(*)::int AS count FROM topics
        `);

        return result.rows[0]?.count ?? 0;
    }

    // =========================================================================
    // COUNT PER CHAT
    // =========================================================================

    public static async countForChat(
        chatId: string
    ): Promise<number> {

        await this.init();

        const result = await this.pool.query(`
            SELECT COUNT(*)::int AS count
            FROM topics
            WHERE chat_id = $1
        `, [chatId]);

        return result.rows[0]?.count ?? 0;
    }

    // =========================================================================
    // STATISTICS
    // =========================================================================

    public static async getStatistics(): Promise<{
        total: number;
        chats: number;
    }> {

        await this.init();

        const total = await this.count();

        const chatsResult = await this.pool.query(`
            SELECT COUNT(DISTINCT chat_id)::int AS count
            FROM topics
        `);

        return {
            total,
            chats: chatsResult.rows[0]?.count ?? 0
        };
    }
}