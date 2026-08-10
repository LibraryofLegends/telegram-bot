/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesTopicManager

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-STM-0001

LOL-ID..............: LOL-STM-0001

File................: series-topic-manager.ts

Location............
Library Of Legends/src/framework/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Manages Telegram forum topics for series.
Creates or reuses topics per series title.

===============================================================================
*/

import { Telegraf } from "telegraf";

/**
 * Topic Cache (simple in-memory)
 */
const topicCache = new Map<string, number>();

/**
 * Series Topic Manager
 */
export class SeriesTopicManager {

    /**
     * Get or create a topic for a series
     */
    public static async getOrCreateTopic(
        bot: Telegraf,
        chatId: string,
        title: string
    ): Promise<number> {

        // =========================================================================
        // CACHE CHECK
        // =========================================================================

        if (topicCache.has(title)) {
            return topicCache.get(title)!;
        }

        // =========================================================================
        // CREATE NEW TOPIC
        // =========================================================================

        const result = await bot.telegram.createForumTopic(
            chatId,
            title
        );

        const threadId = result.message_thread_id;

        // =========================================================================
        // SAVE CACHE
        // =========================================================================

        topicCache.set(title, threadId);

        return threadId;

    }

}