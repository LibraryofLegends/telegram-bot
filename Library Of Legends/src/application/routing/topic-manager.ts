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

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram Forum Topic management for Library Of Legends.

Responsibilities:

- Create series topics
- Find existing series topics
- Normalize topic names
- Prevent duplicate topics
- Store topic references in memory
- Support multiple Telegram chats
- Provide topic lookup
- Prepare topic routing for TelegramBot
- Keep Telegram-specific topic logic isolated

Important:

Telegram forum topics can only be created in a Telegram supergroup
with Topics enabled.

The TelegramBot layer is responsible for actually calling Telegram.

This class manages the topic information and provides helper methods
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
        new Map();

    // =========================================================================
    // TOPIC KEY
    // =========================================================================

    private static buildKey(
        chatId: string,
        seriesTitle: string
    ): string {

        return `${chatId}:${this.normalizeName(seriesTitle)}`;
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
                /\.(mp4|mkv|avi|mov|webm)$/i,
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

        const normalized =
            String(
                name || ""
            )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (
            !normalized
        ) {

            return "Unbekannte Serie";
        }

        /*
         * Telegram topic names have practical display limits.
         * Keep the title readable instead of cutting in the middle
         * of an important prefix.
         */

        const MAX_LENGTH =
            128;

        if (
            normalized.length <=
            MAX_LENGTH
        ) {

            return normalized;
        }

        return normalized.slice(
            0,
            MAX_LENGTH - 1
        ).trim() + "…";
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

        const normalizedName =
            this.normalizeName(
                seriesTitle
            );

        const cleanName =
            this.cleanTopicName(
                topicName ||
                seriesTitle
            );

        const key =
            this.buildKey(
                chatId,
                seriesTitle
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
                String(
                    chatId
                ),

            messageThreadId,

            name:
                cleanName,

            normalizedName,

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
            `${chatId}:`;

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
    // GET TOPIC THREAD ID
    // =========================================================================

    public static getThreadId(
        chatId: string,
        seriesTitle: string
    ): number | undefined {

        return this.getTopic(
            chatId,
            seriesTitle
        )?.messageThreadId;
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
         * A Telegram message_thread_id cannot be invented.
         *
         * The actual Telegram topic must be created by TelegramBot.
         *
         * Therefore this method only returns undefined when the topic
         * has not yet been registered.
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

        return {

            chatId:
                String(
                    chatId
                ),

            seriesTitle:
                this.normalizeSeriesTitle(
                    seriesTitle
                ),

            topicName:
                this.cleanTopicName(
                    seriesTitle
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

        /*
         * Remove file extension.
         */

        value =
            value.replace(
                /\.(mp4|mkv|avi|mov|webm|m4v|ts|m2ts)$/i,
                ""
            );

        /*
         * Remove S01E01 notation.
         */

        value =
            value.replace(
                /\bS\d{1,3}E\d{1,4}\b/gi,
                ""
            );

        /*
         * Remove Season / Staffel.
         */

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

        /*
         * Remove episode information.
         */

        value =
            value.replace(
                /\b(?:Episode|Folge)\s*\d{1,4}\b/gi,
                ""
            );

        /*
         * Remove common separators.
         */

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
                /\s+/g,
                " "
            );

        return value.trim();
    }

    // =========================================================================
    // FIND BY THREAD ID
    // =========================================================================

    public static findByThreadId(
        chatId: string,
        messageThreadId: number
    ): SeriesTopic | undefined {

        for (
            const topic of
            this.topics.values()
        ) {

            if (
                topic.chatId ===
                String(
                    chatId
                ) &&
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
    // GET ALL FOR CHAT
    // =========================================================================

    public static getAllForChat(
        chatId: string
    ): SeriesTopic[] {

        const result:
            SeriesTopic[] = [];

        for (
            const topic of
            this.topics.values()
        ) {

            if (
                topic.chatId ===
                String(
                    chatId
                )
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

    public static getAll(): SeriesTopic[] {

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

        for (
            const topic of
            this.topics.values()
        ) {

            if (
                topic.chatId ===
                String(
                    chatId
                ) &&
                topic.normalizedName ===
                normalized
            ) {

                return true;
            }
        }

        return false;
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
}