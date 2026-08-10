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

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram Forum Topic Manager for Library Of Legends.

Responsibilities:

- Normalize topic names
- Create Telegram forum topics
- Reuse existing topics
- Cache topic identifiers
- Create series-specific topics
- Create movie-specific topics when required
- Handle Telegram topic creation errors
- Provide topic information to TelegramBot
- Prevent duplicate topics during runtime

Primary use case:

SERIES
    ↓
Series title
    ↓
Telegram category group
    ↓
Existing topic?
    ├── YES → reuse topic
    └── NO  → create topic
                 ↓
             save in cache

Telegram communication itself is handled through the
Telegraf Telegram API instance passed to this component.

===============================================================================
*/

import {
    Telegraf
} from "telegraf";

/**
 * Information about a Telegram forum topic.
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

    /**
     * Timestamp when the topic was cached.
     */
    createdAt: number;
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
    // TOPIC CREATION LOCK
    // =========================================================================

    /**
     * Prevents two simultaneous requests from creating
     * the same Telegram topic twice.
     */
    private static readonly creationLocks =
        new Map<string, Promise<number>>();

    // =========================================================================
    // NORMALIZE NAME
    // =========================================================================

    public static normalizeName(
        name: string
    ): string {

        return String(
            name || ""
        )
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

        return [
            String(chatId).trim(),
            this.normalizeName(
                topicName
            ).toLowerCase()
        ].join(
            ":"
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

        const normalizedChatId =
            String(
                chatId || ""
            ).trim();

        // ---------------------------------------------------------------------
        // VALIDATION
        // ---------------------------------------------------------------------

        if (
            !normalizedChatId
        ) {

            throw new Error(
                "❌ Telegram Chat-ID fehlt."
            );
        }

        if (
            !normalizedName
        ) {

            throw new Error(
                "❌ Telegram Topic-Name darf nicht leer sein."
            );
        }

        // ---------------------------------------------------------------------
        // CACHE
        // ---------------------------------------------------------------------

        const cached =
            this.getCachedTopic(
                normalizedChatId,
                normalizedName
            );

        if (
            cached
        ) {

            console.log(
                `📌 Topic aus Cache verwendet: ${normalizedName} (${cached.topicId})`
            );

            return cached.topicId;
        }

        // ---------------------------------------------------------------------
        // CREATION LOCK
        // ---------------------------------------------------------------------

        const cacheKey =
            this.getCacheKey(
                normalizedChatId,
                normalizedName
            );

        const existingCreation =
            this.creationLocks.get(
                cacheKey
            );

        if (
            existingCreation
        ) {

            return existingCreation;
        }

        // ---------------------------------------------------------------------
        // CREATE TOPIC
        // ---------------------------------------------------------------------

        const creationPromise =
            this.createTopic(
                bot,
                normalizedChatId,
                normalizedName
            );

        this.creationLocks.set(
            cacheKey,
            creationPromise
        );

        try {

            return await creationPromise;

        } finally {

            this.creationLocks.delete(
                cacheKey
            );
        }
    }

    // =========================================================================
    // CREATE TOPIC
    // =========================================================================

    private static async createTopic(
        bot: Telegraf,
        chatId: string,
        topicName: string
    ): Promise<number> {

        try {

            console.log(
                "================================================="
            );

            console.log(
                "📌 TELEGRAM TOPIC ROUTING"
            );

            console.log(
                `📨 Chat-ID: ${chatId}`
            );

            console.log(
                `📝 Topic: ${topicName}`
            );

            console.log(
                "================================================="
            );

            const result =
                await bot.telegram.callApi(
                    "createForumTopic",
                    {
                        chat_id:
                            chatId,

                        name:
                            topicName
                    }
                );

            const topicId =
                result.message_thread_id;

            if (
                !topicId ||
                !Number.isInteger(
                    topicId
                )
            ) {

                throw new Error(
                    "❌ Telegram hat keine gültige Topic-ID zurückgegeben."
                );
            }

            const info: TopicInfo = {

                chatId,

                topicId,

                name:
                    topicName,

                createdAt:
                    Date.now()
            };

            this.storeTopic(
                info
            );

            console.log(
                `✅ Telegram Topic erstellt: ${topicName}`
            );

            console.log(
                `📌 Topic-ID: ${topicId}`
            );

            return topicId;

        } catch (error) {

            console.error(
                `❌ Fehler beim Erstellen des Topics "${topicName}":`,
                error
            );

            throw error;
        }
    }

    // =========================================================================
    // SERIES TOPIC
    // =========================================================================

    public static async getOrCreateSeriesTopic(
        bot: Telegraf,
        chatId: string,
        seriesTitle: string
    ): Promise<number> {

        const topicName =
            this.buildSeriesTopicName(
                seriesTitle
            );

        return this.getOrCreateTopic(
            bot,
            chatId,
            topicName
        );
    }

    // =========================================================================
    // MOVIE TOPIC
    // =========================================================================

    public static async getOrCreateMovieTopic(
        bot: Telegraf,
        chatId: string,
        movieTitle: string,
        year?: number
    ): Promise<number> {

        const topicName =
            this.buildMovieTopicName(
                movieTitle,
                year
            );

        return this.getOrCreateTopic(
            bot,
            chatId,
            topicName
        );
    }

    // =========================================================================
    // BUILD SERIES TOPIC NAME
    // =========================================================================

    public static buildSeriesTopicName(
        title: string
    ): string {

        const normalized =
            this.normalizeName(
                title
            );

        if (
            !normalized
        ) {

            return "Unbekannte Serie";
        }

        return normalized;
    }

    // =========================================================================
    // BUILD MOVIE TOPIC NAME
    // =========================================================================

    public static buildMovieTopicName(
        title: string,
        year?: number
    ): string {

        const normalized =
            this.normalizeName(
                title
            );

        if (
            !normalized
        ) {

            return year
                ? `Unbekannter Film (${year})`
                : "Unbekannter Film";
        }

        if (
            year &&
            Number.isInteger(
                year
            )
        ) {

            return `${normalized} (${year})`;
        }

        return normalized;
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

    // =========================================================================
    // REMOVE TOPIC FROM CACHE
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

        this.creationLocks.clear();

        console.log(
            "🧹 Telegram Topic-Cache geleert."
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
    // GET TOPICS FOR CHAT
    // =========================================================================

    public static getTopicsForChat(
        chatId: string
    ): TopicInfo[] {

        const normalizedChatId =
            String(
                chatId || ""
            ).trim();

        return this
            .getAllCachedTopics()
            .filter(
                topic =>
                    topic.chatId ===
                    normalizedChatId
            );
    }

    // =========================================================================
    // COUNT TOPICS
    // =========================================================================

    public static countTopics(): number {

        return this.topicCache.size;
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describeTopic(
        chatId: string,
        topicName: string
    ): string {

        const topic =
            this.getCachedTopic(
                chatId,
                topicName
            );

        if (
            !topic
        ) {

            return [
                "📌 Topic",

                `📨 Chat: ${chatId}`,

                `📝 Name: ${
                    this.normalizeName(
                        topicName
                    )
                }`,

                "❌ Nicht im Cache"
            ].join(
                "\n"
            );
        }

        return [
            "📌 Topic",

            `📨 Chat: ${topic.chatId}`,

            `📝 Name: ${topic.name}`,

            `🆔 Topic-ID: ${topic.topicId}`,

            `🕐 Erstellt: ${
                new Date(
                    topic.createdAt
                ).toISOString()
            }`
        ].join(
            "\n"
        );
    }
}