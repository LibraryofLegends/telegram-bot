/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TG-CORE-0001

LOL-ID..............: LOL-TG-BOT-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 3.2.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram Bot foundation with Render-compatible Webhook support
and the first controlled media-reception layer.

Current Phase:

- Telegram Webhook
- Render HTTP server
- /start
- /help
- /ping
- Video reception
- Document reception
- Supported media validation
- Telegram File-ID extraction
- Filename extraction
- File-size extraction
- Media type detection

Intentionally NOT included yet:

- Database
- TMDB
- Filename parser
- Movie detection
- Series detection
- Episode detection
- Archive-ID generation
- Genre routing
- Forum topics
- Automatic posting
- Netflix UI
- Favorites
- Trending

These components will be introduced only after the
corresponding foundation has been tested successfully.

===============================================================================
*/

import {
    Context,
    Telegraf
} from "telegraf";

import express, {
    Request,
    Response
} from "express";

// =============================================================================
// TELEGRAM CONFIGURATION
// =============================================================================

export interface TelegramConfig {

    /**
     * Telegram Bot Token.
     */
    token: string;

    /**
     * HTTP port used by Render.
     */
    port: number;

    /**
     * Public Render URL used for Telegram Webhook.
     */
    webhookUrl?: string;
}

// =============================================================================
// TELEGRAM MEDIA
// =============================================================================

interface TelegramMedia {

    /**
     * Telegram file ID.
     */
    fileId: string;

    /**
     * Original Telegram filename.
     */
    fileName: string;

    /**
     * Telegram-reported file size.
     */
    fileSize?: number;

    /**
     * Received media type.
     */
    type:
        | "video"
        | "document";
}

// =============================================================================
// TELEGRAM BOT
// =============================================================================

export class TelegramBot {

    // =========================================================================
    // TELEGRAM INSTANCE
    // =========================================================================

    private readonly bot:
        Telegraf<Context>;

    // =========================================================================
    // EXPRESS APPLICATION
    // =========================================================================

    private readonly app =
        express();

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    private readonly config:
        TelegramConfig;

    // =========================================================================
    // RUNNING STATE
    // =========================================================================

    private isRunning =
        false;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor(
        config: TelegramConfig
    ) {

        this.config =
            config;

        this.bot =
            new Telegraf<Context>(
                this.config.token
            );

        this.app.use(
            express.json()
        );

        this.setupRoutes();

        this.registerCommands();

        this.registerMediaHandlers();

        console.log(
            "🔧 TelegramBot erstellt."
        );
    }

    // =========================================================================
    // ROUTES
    // =========================================================================

    private setupRoutes(): void {

        // =====================================================================
        // HEALTH CHECK
        // =====================================================================

        this.app.get(
            "/",
            (
                _req: Request,
                res: Response
            ) => {

                res.send(
                    this.getHttpStatus()
                );
            }
        );

        // =====================================================================
        // WEBHOOK
        // =====================================================================

        this.app.post(
            "/webhook",
            (
                req: Request,
                res: Response
            ) => {

                this.bot.handleUpdate(
                    req.body
                )
                    .then(
                        () => {

                            res.sendStatus(
                                200
                            );
                        }
                    )
                    .catch(
                        (
                            error
                        ) => {

                            console.error(
                                "❌ Webhook Fehler:",
                                error
                            );

                            res.sendStatus(
                                500
                            );
                        }
                    );
            }
        );
    }

    // =========================================================================
    // COMMANDS
    // =========================================================================

    private registerCommands(): void {

        // =====================================================================
        // /START
        // =====================================================================

        this.bot.start(
            async (
                ctx
            ) => {

                await ctx.reply(
                    [
                        "🎬 <b>Library Of Legends</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "✅ Telegram-Verbindung aktiv",
                        "",
                        "📥 Medienempfang aktiv",
                        "",
                        "🚧 Das Archivsystem wird Schritt für Schritt aufgebaut."
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML"
                    }
                );
            }
        );

        // =====================================================================
        // /HELP
        // =====================================================================

        this.bot.help(
            async (
                ctx
            ) => {

                await ctx.reply(
                    [
                        "📖 <b>Library Of Legends</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "/start",
                        "/help",
                        "/ping",
                        "",
                        "📥 Du kannst aktuell Video- und Mediendateien senden.",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "🚧 Weitere Archivfunktionen folgen."
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML"
                    }
                );
            }
        );

        // =====================================================================
        // /PING
        // =====================================================================

        this.bot.command(
            "ping",
            async (
                ctx
            ) => {

                await ctx.reply(
                    "🏓 Pong"
                );
            }
        );
    }

