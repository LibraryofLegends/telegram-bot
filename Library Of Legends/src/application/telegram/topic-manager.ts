/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TopicManager

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-TOPIC-0001

LOL-ID..............: LOL-TG-TOPIC-0001

File................: topic-manager.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Creates and manages Telegram forum topics.

===============================================================================
*/

export class TopicManager {

    private static cache = new Map<string, number>();

    public static async getOrCreateTopic(
        bot: any,
        chatId: number,
        title: string
    ): Promise<number> {

        if (this.cache.has(title)) {
            return this.cache.get(title)!;
        }

        const topic = await bot.api.createForumTopic(chatId, title);

        this.cache.set(title, topic.message_thread_id);

        return topic.message_thread_id;
    }
}