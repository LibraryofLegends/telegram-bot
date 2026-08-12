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
Library Of Legends/src/framework/telegram/

Version.............: 4.3.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central Telegram integration for Library Of Legends.

Responsibilities:

- Receive Telegram media
- Parse movie filenames
- Query TMDB
- Build final movie posts
- Detect movie collections
- Generate hashtags
- Generate archive IDs
- Send poster
- Send original video
- Send formatted metadata
- Search archived movies
- Run with Telegram Webhook on Render

Movie delivery order:

1. Cover
2. Original movie file
3. Movie metadata / archive layout

Search:

/search <query>

Examples:

/search john wick
/search equalizer
/search spider

Important:

- SQLite search is used for archived movies.
- No raw TMDB response fields are accessed here.
- TMDBService returns normalized TMDBMovie data.
- No polling is used when WEBHOOK_URL is configured.

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
    PostBuilder
} from "../../application/post/post-builder";

import {
    SearchService
} from "../../application/search/search-service";

// =============================================================================
// CONFIGURATION
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

        this.registerCommands();

        this.registerMediaHandlers();
    }

    // =========================================================================
    // COMMANDS
    // =========================================================================

    private registerCommands(): void {

        // =====================================================================
        // START
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
                        "✅ Bot ist online.",
                        "📥 Medienempfang aktiv.",
                        "🎞️ TMDB-Integration aktiv.",
                        "🔎 Archivsuche aktiv.",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "🔎 Suche:",
                        "<code>/search titel</code>"
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
        // PING
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

        // =====================================================================
        // SEARCH
        // =====================================================================

        this.bot.command(
            "search",
            async (
                ctx
            ) => {

                await this.handleSearch(
                    ctx
                );
            }
        );
    }

    // =========================================================================
    // SEARCH HANDLER
    // =========================================================================

    private async handleSearch(
        ctx: any
    ): Promise<void> {

        try {

            const message =
                ctx.message;

            const commandText =
                String(
                    message?.text ||
                    ""
                );

            const query =
                commandText
                    .replace(
                        /^\/search(?:@\w+)?/i,
                        ""
                    )
                    .trim();

            // =================================================================
            // NO QUERY
            // =================================================================

            if (
                !query
            ) {

                await ctx.reply(
                    [
                        "🔎 <b>Archivsuche</b>",
                        "",
                        "Bitte einen Suchbegriff eingeben.",
                        "",
                        "Beispiel:",
                        "<code>/search John Wick</code>"
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

            console.log(
                "================================================="
            );

            console.log(
                "🔎 ARCHIVSUche"
            );

            console.log(
                `🔎 Suchbegriff: ${query}`
            );

            console.log(
                "================================================="
            );

            // =================================================================
            // SEARCH
            // =================================================================

            const results =
                SearchService.search(
                    query
                );

            // =================================================================
            // NO RESULTS
            // =================================================================

            if (
                results.length ===
                0
            ) {

                await ctx.reply(
                    [
                        "━━━━━━━━━━━━━━━━━━",
                        "🔎 <b>Suchergebnisse</b>",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        `❌ Keine Treffer für: <b>${this.escapeHtml(
                            query
                        )}</b>`,
                        "",
                        "🔥 @LibraryOfLegends"
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
            // RESULTS
            // =================================================================

            const lines:
                string[] = [

                "━━━━━━━━━━━━━━━━━━",

                "🔎 <b>Suchergebnisse</b>",

                "━━━━━━━━━━━━━━━━━━",

                ""
            ];

            for (
                const result of results
            ) {

                const title =
                    this.escapeHtml(
                        result.title
                    );

                const year =
                    result.year
                        ? ` (${result.year})`
                        : "";

                const archiveId =
                    result.archiveId
                        ? `\n   🗂️ <code>${this.escapeHtml(
                            result.archiveId
                        )}</code>`
                        : "";

                lines.push(
                    `🎬 <b>${title}</b>${year}${archiveId}`
                );

                lines.push("");
            }

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                `📊 ${results.length} Treffer`
            );

            lines.push(
                "🔥 @LibraryOfLegends"
            );

            await ctx.reply(
                lines.join(
                    "\n"
                ),
                {
                    parse_mode:
                        "HTML",

                    disable_web_page_preview:
                        true
                }
            );

            console.log(
                `✅ ${results.length} Suchtreffer gesendet.`
            );

        } catch (
            error
        ) {

            console.error(
                "❌ SEARCH ERROR:",
                error
            );

            await ctx.reply(
                "❌ Bei der Suche ist ein Fehler aufgetreten."
            );
        }
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
    // HANDLE MEDIA
    // =========================================================================

    private async handleMedia(
        ctx: any
    ): Promise<void> {

        try {

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
            // SERIES CHECK
            // =================================================================

            if (
                parsed.type !==
                "movie"
            ) {

                await ctx.reply(
                    [
                        "📺 <b>Serien-Datei erkannt</b>",
                        "",
                        `📄 <code>${this.escapeHtml(
                            fileName
                        )}</code>`,
                        "",
                        `🎯 Typ: <b>${this.escapeHtml(
                            parsed.type
                        )}</b>`,
                        `🎬 Titel: <b>${this.escapeHtml(
                            parsed.title
                        )}</b>`,
                        parsed.season !==
                                undefined
                            ? `📚 Staffel: <b>${parsed.season}</b>`
                            : "",
                        parsed.episode !==
                                undefined
                            ? `🎞️ Episode: <b>${parsed.episode}</b>`
                            : "",
                        "",
                        "🚧 Das Serien-/Episodensystem wird als eigener Schritt aufgebaut."
                    ]
                        .filter(
                            Boolean
                        )
                        .join(
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

            const movie =
                await TMDBService.searchMovie(
                    parsed.title,
                    parsed.year
                );

            console.log(
                "🎬 TMDB Ergebnis:",
                movie?.title ||
                "Kein Treffer"
            );

            // =================================================================
            // NORMALIZED DATA
            // =================================================================

            const title =
                movie?.title ||
                parsed.title ||
                "Unbekannt";

            const year =
                movie?.year ||
                parsed.year;

            const rating =
                movie?.rating;

            const genres =
                movie?.genres ||
                [];

            const overview =
                movie?.overview;

            // =================================================================
            // FINAL POST
            // =================================================================

            const caption =
                PostBuilder.build({

                    title,

                    year,

                    rating,

                    genres,

                    overview,

                    fileName,

                    fileSize
                });

            // =================================================================
            // COVER
            // =================================================================

            if (
                movie?.posterUrl
            ) {

                await ctx.replyWithPhoto(
                    movie.posterUrl
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
                )
                    .toLowerCase()
                    .startsWith(
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
            // MOVIE LAYOUT
            // =================================================================

            await ctx.reply(
                caption,
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
                "✅ FILM VOLLSTÄNDIG VERARBEITET"
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
                    "❌ Der Film konnte nicht verarbeitet werden."
                );

            } catch {
                // Telegram context may no longer exist.
            }
        }
    }

    // =========================================================================
    // WEBHOOK
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
                _request: Request,
                response: Response
            ) => {

                response
                    .status(
                        200
                    )
                    .send(
                        "Library Of Legends Bot läuft"
                    );
            }
        );

        // =====================================================================
        // TELEGRAM WEBHOOK
        // =====================================================================

        this.app.post(
            "/webhook",
            (
                request: Request,
                response: Response
            ) => {

                this.bot.handleUpdate(
                    request.body
                )
                    .then(
                        () => {

                            if (
                                !response.headersSent
                            ) {

                                response.sendStatus(
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
                                !response.headersSent
                            ) {

                                response.sendStatus(
                                    500
                                );
                            }
                        }
                    );
            }
        );

        // =====================================================================
        // SERVER
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
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        console.log(
            "🤖 Starte Telegram Bot..."
        );

        if (
            this.config.webhookUrl
        ) {

            console.log(
                "🌐 Webhook Mode aktiv"
            );

            this.setupWebhook();

        } else {

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
            )
                .match(
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
            value ||
            ""
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