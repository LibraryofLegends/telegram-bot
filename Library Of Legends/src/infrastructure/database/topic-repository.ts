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
- Keep database logic isolated from application layer

Database:

SQLite (better-sqlite3)

Table:

series_topics

===============================================================================
*/

import Database from "better-sqlite3";

const db = new Database("library.db");

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

    public static find(chatId: string, normalizedName: string): any | undefined {
        try {
            return db.prepare(`
                SELECT *
                FROM series_topics
                WHERE chat_id = ?
                AND normalized_name = ?
            `).get(chatId, normalizedName);
        } catch (error) {
            console.error("❌ TopicRepository.find Fehler:", error);
            return undefined;
        }
    }

    public static save(
        chatId: string,
        normalizedName: string,
        topicName: string,
        messageThreadId: number
    ): void {

        const now = Date.now();

        try {
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
                normalizedName,
                topicName,
                messageThreadId,
                now,
                now
            );
        } catch (error) {
            console.error("❌ TopicRepository.save Fehler:", error);
        }
    }

    public static remove(chatId: string, normalizedName: string): boolean {
        try {
            const result = db.prepare(`
                DELETE FROM series_topics
                WHERE chat_id = ?
                AND normalized_name = ?
            `).run(chatId, normalizedName);

            return result.changes > 0;
        } catch (error) {
            console.error("❌ TopicRepository.remove Fehler:", error);
            return false;
        }
    }

    public static getAllForChat(chatId: string): any[] {
        try {
            return db.prepare(`
                SELECT *
                FROM series_topics
                WHERE chat_id = ?
                ORDER BY topic_name ASC
            `).all(chatId);
        } catch (error) {
            console.error("❌ TopicRepository.getAllForChat Fehler:", error);
            return [];
        }
    }

    public static count(): number {
        try {
            const result = db.prepare(`
                SELECT COUNT(*) as count
                FROM series_topics
            `).get();

            return result?.count || 0;
        } catch (error) {
            console.error("❌ TopicRepository.count Fehler:", error);
            return 0;
        }
    }

    public static clearChat(chatId: string): number {
        try {
            const result = db.prepare(`
                DELETE FROM series_topics
                WHERE chat_id = ?
            `).run(chatId);

            return result.changes || 0;
        } catch (error) {
            console.error("❌ TopicRepository.clearChat Fehler:", error);
            return 0;
        }
    }
}