    // =========================================================================
    // MEDIA HANDLERS
    // =========================================================================

    private registerMediaHandlers(): void {

        // =====================================================================
        // VIDEO
        // =====================================================================

        this.bot.on(
            "video",
            async (
                ctx
            ) => {

                await this.handleMedia(
                    ctx
                );
            }
        );

        // =====================================================================
        // DOCUMENT
        // =====================================================================

        this.bot.on(
            "document",
            async (
                ctx
            ) => {

                await this.handleMedia(
                    ctx
                );
            }
        );
    }

    // =========================================================================
    // MEDIA HANDLER
    // =========================================================================

    private async handleMedia(
        ctx: Context
    ): Promise<void> {

        console.log(
            "================================================="
        );

        console.log(
            "📥 TELEGRAM MEDIA EMPFANGEN"
        );

        try {

            const media =
                this.extractMedia(
                    ctx
                );

            if (
                !media
            ) {

                console.log(
                    "⚠️ Keine unterstützte Mediendatei erkannt."
                );

                await ctx.reply(
                    [
                        "⚠️ <b>Datei nicht unterstützt.</b>",
                        "",
                        "Unterstützte Formate:",
                        "MP4",
                        "MKV",
                        "AVI",
                        "MOV",
                        "M4V",
                        "WEBM",
                        "TS",
                        "M2TS"
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML"
                    }
                );

                return;
            }

            // =================================================================
            // LOG
            // =================================================================

            console.log(
                `🎞️ Typ: ${media.type}`
            );

            console.log(
                `📄 Datei: ${media.fileName}`
            );

            console.log(
                `🆔 File-ID: ${media.fileId}`
            );

            console.log(
                `💾 Größe: ${
                    media.fileSize !== undefined
                        ? `${media.fileSize} Bytes`
                        : "unbekannt"
                }`
            );

            // =================================================================
            // CONFIRMATION
            // =================================================================

            await ctx.reply(
                [
                    "✅ <b>Media empfangen</b>",
                    "",
                    `🎞️ Typ: <code>${this.escapeHtml(
                        media.type
                    )}</code>`,
                    `📄 Datei: <code>${this.escapeHtml(
                        media.fileName
                    )}</code>`,
                    `🆔 File-ID: <code>${this.escapeHtml(
                        media.fileId
                    )}</code>`,
                    `💾 Größe: <code>${this.formatFileSize(
                        media.fileSize
                    )}</code>`,
                    "",
                    "🧪 Medienempfang funktioniert."
                ].join(
                    "\n"
                ),
                {
                    parse_mode:
                        "HTML"
                }
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Medienverarbeitung fehlgeschlagen:",
                error
            );

            try {

                await ctx.reply(
                    "❌ Die Mediendatei konnte nicht verarbeitet werden."
                );

            } catch {
                // Telegram context may no longer exist.
            }

        } finally {

            console.log(
                "================================================="
            );
        }
    }

    // =========================================================================
    // EXTRACT MEDIA
    // =========================================================================

    private extractMedia(
        ctx: Context
    ): TelegramMedia | undefined {

        const message:
            any =
            (ctx as any).message;

        if (
            !message
        ) {

            return undefined;
        }

        // =====================================================================
        // VIDEO
        // =====================================================================

        if (
            message.video
        ) {

            const video =
                message.video;

            const fileName =
                String(
                    video.file_name ||
                    `video_${video.file_unique_id}.mp4`
                );

            if (
                !this.isSupportedMediaFile(
                    fileName
                )
            ) {

                return undefined;
            }

            return {

                fileId:
                    String(
                        video.file_id
                    ),

                fileName,

                fileSize:
                    this.normalizeFileSize(
                        video.file_size
                    ),

                type:
                    "video"
            };
        }

        // =====================================================================
        // DOCUMENT
        // =====================================================================

        if (
            message.document
        ) {

            const document =
                message.document;

            const fileName =
                String(
                    document.file_name ||
                    `document_${document.file_unique_id}`
                );

            if (
                !this.isSupportedMediaFile(
                    fileName
                )
            ) {

                return undefined;
            }

            return {

                fileId:
                    String(
                        document.file_id
                    ),

                fileName,

                fileSize:
                    this.normalizeFileSize(
                        document.file_size
                    ),

                type:
                    "document"
            };
        }

        return undefined;
    }

