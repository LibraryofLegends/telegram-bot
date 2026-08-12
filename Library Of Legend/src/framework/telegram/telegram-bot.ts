/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-FW-TG-0001

LOL-ID..............: LOL-TG-BOT-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 4.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram integration for Library Of Legends.

Current responsibilities:

- Receive Telegram media
- Parse media filenames
- Query TMDB
- Build movie metadata
- Send movie cover
- Send original MP4 media
- Send movie archive layout
- Keep webhook mode Render-compatible
- Keep the three-message movie presentation centralized

Movie delivery order:

1. TMDB poster
2. Original Telegram video / MP4
3. Formatted movie archive information

Important:

- No database persistence is used in this phase.
- The original Telegram File-ID is reused.
- The movie itself is sent separately from the metadata layout.
- Long descriptions are already limited by MoviePostBuilder.

===============================================================================
*/

import {
    Telegraf
} from "telegraf";

import express, {
    Request,
    Response
} from "express";

import {
    parseMedia
} from "../../application/parser/media-parser";

import {
    TMDBService
} from "../../application/services/tmdb-service";

import {
    MoviePostBuilder
} from "../../application/builder/movie-post-builder";

// =============================================================================
// TYPES
// =============================================================================

interface TelegramBotConfig {

    token:
        string;

    port:
        number;

    webhookUrl?:
        string;
}

// =============================================================================
// TELEGRAM BOT
// =============================================================================

export class TelegramBot {

    // =========================================================================
    // TELEGRAM
    // =========================================================================

    private readonly bot:
        Telegraf;

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    private readonly config:
        TelegramBotConfig;

    // =========================================================================
    // EXPRESS
    // =========================================================================

    private readonly app =
        express();

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor(
        config: TelegramBotConfig
    ) {

        this.config =
            config;

        this.bot =
            new Telegraf(
                config.token
            );

        console.log(
            "🔧 TelegramBot erstellt."
        );
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        console.log(
            "🤖 Starte Telegram Bot..."
        );

        // =====================================================================
        // MEDIA HANDLER
        // =====================================================================

        this.registerMediaHandler();

        // =====================================================================
        // WEBHOOK
        // =====================================================================

        if (
            this.config.webhookUrl
        ) {

            console.log(
                "🌐 Webhook Mode aktiv"
            );

            this.setupWebhook();

        } else {

            // =================================================================
            // LOCAL FALLBACK
            // =================================================================

            console.log(
                "⚠️ Keine WEBHOOK_URL gesetzt."
            );

            console.log(
                "⚠️ Polling Mode aktiv."
            );

            await this.bot.launch();
        }

        console.log(
            "✅ TelegramBot Initialisierung abgeschlossen."
        );
    }

    // =========================================================================
    // REGISTER MEDIA HANDLER
    // =========================================================================

