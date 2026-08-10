/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TopicManager

Architecture Layer..: Application

Module..............: Routing

Module ID...........: LOL-MOD-ROUT-0002

LOL-ID..............: LOL-ROUT-TOPIC-0001

File................: topic-manager.ts

Location............
Library Of Legends/src/application/routing/

Version.............: 4.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram Forum Topic management for Library Of Legends.

Responsibilities:

- Create and register series topics
- Find existing series topics
- Normalize topic names
- Prevent duplicate topics
- Store topic references in memory
- Support multiple Telegram chats
- Provide topic lookup
- Prepare topic routing for TelegramBot
- Provide thread ID lookup
- Support safe topic names
- Keep Telegram-specific topic logic isolated
- Provide debug information
- Provide topic statistics

Important:

Telegram forum topics can only be created in a Telegram supergroup
with Topics enabled.

The TelegramBot layer is responsible for actually calling Telegram.

This class manages topic information and provides helper methods
for the Telegram integration.

===============================================================================
*/

/**
 * Stored Telegram topic information.
 */
export interface SeriesTopic {

    /**
     * Telegram chat ID.
     */
    chatId: string;

    /**
     * Telegram message thread ID.
     */
    messageThreadId: number;

    /**
     * Topic name shown in Telegram.
     */
    name: string;

    /**
     * Normalized series title.
     */
    normalizedName: string;

    /**
     * Creation timestamp.
     */
    createdAt: number;

    /**
     * Last access timestamp.
     */
    updatedAt: number;
}

/**
 * Topic creation request.
 */
export interface TopicRequest {

    chatId: string;

    seriesTitle: string;

    topicName?: string;
}

/**
 * Topic Manager.
 */
export class TopicManager {

    // =========================================================================
    // TOPIC STORAGE
    // =========================================================================

    private static topics:
        Map<string, SeriesTopic> =
        new Map<string, SeriesTopic>();

    // =========================================================================
    // TOPIC KEY
    // =========================================================================

    private static buildKey(
        chatId: string,
        seriesTitle: string
    ): string {

        return [
            String(chatId),
            this.normalizeName(
                seriesTitle
            )
        ].join(
            ":"
        );
    }

    // =========================================================================
    // NORMALIZE NAME
    // =========================================================================

