/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TopicRepository

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-DB-0003

LOL-ID..............: LOL-DB-TOPIC-0001

File................: topic-repository.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Persistent storage for Telegram forum topics.

Responsibilities:

- Store series topics in database
- Retrieve topics by chat + normalized name
- Prevent duplicate topics (DB-level)
- Restore topics after bot restart
- Provide fast lookup for TopicManager

===============================================================================
*/

import { db } from "./database";

/**
 * Ensure table exists.
 */
db.prepare(`
    CREATE TABLE IF NOT EXISTS series_topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        topic_name TEXT NOT NULL,
        message_thread_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,

        UNIQUE(chat_id, normalized_name)
    )
`).run();

export class TopicRepository {

    private static normalize(name: string): string {
        return String(name || "")
            .toLowerCase()
            .replace(/[\s\-_]+/g, " ")
            .trim();
    }

    public static find(chatId: string, name: string): any | undefined {

        const normalized = this.normalize(name);

        return db.prepare(`
            SELECT * FROM series_topics
            WHERE chat_id = ?
            AND normalized_name = ?
        `).get(chatId, normalized);
    }

    public static save(
        chatId: string,
        name: string,
        topicName: string,
        threadId: number
    ): void {

        const normalized = this.normalize(name);
        const now = Date.now();

        db.prepare(`
            INSERT INTO series_topics (
                chat_id,
                normalized_name,
                topic_name,
                message_thread_id,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(chat_id, normalized_name)
            DO UPDATE SET
                topic_name = excluded.topic_name,
                message_thread_id = excluded.message_thread_id,
                updated_at = excluded.updated_at
        `).run(
            chatId,
            normalized,
            topicName,
            threadId,
            now,
            now
        );
    }
}