    private registerMediaHandler(): void {

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
    // HANDLE MEDIA
    // =========================================================================

    private async handleMedia(
        ctx: any
    ): Promise<void> {

        try {

            // =================================================================
            // MESSAGE
            // =================================================================

            const message =
                ctx.message;

            if (
                !message
            ) {

                return;
            }

            // =================================================================
            // MEDIA
            // =================================================================

            const media =
                message.video ||
                message.document;

            if (
                !media
            ) {

                return;
            }

            // =================================================================
            // BASIC INFORMATION
            // =================================================================

            const fileName =
                String(
                    media.file_name ||
                    `media_${media.file_unique_id}`
                );

            const fileId =
                String(
                    media.file_id
                );

            const fileSize =
                Number(
                    media.file_size ||
                    0
                );

            console.log(
                "================================================="
            );

            console.log(
                "📥 MEDIA EMPFANGEN"
            );

            console.log(
                `📄 Datei: ${fileName}`
            );

            console.log(
                `🆔 File-ID: ${fileId}`
            );

            console.log(
                `💾 Größe: ${fileSize}`
            );

            console.log(
                "================================================="
            );

            // =================================================================
            // PARSER
            // =================================================================

            const parsed =
                parseMedia(
                    fileName
                );

            console.log(
                "🧠 Parser Ergebnis:",
                parsed
            );

            // =================================================================
            // MOVIE ONLY
            // =================================================================

            if (
                parsed.type !==
                "movie"
            ) {

                await ctx.reply(
                    [
                        "📺 <b>Serien-Erkennung</b>",
                        "",
                        `📄 ${this.escapeHtml(
                            fileName
                        )}`,
                        "",
                        "Das Serien-/Episodensystem wird als eigener Schritt aufgebaut."
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
            // TMDB
            // =================================================================

            const tmdbData =
                await TMDBService.searchMovie(
                    parsed.title,
                    parsed.year
                );

            console.log(
                "🎬 TMDB Ergebnis:",
                tmdbData
            );

            // =================================================================
            // BUILD MOVIE POST
            // =================================================================

            const post =
                MoviePostBuilder.build({
                    fileName,

                    fileId,

                    fileSize,

                    parser:
                        parsed,

                    tmdb:
                        tmdbData ||
                        undefined
                });

            // =================================================================
            // MESSAGE 1
            // POSTER
            // =================================================================

            if (
                post.posterUrl
            ) {

                await ctx.replyWithPhoto(
                    post.posterUrl
                );

                console.log(
                    "🖼️ Cover gesendet."
                );
            } else {

                console.log(
                    "⚠️ Kein TMDB Cover vorhanden."
                );
            }

            // =================================================================
            // MESSAGE 2
            // MOVIE FILE
            // =================================================================

            const extension =
                this.getFileExtension(
                    fileName
                );

            if (
                extension ===
                "mp4"
            ) {

                await ctx.replyWithVideo(
                    fileId,
                    {
                        supports_streaming:
                            true
                    }
                );

                console.log(
                    "🎬 MP4 als Video gesendet."
                );

            } else if (
                media.mime_type &&
                String(
                    media.mime_type
                ).startsWith(
                    "video/"
                )
            ) {

                await ctx.replyWithVideo(
                    fileId,
                    {
                        supports_streaming:
                            true
                    }
                );

                console.log(
                    "🎬 Video als Telegram-Video gesendet."
                );

            } else {

                await ctx.replyWithDocument(
                    fileId
                );

                console.log(
                    "📄 Medium als Dokument gesendet."
                );
            }

            // =================================================================
            // MESSAGE 3
            // MOVIE LAYOUT
            // =================================================================

            await ctx.reply(
                post.caption,
                {
                    parse_mode:
                        "HTML",
                    disable_web_page_preview:
                        true
                }
            );

            console.log(
                "📝 Film-Layout gesendet."
            );

            console.log(
                "================================================="
            );

            console.log(
                "✅ FILM-VOLLSTÄNDIG VERARBEITET"
            );

            console.log(
                "================================================="
            );

        } catch (
            error
        ) {

            console.error(
                "================================================="
            );

            console.error(
                "❌ FEHLER BEI MEDIENVERARBEITUNG"
            );

            console.error(
                error
            );

            console.error(
                "================================================="
            );

            try {

                await ctx.reply(
                    "❌ Der Film konnte nicht vollständig verarbeitet werden."
                );

            } catch {
                // Telegram context may no longer exist.
            }
        }
    }

    // =========================================================================
    // WEBHOOK SETUP
    // =========================================================================

    private setupWebhook(): void {

        this.app.use(
            express.json()
        );

        // =====================================================================
        // HEALTH
        // =====================================================================

        this.app.get(
            "/",
            (
                _req: Request,
                res: Response
            ) => {

                res.status(
                    200
                ).send(
                    "Library Of Legends Bot läuft"
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

                            if (
                                !res.headersSent
                            ) {

                                res.sendStatus(
                                    200
                                );
                            }
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

                            if (
                                !res.headersSent
                            ) {

                                res.sendStatus(
                                    500
                                );
                            }
                        }
                    );
            }
        );

        // =====================================================================
        // HTTP SERVER
        // =====================================================================

        this.app.listen(
            this.config.port,
            "0.0.0.0",
            () => {

                console.log(
                    `🌐 Express Server läuft auf Port ${this.config.port}`
                );
            }
        );

        // =====================================================================
        // WEBHOOK URL
        // =====================================================================

        const baseUrl =
            String(
                this.config.webhookUrl ||
                ""
            )
                .trim()
                .replace(
                    /\/+$/,
                    ""
                );

        if (
            !baseUrl
        ) {

            throw new Error(
                "❌ WEBHOOK_URL fehlt."
            );
        }

        const webhookUrl =
            `${baseUrl}/webhook`;

        void this.bot.telegram.setWebhook(
            webhookUrl
        )
            .then(
                () => {

                    console.log(
                        `🔗 Webhook gesetzt: ${webhookUrl}`
                    );
                }
            )
            .catch(
                (
                    error
                ) => {

                    console.error(
                        "❌ Webhook konnte nicht gesetzt werden:",
                        error
                    );
                }
            );
    }

    // =========================================================================
    // FILE EXTENSION
    // =========================================================================

    private getFileExtension(
        fileName: string
    ): string {

        const match =
            String(
                fileName ||
                ""
            ).match(
                /\.([^.]+)$/
            );

        if (
            !match
        ) {

            return "";
        }

        return match[1]
            .toLowerCase();
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

    // =========================================================================
    // STOP
    // =========================================================================

    public async stop(
        signal: string
    ): Promise<void> {

        console.log(
            `🛑 Stoppe TelegramBot (${signal})`
        );

        try {

            this.bot.stop(
                signal
            );

        } catch (
            error
        ) {

            console.error(
                "❌ TelegramBot Stop-Fehler:",
                error
            );
        }
    }
}