    // =========================================================================
    // SUPPORTED MEDIA
    // =========================================================================

    private isSupportedMediaFile(
        fileName: string
    ): boolean {

        return /\.(mp4|mkv|avi|mov|m4v|webm|ts|m2ts)$/i.test(
            String(
                fileName
            )
        );
    }

    // =========================================================================
    // FILE SIZE NORMALIZATION
    // =========================================================================

    private normalizeFileSize(
        value: unknown
    ): number | undefined {

        if (
            value ===
            undefined ||
            value ===
            null
        ) {

            return undefined;
        }

        const number =
            Number(
                value
            );

        if (
            !Number.isFinite(
                number
            )
        ) {

            return undefined;
        }

        return number;
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        if (
            this.isRunning
        ) {

            console.log(
                "⚠️ TelegramBot läuft bereits."
            );

            return;
        }

        console.log(
            "🤖 Starte Telegram Bot..."
        );

        // =====================================================================
        // WEBHOOK MODE
        // =====================================================================

        if (
            this.config.webhookUrl
        ) {

            console.log(
                "🌐 Webhook Mode aktiv"
            );

            const baseUrl =
                String(
                    this.config.webhookUrl
                )
                    .trim()
                    .replace(
                        /\/+$/,
                        ""
                    );

            const webhookUrl =
                `${baseUrl}/webhook`;

            await this.bot.telegram.setWebhook(
                webhookUrl
            );

            this.app.listen(
                this.config.port,
                "0.0.0.0",
                () => {

                    console.log(
                        `🌐 Express Server läuft auf Port ${this.config.port}`
                    );

                    console.log(
                        `🔗 Webhook gesetzt: ${webhookUrl}`
                    );
                }
            );

        } else {

            // =================================================================
            // LOCAL FALLBACK
            // =================================================================

            console.log(
                "⚠️ Kein WEBHOOK_URL gesetzt."
            );

            console.log(
                "⚠️ Polling Mode wird für lokale Entwicklung verwendet."
            );

            await this.bot.launch();
        }

        this.isRunning =
            true;

        console.log(
            "✅ TelegramBot Initialisierung abgeschlossen."
        );
    }

    // =========================================================================
    // STOP
    // =========================================================================

    public async stop(
        reason?: string
    ): Promise<void> {

        console.log(
            `🛑 Stoppe TelegramBot (${
                reason ||
                "shutdown"
            })`
        );

        try {

            this.bot.stop(
                reason
            );

        } catch (
            error
        ) {

            console.error(
                "❌ TelegramBot Stop-Fehler:",
                error
            );

        } finally {

            this.isRunning =
                false;
        }
    }

    // =========================================================================
    // HTTP STATUS
    // =========================================================================

    public getHttpStatus(): string {

        return [
            "=================================================",
            "📺 LIBRARY OF LEGENDS BOT",
            `Status: ${
                this.isRunning
                    ? "ONLINE"
                    : "OFFLINE"
            }`,
            `Mode: ${
                this.config.webhookUrl
                    ? "WEBHOOK"
                    : "POLLING"
            }`,
            "================================================="
        ].join(
            "\n"
        );
    }

    // =========================================================================
    // RUNNING STATUS
    // =========================================================================

    public isStarted(): boolean {

        return this.isRunning;
    }

    // =========================================================================
    // FILE SIZE FORMAT
    // =========================================================================

    private formatFileSize(
        bytes?: number
    ): string {

        if (
            bytes ===
                undefined ||
            !Number.isFinite(
                bytes
            ) ||
            bytes <= 0
        ) {

            return "unbekannt";
        }

        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        let value =
            bytes;

        let index =
            0;

        while (
            value >= 1024 &&
            index <
                units.length - 1
        ) {

            value /=
                1024;

            index++;
        }

        return `${value.toFixed(
            index === 0
                ? 0
                : 2
        )} ${units[index]}`;
    }

    // =========================================================================
    // HTML ESCAPE
    // =========================================================================

    private escapeHtml(
        value: string
    ): string {

        return String(
            value
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#39;"
            );
    }
}