    public static normalizeName(
        name: string
    ): string {

        return String(
            name || ""
        )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .replace(
                /\.(mp4|mkv|avi|mov|webm|m4v|ts|m2ts)$/i,
                ""
            )
            .replace(
                /\bS\d{1,3}E\d{1,4}\b/gi,
                ""
            )
            .replace(
                /\bStaffel\s*\d{1,3}\b/gi,
                ""
            )
            .replace(
                /\bSeason\s*\d{1,3}\b/gi,
                ""
            )
            .replace(
                /\b(?:Folge|Episode)\s*\d{1,4}\b/gi,
                ""
            )
            .replace(
                /[_./\\|()[\]{}:;,!?]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    // =========================================================================
    // CLEAN TOPIC NAME
    // =========================================================================

    public static cleanTopicName(
        name: string
    ): string {

        let normalized =
            String(
                name || ""
            )
                .replace(
                    /\.(mp4|mkv|avi|mov|webm|m4v|ts|m2ts)$/i,
                    ""
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (
            !normalized
        ) {

            normalized =
                "Unbekannte Serie";
        }

        /*
         * Telegram topic names should remain readable.
         */

        const MAX_LENGTH =
            128;

        if (
            normalized.length <=
            MAX_LENGTH
        ) {

            return normalized;
        }

        return (
            normalized
                .slice(
                    0,
                    MAX_LENGTH - 1
                )
                .trim() +
            "…"
        );
    }

    // =========================================================================
    // GET EXISTING TOPIC
    // =========================================================================

    public static getTopic(
        chatId: string,
        seriesTitle: string
    ): SeriesTopic | undefined {

        const key =
            this.buildKey(
                chatId,
                seriesTitle
            );

        const topic =
            this.topics.get(
                key
            );

        if (
            topic
        ) {

            topic.updatedAt =
                Date.now();
        }

        return topic;
    }

    // =========================================================================
    // FIND TOPIC
    // =========================================================================

    public static findTopic(
        chatId: string,
        seriesTitle: string
    ): SeriesTopic | undefined {

        return this.getTopic(
            chatId,
            seriesTitle
        );
    }

    // =========================================================================
    // HAS TOPIC
    // =========================================================================

    public static hasTopic(
        chatId: string,
        seriesTitle: string
    ): boolean {

        return Boolean(
            this.getTopic(
                chatId,
                seriesTitle
            )
        );
    }

    // =========================================================================
    // REGISTER TOPIC
    // =========================================================================

    public static registerTopic(
        chatId: string,
        seriesTitle: string,
        messageThreadId: number,
        topicName?: string
    ): SeriesTopic {

        const safeChatId =
            String(
                chatId
            );

        const normalizedName =
            this.normalizeSeriesTitle(
                seriesTitle
            );

        const cleanName =
            this.cleanTopicName(
                topicName ||
                normalizedName
            );

        const key =
            this.buildKey(
                safeChatId,
                normalizedName
            );

        const existing =
            this.topics.get(
                key
            );

        if (
            existing
        ) {

            existing.messageThreadId =
                messageThreadId;

            existing.name =
                cleanName;

            existing.updatedAt =
                Date.now();

            return existing;
        }

        const now =
            Date.now();

        const topic:
            SeriesTopic = {

            chatId:
                safeChatId,

            messageThreadId,

            name:
                cleanName,

            normalizedName:
                this.normalizeName(
                    normalizedName
                ),

            createdAt:
                now,

            updatedAt:
                now
        };

        this.topics.set(
            key,
            topic
        );

        return topic;
    }

    // =========================================================================
    // REMOVE TOPIC
    // =========================================================================

    public static removeTopic(
        chatId: string,
        seriesTitle: string
    ): boolean {

        const key =
            this.buildKey(
                chatId,
                seriesTitle
            );

        return this.topics.delete(
            key
        );
    }

    // =========================================================================
    // CLEAR CHAT
    // =========================================================================

    public static clearChat(
        chatId: string
    ): number {

        const prefix =
            `${String(chatId)}:`;

        let removed =
            0;

        for (
            const key of
            this.topics.keys()
        ) {

            if (
                key.startsWith(
                    prefix
                )
            ) {

                this.topics.delete(
                    key
                );

                removed++;
            }
        }

        return removed;
    }

    // =========================================================================
    // CLEAR ALL
    // =========================================================================

    public static clearAll(): number {

        const count =
            this.topics.size;

        this.topics.clear();

        return count;
    }

    // =========================================================================
    // GET TOPIC THREAD ID
    // =========================================================================

    public static getThreadId(
        chatId: string,
        seriesTitle: string
    ): number | undefined {

        return this
            .getTopic(
                chatId,
                seriesTitle
            )
            ?.messageThreadId;
    }

    // =========================================================================
    // GET OR CREATE DATA
    // =========================================================================

    public static getOrCreateData(
        request: TopicRequest
    ): SeriesTopic | undefined {

        const existing =
            this.getTopic(
                request.chatId,
                request.seriesTitle
            );

        if (
            existing
        ) {

            return existing;
        }

        /*
         * Telegram generates the actual message_thread_id.
         *
         * We deliberately do NOT invent a thread ID here.
         *
         * TelegramBot must call Telegram's createForumTopic API
         * and then register the returned message_thread_id.
         */

        return undefined;
    }

    // =========================================================================
    // BUILD TOPIC REQUEST
    // =========================================================================

    public static buildRequest(
        chatId: string,
        seriesTitle: string
    ): TopicRequest {

        const normalizedTitle =
            this.normalizeSeriesTitle(
                seriesTitle
            );

        return {

            chatId:
                String(
                    chatId
                ),

            seriesTitle:
                normalizedTitle,

            topicName:
                this.cleanTopicName(
                    normalizedTitle
                )
        };
    }

    // =========================================================================
    // NORMALIZE SERIES TITLE
    // =========================================================================

    public static normalizeSeriesTitle(
        title: string
    ): string {

        let value =
            String(
                title || ""
            )
                .trim();

        // =====================================================================
        // REMOVE FILE EXTENSION
        // =====================================================================

        value =
            value.replace(
                /\.(mp4|mkv|avi|mov|webm|m4v|ts|m2ts)$/i,
                ""
            );

        // =====================================================================
        // REMOVE S01E01
        // =====================================================================

        value =
            value.replace(
                /\bS\d{1,3}E\d{1,4}\b/gi,
                ""
            );

        // =====================================================================
        // REMOVE S01 / SEASON 1 / STAFFEL 1
        // =====================================================================

        value =
            value.replace(
                /\bS\d{1,3}\b/gi,
                ""
            );

        value =
            value.replace(
                /\bSeason\s*\d{1,3}\b/gi,
                ""
            );

        value =
            value.replace(
                /\bStaffel\s*\d{1,3}\b/gi,
                ""
            );

        // =====================================================================
        // REMOVE EPISODE INFORMATION
        // =====================================================================

        value =
            value.replace(
                /\b(?:Episode|Folge)\s*\d{1,4}\b/gi,
                ""
            );

        value =
            value.replace(
                /\bE\d{1,4}\b/gi,
                ""
            );

        // =====================================================================
        // REMOVE COMMON FILE SEPARATORS
        // =====================================================================

        value =
            value.replace(
                /[_]+/g,
                " "
            );

        value =
            value.replace(
                /\.+/g,
                " "
            );

        value =
            value.replace(
                /\s*\|\s*/g,
                " "
            );

        value =
            value.replace(
                /\s*-\s*$/g,
                ""
            );

        // =====================================================================
        // CLEAN MULTIPLE SPACES
        // =====================================================================

        value =
            value.replace(
                /\s+/g,
                " "
            )
                .trim();

        if (
            !value
        ) {

            return "Unbekannte Serie";
        }

        return value;
    }

    // =========================================================================
    // FIND BY THREAD ID
    // =========================================================================

    public static findByThreadId(
        chatId: string,
        messageThreadId: number
    ): SeriesTopic | undefined {

        const safeChatId =
            String(
                chatId
            );

        for (
            const topic of
            this.topics.values()
        ) {

            if (
                topic.chatId ===
                    safeChatId &&
                topic.messageThreadId ===
                    messageThreadId
            ) {

                topic.updatedAt =
                    Date.now();

                return topic;
            }
        }

        return undefined;
    }

    // =========================================================================
    // FIND BY NORMALIZED NAME
    // =========================================================================

    public static findByNormalizedName(
        chatId: string,
        normalizedName: string
    ): SeriesTopic | undefined {

        const safeChatId =
            String(
                chatId
            );

        const normalized =
            this.normalizeName(
                normalizedName
            );

        for (
            const topic of
            this.topics.values()
        ) {

            if (
                topic.chatId ===
                    safeChatId &&
                topic.normalizedName ===
                    normalized
            ) {

                topic.updatedAt =
                    Date.now();

                return topic;
            }
        }

        return undefined;
    }

    // =========================================================================
    // GET ALL FOR CHAT
    // =========================================================================

    public static getAllForChat(
        chatId: string
    ): SeriesTopic[] {

        const safeChatId =
            String(
                chatId
            );

        const result:
            SeriesTopic[] = [];

        for (
            const topic of
            this.topics.values()
        ) {

            if (
                topic.chatId ===
                safeChatId
            ) {

                result.push(
                    topic
                );
            }
        }

        return result.sort(
            (
                a,
                b
            ) =>
                a.name.localeCompare(
                    b.name,
                    "de"
                )
        );
    }

    // =========================================================================
    // GET ALL
    // =========================================================================

    public static getAll():
        SeriesTopic[] {

        return Array.from(
            this.topics.values()
        );
    }

    // =========================================================================
    // COUNT
    // =========================================================================

    public static count(): number {

        return this.topics.size;
    }

    // =========================================================================
    // COUNT CHAT
    // =========================================================================

    public static countForChat(
        chatId: string
    ): number {

        return this
            .getAllForChat(
                chatId
            )
            .length;
    }

    // =========================================================================
    // TOPIC NAME EXISTS
    // =========================================================================

    public static topicNameExists(
        chatId: string,
        topicName: string
    ): boolean {

        const normalized =
            this.normalizeName(
                topicName
            );

        const safeChatId =
            String(
                chatId
            );

        for (
            const topic of
            this.topics.values()
        ) {

            if (
                topic.chatId ===
                    safeChatId &&
                topic.normalizedName ===
                    normalized
            ) {

                return true;
            }
        }

        return false;
    }

    // =========================================================================
    // GET TOPIC NAME
    // =========================================================================

    public static getTopicName(
        chatId: string,
        seriesTitle: string
    ): string {

        const topic =
            this.getTopic(
                chatId,
                seriesTitle
            );

        if (
            topic
        ) {

            return topic.name;
        }

        return this.cleanTopicName(
            this.normalizeSeriesTitle(
                seriesTitle
            )
        );
    }

    // =========================================================================
    // TOUCH TOPIC
    // =========================================================================

    public static touchTopic(
        chatId: string,
        seriesTitle: string
    ): boolean {

        const topic =
            this.getTopic(
                chatId,
                seriesTitle
            );

        if (
            !topic
        ) {

            return false;
        }

        topic.updatedAt =
            Date.now();

        return true;
    }

    // =========================================================================
    // EXPORT TOPICS
    // =========================================================================

    public static exportTopics():
        SeriesTopic[] {

        return this
            .getAll()
            .map(
                topic => ({
                    ...topic
                })
            );
    }

    // =========================================================================
    // IMPORT TOPICS
    // =========================================================================

    public static importTopics(
        topics: SeriesTopic[]
    ): number {

        if (
            !Array.isArray(
                topics
            )
        ) {

            return 0;
        }

        let imported =
            0;

        for (
            const topic of
            topics
        ) {

            if (
                !topic ||
                !topic.chatId ||
                !topic.normalizedName ||
                typeof topic.messageThreadId !==
                    "number"
            ) {

                continue;
            }

            const key =
                this.buildKey(
                    topic.chatId,
                    topic.normalizedName
                );

            this.topics.set(
                key,
                {
                    ...topic,

                    chatId:
                        String(
                            topic.chatId
                        ),

                    name:
                        this.cleanTopicName(
                            topic.name
                        ),

                    normalizedName:
                        this.normalizeName(
                            topic.normalizedName
                        )
                }
            );

            imported++;
        }

        return imported;
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        chatId: string,
        seriesTitle: string
    ): string {

        const topic =
            this.getTopic(
                chatId,
                seriesTitle
            );

        if (
            !topic
        ) {

            return [

                "=================================================",

                "📌 TOPIC MANAGER",

                "=================================================",

                `📺 Serie: ${
                    this.normalizeSeriesTitle(
                        seriesTitle
                    )
                }`,

                `💬 Chat-ID: ${
                    String(
                        chatId
                    )
                }`,

                "❌ Topic noch nicht erstellt.",

                "================================================="

            ].join(
                "\n"
            );
        }

        return [

            "=================================================",

            "📌 TOPIC MANAGER",

            "=================================================",

            `📺 Serie: ${
                topic.name
            }`,

            `💬 Chat-ID: ${
                topic.chatId
            }`,

            `🧵 Thread-ID: ${
                topic.messageThreadId
            }`,

            `🆔 Normalized: ${
                topic.normalizedName
            }`,

            `📅 Erstellt: ${
                new Date(
                    topic.createdAt
                ).toISOString()
            }`,

            `🔄 Aktualisiert: ${
                new Date(
                    topic.updatedAt
                ).toISOString()
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // STATISTICS
    // =========================================================================

    public static getStatistics(): {
        total: number;
        chats: number;
        topicsByChat: Record<string, number>;
    } {

        const topicsByChat:
            Record<string, number> =
            {};

        for (
            const topic of
            this.topics.values()
        ) {

            if (
                !topicsByChat[
                    topic.chatId
                ]
            ) {

                topicsByChat[
                    topic.chatId
                ] = 0;
            }

            topicsByChat[
                topic.chatId
            ]++;
        }

        return {

            total:
                this.topics.size,

            chats:
                Object.keys(
                    topicsByChat
                ).length,

            topicsByChat
        };
    }
}