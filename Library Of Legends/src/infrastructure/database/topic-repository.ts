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
Location............: Library Of Legends/src/infrastructure/database/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Persistent storage for Telegram forum topics.
===============================================================================
*/

import { Database } from "./database";

export interface SeriesTopic {
  chatId: string;
  normalizedName: string;
  topicName: string;
  messageThreadId: number;
}

export class TopicRepository {
  public constructor(private readonly database: Database) {}

  public async find(chatId: string, normalizedName: string): Promise<SeriesTopic | null> {
    const result = await this.database.client.query<SeriesTopic>(
      `SELECT chat_id AS "chatId", normalized_name AS "normalizedName", topic_name AS "topicName", message_thread_id AS "messageThreadId"
       FROM series_topics WHERE chat_id = $1 AND normalized_name = $2 LIMIT 1`,
      [chatId, normalizedName]
    );
    return result.rows[0] || null;
  }

  public async save(topic: SeriesTopic): Promise<void> {
    await this.database.client.query(
      `INSERT INTO series_topics (chat_id, normalized_name, topic_name, message_thread_id)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (chat_id, normalized_name) DO UPDATE SET
         topic_name = EXCLUDED.topic_name,
         message_thread_id = EXCLUDED.message_thread_id,
         updated_at = NOW()`,
      [topic.chatId, topic.normalizedName, topic.topicName, topic.messageThreadId]
    );
  }
}