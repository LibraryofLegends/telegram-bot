/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TopicManager

Architecture Layer..: Application

Module..............: Routing

Module ID...........: LOL-MOD-ROU-0002

LOL-ID..............: LOL-ROU-TOP-0001

File................: topic-manager.ts

Location............
Library Of Legends/src/application/routing/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Manages Telegram forum topics for the Library Of Legends
automatic media archive.

Responsibilities:

- Normalize topic names
- Determine topic names for movies and series
- Create Telegram forum topics
- Reuse existing topic identifiers
- Store topic mappings in memory
- Provide topic information to the Telegram layer

The component is designed primarily for series archives,
where each series receives its own Telegram forum topic.

===============================================================================
*/

import {
    Telegraf
} from "telegraf";

/**
 * Topic information.
 */
export interface TopicInfo {

    /**
     * Telegram chat identifier.
     */
    chatId: string;

    /**
     * Telegram forum topic identifier.
     */
    topicId: number;

    /**
     * Human-readable topic name.
     */
    name: string;
}

/**
 * Topic Manager
 */
export class TopicManager {

    // =========================================================================
    // TOPIC CACHE
    // =========================================================================

    private static readonly topicCache =
        new Map<string, TopicInfo>();

    // =========================================================================
    // NORMALIZE NAME
    // =========================================================================

    public static normalizeName(
        name: string
    ): string {

        return name
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    // =========================================================================
    // CACHE KEY
    // =========================================================================

    private static getCacheKey(
        chatId: string,
        topicName: string
    ): string {

        return (
            `${chatId}:${this.normalizeName(topicName).toLowerCase()}`
        );
    }

    // =========================================================================
    // GET CACHED TOPIC
    // =========================================================================

    public static getCachedTopic(
        chatId: string,
        topicName: string
    ): TopicInfo | undefined {

        return this.topicCache.get(
            this.getCacheKey(
                chatId,
                topicName
            )
        );
    }

    // =========================================================================
    // STORE TOPIC
    // =========================================================================

    public static storeTopic(
        info: TopicInfo
    ): void {

        this.topicCache.set(
            this.getCacheKey(
                info.chatId,
                info.name
            ),
            info
        );
    }

    // =========================================================================
    // GET OR CREATE TOPIC
    // =========================================================================

    public static async getOrCreateTopic(
        bot: Telegraf,
        chatId: string,
        topicName: string
    ): Promise<number> {

        const normalizedName =
            this.normalizeName(
                topicName
            );

        if (!normalizedName) {

            throw new Error(
                "❌ Topic-Name darf nicht leer sein."
            );
        }

        const cached =
            this.getCachedTopic(
                chatId,
                normalizedName
            );

        if (cached) {

            return cached.topicId;
        }

        try {

            const result =
                await bot.telegram.callApi(
                    "createForumTopic",
                    {
                        chat_id: chatId,
                        name: normalizedName
                    }
                );

            const topicId =
                result.message_thread_id;

            const info: TopicInfo = {

                chatId,

                topicId,

                name:
                    normalizedName
            };

            this.storeTopic(
                info
            );

            console.log(
                `📌 Telegram Topic erstellt: ${normalizedName} (${topicId})`
            );

            return topicId;

        } catch (error) {

            console.error(
                `❌ Fehler beim Erstellen des Topics "${normalizedName}":`,
                error
            );

            throw error;
        }
    }

    // =========================================================================
    // GET OR CREATE SERIES TOPIC
    // =========================================================================

    public static async getOrCreateSeriesTopic(
        bot: Telegraf,
        chatId: string,
        seriesTitle: string
    ): Promise<number> {

        return this.getOrCreateTopic(
            bot,
            chatId,
            seriesTitle
        );
    }

    // =========================================================================
    // BUILD MOVIE TOPIC NAME
    // =========================================================================

    public static buildMovieTopicName(
        title: string,
        year?: number
    ): string {

        const cleanTitle =
            this.normalizeName(
                title
            );

        if (year) {

            return (
                `${cleanTitle} (${year})`
            );
        }

        return cleanTitle;
    }

    // =========================================================================
    // BUILD SERIES TOPIC NAME
    // =========================================================================

    public static buildSeriesTopicName(
        title: string
    ): string {

        return this.normalizeName(
            title
        );
    }

    // =========================================================================
    // REMOVE CACHED TOPIC
    // =========================================================================

    public static removeCachedTopic(
        chatId: string,
        topicName: string
    ): boolean {

        return this.topicCache.delete(
            this.getCacheKey(
                chatId,
                topicName
            )
        );
    }

    // =========================================================================
    // CLEAR CACHE
    // =========================================================================

    public static clearCache(): void {

        this.topicCache.clear();

        console.log(
            "🧹 Topic-Cache geleert."
        );
    }

    // =========================================================================
    // GET ALL CACHED TOPICS
    // =========================================================================

    public static getAllCachedTopics(): TopicInfo[] {

        return Array.from(
            this.topicCache.values()
        );
    }

    // =========================================================================
    // FIND TOPIC
    // =========================================================================

    public static findTopic(
        chatId: string,
        topicName: string
    ): TopicInfo | undefined {

        return this.getCachedTopic(
            chatId,
            topicName
        );
    }

    // =========================================================================
    // HAS TOPIC
    // =========================================================================

    public static hasTopic(
        chatId: string,
        topicName: string
    ): boolean {

        return (
            this.getCachedTopic(
                chatId,
                topicName
            ) !== undefined
        );
    }
}