/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-FW-TG-0001

LOL-ID..............: LOL-TG-BOT-0006

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 5.4.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central Telegram integration for Library Of Legends.

Responsibilities:

- Receive Telegram media
- Parse filenames
- Query TMDB
- Detect movie collections
- Generate Archive IDs
- Store movies in SQLite
- Allow re-posting of archived media
- Build final movie layout
- Send cover
- Send original movie file
- Send metadata layout
- Search archived movies
- Provide inline movie buttons
- Provide /get Archive-ID retrieval
- Provide Netflix-style main menu
- Provide genre menu navigation
- Run with Telegram Webhook on Render

Main menu:

🎬 Filme
📺 Serien
🔥 Trending
🏆 Top 100
🎭 Genres
🔎 Suche

Movie delivery order:

1. Parse media
2. Query TMDB
3. Detect collection
4. Generate Archive ID for new entries
5. Store new movie
6. Build metadata
7. Send cover
8. Send original movie
9. Send metadata layout

GET system:

/get LIB-ACT-0001

or:

Inline button
      ↓
Archive ID
      ↓
SQLite lookup
      ↓
TMDB metadata refresh
      ↓
Cover
      ↓
Original Telegram video
      ↓
Final movie layout

Important:

- TMDBService returns normalized TMDBMovie data.
- Collection detection is handled by AutoCollectionService.
- Database is the source of truth for archived files.
- File IDs are stored in SQLite.
- Existing media may be re-posted.
- Existing database records are never duplicated.
- No polling is used when WEBHOOK_URL is configured.

===============================================================================
*/

// =============================================================================
// IMPORTS
// =============================================================================

import {
    Telegraf,
    Markup
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

import {
    MovieRepository
} from "../../infrastructure/database/database";

import {
    AutoCollectionService
} from "../../application/collection/auto-collection";

import {
    ArchiveService
} from "../../application/archive/archive-service";

import {
    MenuHandler
} from "./menu-handler";

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

        this.registerMenuCallbacks();

        this.registerCallbacks();

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
                        "🎬 <b>LIBRARY OF LEGENDS</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "🔥 Willkommen im Medienarchiv",
                        "",
                        "Wähle eine Kategorie:"
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML",

                        ...MenuHandler.mainMenu()
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

        // =====================================================================
        // GET
        // =====================================================================

        this.bot.command(
            "get",
            async (
                ctx
            ) => {

                await this.handleGetCommand(
                    ctx
                );
            }
        );
    }

    // =========================================================================
    // MENU CALLBACKS
    // =========================================================================

    private registerMenuCallbacks(): void {

        // =====================================================================
        // MOVIES
        // =====================================================================

        this.bot.action(
            "MENU_MOVIES",
            async (
                ctx
            ) => {

                await ctx.answerCbQuery();

                await ctx.reply(
                    [
                        "🎬 <b>FILME</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "🔎 Suche einen Film mit:",
                        "<code>/search Titel</code>",
                        "",
                        "Beispiel:",
                        "<code>/search Superman</code>",
                        "",
                        "━━━━━━━━━━━━━━━━━━"
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML",

                        ...MenuHandler.mainMenu()
                    }
                );
            }
        );

        // =====================================================================
        // SERIES
        // =====================================================================

        this.bot.action(
            "MENU_SERIES",
            async (
                ctx
            ) => {

                await ctx.answerCbQuery();

                await ctx.reply(
                    [
                        "📺 <b>SERIEN</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "🚧 Das Serienarchiv wird als nächstes aufgebaut.",
                        "",
                        "Hier werden später:",
                        "📺 Serien",
                        "📚 Staffeln",
                        "🎞️ Episoden",
                        "📊 Fortschritt",
                        "",
                        "automatisch verwaltet.",
                        "",
                        "━━━━━━━━━━━━━━━━━━"
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML",

                        ...MenuHandler.mainMenu()
                    }
                );
            }
        );

        // =====================================================================
        // TRENDING
        // =====================================================================

        this.bot.action(
            "MENU_TRENDING",
            async (
                ctx
            ) => {

                await ctx.answerCbQuery();

                await ctx.reply(
                    [
                        "🔥 <b>TRENDING</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "🚧 Das Trending-System wird später",
                        "direkt mit deinem Filmarchiv verbunden.",
                        "",
                        "Geplant:",
                        "🔥 meist aufgerufene Filme",
                        "🆕 neu hinzugefügte Filme",
                        "📈 beliebteste Reihen",
                        "",
                        "━━━━━━━━━━━━━━━━━━"
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML",

                        ...MenuHandler.mainMenu()
                    }
                );
            }
        );

        // =====================================================================
        // TOP 100
        // =====================================================================

        this.bot.action(
            "MENU_TOP",
            async (
                ctx
            ) => {

                await ctx.answerCbQuery();

                await ctx.reply(
                    [
                        "🏆 <b>TOP 100</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "🚧 Das Top-100-System wird später",
                        "automatisch anhand der Archivdaten",
                        "und TMDB-Bewertungen aufgebaut.",
                        "",
                        "━━━━━━━━━━━━━━━━━━"
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML",

                        ...MenuHandler.mainMenu()
                    }
                );
            }
        );

        // =====================================================================
        // GENRES
        // =====================================================================

        this.bot.action(
            "MENU_GENRES",
            async (
                ctx
            ) => {

                await ctx.answerCbQuery();

                await ctx.reply(
                    [
                        "🎭 <b>GENRES</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "Wähle ein Genre:"
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML",

                        ...MenuHandler.genresMenu()
                    }
                );
            }
        );

        // =====================================================================
        // SEARCH
        // =====================================================================

        this.bot.action(
            "MENU_SEARCH",
            async (
                ctx
            ) => {

                await ctx.answerCbQuery();

                await ctx.reply(
                    [
                        "🔎 <b>ARCHIVSUCHE</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "Nutze zum Suchen:",
                        "",
                        "<code>/search Titel</code>",
                        "",
                        "Beispiele:",
                        "<code>/search Superman</code>",
                        "<code>/search John Wick</code>",
                        "<code>/search Equalizer</code>"
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
        // BACK TO MAIN
        // =====================================================================

        this.bot.action(
            "BACK_MAIN",
            async (
                ctx
            ) => {

                await ctx.answerCbQuery();

                await ctx.reply(
                    [
                        "🎬 <b>LIBRARY OF LEGENDS</b>",
                        "",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        "🔥 Hauptmenü",
                        "",
                        "Wähle eine Kategorie:"
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML",

                        ...MenuHandler.mainMenu()
                    }
                );
            }
        );

        // =====================================================================
        // GENRE
        // =====================================================================

        this.bot.action(
            /^GENRE_(.+)$/i,
            async (
                ctx
            ) => {

                try {

                    const callbackData =
                        "data" in ctx.callbackQuery
                            ? ctx.callbackQuery.data
                            : "";

                    const genre =
                        String(
                            callbackData
                        )
                            .replace(
                                /^GENRE_/i,
                                ""
                            )
                            .trim();

                    await ctx.answerCbQuery();

                    if (
                        !genre
                    ) {

                        return;
                    }

                    await ctx.reply(
                        [
                            "🎭 <b>GENRE</b>",
                            "",
                            "━━━━━━━━━━━━━━━━━━",
                            "",
                            `🎬 Gewählt: <b>${this.escapeHtml(
                                this.formatGenreName(
                                    genre
                                )
                            )}</b>`,
                            "",
                            "🚧 Die direkte Filmliste nach Genre",
                            "wird im nächsten Ausbau mit",
                            "deinem Archiv verbunden.",
                            "",
                            "━━━━━━━━━━━━━━━━━━"
                        ].join(
                            "\n"
                        ),
                        {
                            parse_mode:
                                "HTML",

                            ...MenuHandler.genresMenu()
                        }
                    );

                } catch (
                    error
                ) {

                    console.error(
                        "❌ Genre Menu Fehler:",
                        error
                    );
                }
            }
        );
    }

    // =========================================================================
    // GET COMMAND
    // =========================================================================

    private async handleGetCommand(
        ctx: any
    ): Promise<void> {

        try {

            const commandText =
                String(
                    ctx.message?.text ||
                    ""
                );

            const archiveId =
                commandText
                    .replace(
                        /^\/get(?:@\w+)?/i,
                        ""
                    )
                    .trim();

            if (
                !archiveId
            ) {

                await ctx.reply(
                    [
                        "📂 <b>Film abrufen</b>",
                        "",
                        "Bitte eine Archive-ID angeben.",
                        "",
                        "Beispiel:",
                        "<code>/get LIB-ACT-0001</code>"
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

            await this.sendArchivedMovie(
                ctx,
                archiveId
            );

        } catch (
            error
        ) {

            console.error(
                "❌ GET COMMAND FEHLER:",
                error
            );

            await ctx.reply(
                "❌ Der Film konnte nicht abgerufen werden."
            );
        }
    }

    // =========================================================================
    // INLINE CALLBACKS
    // =========================================================================

    private registerCallbacks(): void {

        // =====================================================================
        // GET MOVIE
        // =====================================================================

        this.bot.action(
            /^get:(.+)$/i,
            async (
                ctx
            ) => {

                try {

                    const callbackData =
                        "data" in ctx.callbackQuery
                            ? ctx.callbackQuery.data
                            : "";

                    const archiveId =
                        String(
                            callbackData
                        )
                            .replace(
                                /^get:/i,
                                ""
                            )
                            .trim();

                    if (
                        !archiveId
                    ) {

                        await ctx.answerCbQuery(
                            "❌ Ungültige Archive-ID.",
                            {
                                show_alert:
                                    true
                            }
                        );

                        return;
                    }

                    await ctx.answerCbQuery(
                        "🎬 Film wird abgerufen..."
                    );

                    await this.sendArchivedMovie(
                        ctx,
                        archiveId
                    );

                } catch (
                    error
                ) {

                    console.error(
                        "❌ INLINE GET FEHLER:",
                        error
                    );

                    try {

                        await ctx.answerCbQuery(
                            "❌ Film konnte nicht abgerufen werden.",
                            {
                                show_alert:
                                    true
                            }
                        );

                    } catch {
                        // Callback may already be expired.
                    }
                }
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

            const commandText =
                String(
                    ctx.message?.text ||
                    ""
                );

            const query =
                commandText
                    .replace(
                        /^\/search(?:@\w+)?/i,
                        ""
                    )
                    .trim();

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
                "🔎 ARCHIVSUCHE"
            );

            console.log(
                `🔎 Suchbegriff: ${query}`
            );

            console.log(
                "================================================="
            );

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
                        "🔥 <b>@LibraryOfLegends</b>"
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
            // RESULT TEXT
            // =================================================================

            const lines:
                string[] = [

                "━━━━━━━━━━━━━━━━━━",

                "🔎 <b>Suchergebnisse</b>",

                "━━━━━━━━━━━━━━━━━━",

                "",

                `🔍 Suche: <b>${this.escapeHtml(
                    query
                )}</b>`,

                ""
            ];

            // =================================================================
            // BUTTONS
            // =================================================================

            const buttons:
                ReturnType<
                    typeof Markup.button.callback
                >[][] = [];

            for (
                const result of results
            ) {

                const yearText =
                    result.year
                        ? ` (${result.year})`
                        : "";

                const archiveId =
                    result.archiveId ||
                    "UNKNOWN";

                lines.push(
                    `🎬 <b>${this.escapeHtml(
                        result.title
                    )}</b>${yearText}`
                );

                lines.push(
                    `🗂️ <code>${this.escapeHtml(
                        archiveId
                    )}</code>`
                );

                if (
                    result.collection
                ) {

                    lines.push(
                        `🎞️ ${this.escapeHtml(
                            result.collection
                        )}`
                    );
                }

                lines.push("");

                buttons.push([
                    Markup.button.callback(
                        `🎬 ${this.truncateButtonText(
                            result.title
                        )}${
                            result.year
                                ? ` (${result.year})`
                                : ""
                        }`,
                        `get:${archiveId}`
                    )
                ]);
            }

            // =================================================================
            // FOOTER
            // =================================================================

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                `📊 ${results.length} Treffer`
            );

            lines.push("");

            lines.push(
                "👇 Film auswählen:"
            );

            // =================================================================
            // SEND RESULTS
            // =================================================================

            await ctx.reply(
                lines.join(
                    "\n"
                ),
                {
                    parse_mode:
                        "HTML",

                    disable_web_page_preview:
                        true,

                    ...Markup.inlineKeyboard(
                        buttons
                    )
                }
            );

            console.log(
                `✅ ${results.length} Suchtreffer mit Buttons gesendet.`
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
    // SEND ARCHIVED MOVIE
    // =========================================================================

    private async sendArchivedMovie(
        ctx: any,
        archiveId: string
    ): Promise<void> {

        try {

            const normalizedArchiveId =
                String(
                    archiveId ||
                    ""
                )
                    .trim()
                    .toUpperCase();

            // =================================================================
            // VALIDATION
            // =================================================================

            if (
                !normalizedArchiveId
            ) {

                await ctx.reply(
                    "❌ Keine gültige Archive-ID angegeben."
                );

                return;
            }

            // =================================================================
            // DATABASE LOOKUP
            // =================================================================

            const movie =
                MovieRepository
                    .getAll()
                    .find(
                        record =>
                            String(
                                record.archiveId ||
                                ""
                            )
                                .trim()
                                .toUpperCase() ===
                            normalizedArchiveId
                    );

            // =================================================================
            // NOT FOUND
            // =================================================================

            if (
                !movie
            ) {

                await ctx.reply(
                    [
                        "━━━━━━━━━━━━━━━━━━",
                        "❌ <b>Film nicht gefunden</b>",
                        "━━━━━━━━━━━━━━━━━━",
                        "",
                        `🗂️ Gesucht: <code>${this.escapeHtml(
                            normalizedArchiveId
                        )}</code>`,
                        "",
                        "Bitte die Archive-ID überprüfen."
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
                "📂 ARCHIV GET"
            );

            console.log(
                `🗂️ Archive-ID: ${normalizedArchiveId}`
            );

            console.log(
                `🎬 Titel: ${movie.title}`
            );

            console.log(
                "================================================="
            );

            // =================================================================
            // TMDB REFRESH
            // =================================================================

            const tmdb =
                await TMDBService.searchMovie(
                    movie.title,
                    movie.year
                );

            // =================================================================
            // COLLECTION
            // =================================================================

            const collection =
                movie.collection ||
                AutoCollectionService.detect(
                    movie.title
                ) ||
                undefined;

            // =================================================================
            // METADATA
            // =================================================================

            const title =
                tmdb?.title ||
                movie.title;

            const year =
                tmdb?.year ||
                movie.year;

            const rating =
                tmdb?.rating;

            const genres =
                tmdb?.genres ||
                [];

            const overview =
                tmdb?.overview;

            // =================================================================
            // BUILD LAYOUT
            // =================================================================

            const caption =
                PostBuilder.build({

                    title,

                    year,

                    rating,

                    genres,

                    overview,

                    fileName:
                        movie.fileName,

                    fileSize:
                        movie.fileSize,

                    collection,

                    archiveId:
                        movie.archiveId ||
                        normalizedArchiveId
                });

            // =================================================================
            // COVER
            // =================================================================

            if (
                tmdb?.posterUrl
            ) {

                await ctx.replyWithPhoto(
                    tmdb.posterUrl
                );

                console.log(
                    "🖼️ Archiv-Cover gesendet."
                );

            } else {

                console.log(
                    "⚠️ Kein TMDB-Cover verfügbar."
                );
            }

            // =================================================================
            // VIDEO
            // =================================================================

            if (
                movie.fileId
            ) {

                await ctx.replyWithVideo(
                    movie.fileId,
                    {
                        supports_streaming:
                            true
                    }
                );

                console.log(
                    "🎬 Archiv-Film gesendet."
                );

            } else {

                await ctx.reply(
                    [
                        "⚠️ <b>Datei nicht verfügbar</b>",
                        "",
                        `🎬 ${this.escapeHtml(
                            title
                        )}`,
                        "",
                        "Für diesen Archiv-Eintrag wurde keine Telegram File-ID gespeichert."
                    ].join(
                        "\n"
                    ),
                    {
                        parse_mode:
                            "HTML"
                    }
                );
            }

            // =================================================================
            // LAYOUT
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
                "📝 Archiv-Layout gesendet."
            );

            console.log(
                "================================================="
            );

            console.log(
                "✅ ARCHIV GET VOLLSTÄNDIG"
            );

            console.log(
                `🗂️ ${normalizedArchiveId}`
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
                "❌ ARCHIV GET FEHLER"
            );

            console.error(
                error
            );

            console.error(
                "================================================="
            );

            try {

                await ctx.reply(
                    "❌ Der Archivfilm konnte nicht abgerufen werden."
                );

            } catch {
                // Telegram context may no longer exist.
            }
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
            // EXISTING ARCHIVE CHECK
            // =================================================================

            const alreadyExists =
                MovieRepository.exists(
                    fileId
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
                        parsed.episodeTitle
                            ? `📝 Episodentitel: <b>${this.escapeHtml(
                                parsed.episodeTitle
                            )}</b>`
                            : "",
                        "",
                        "🚧 Das Serien-/Episodensystem wird separat aufgebaut."
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
            // COLLECTION
            // =================================================================

            const detectedCollection =
                AutoCollectionService.detect(
                    title
                );

            console.log(
                `🎞️ Collection: ${
                    detectedCollection ||
                    "Keine"
                }`
            );

            // =================================================================
            // EXISTING RECORD
            // =================================================================

            let archiveId:
                string |
                undefined;

            let storedCollection:
                string |
                undefined;

            if (
                alreadyExists
            ) {

                const existing =
                    MovieRepository.getByFileId(
                        fileId
                    );

                archiveId =
                    existing?.archiveId;

                storedCollection =
                    existing?.collection ||
                    undefined;

                console.log(
                    `♻️ Bereits archiviert: ${
                        archiveId ||
                        "keine Archive-ID"
                    }`
                );

            } else {

                // =============================================================
                // NEW ARCHIVE ID
                // =============================================================

                archiveId =
                    ArchiveService.generate(
                        genres
                    );

                console.log(
                    `🗂️ Neue Archive ID: ${archiveId}`
                );

                // =============================================================
                // SAVE
                // =============================================================

                const saved =
                    MovieRepository.addMovie({

                        title,

                        year,

                        fileId,

                        fileName,

                        fileSize,

                        collection:
                            detectedCollection ||
                            undefined,

                        archiveId
                    });

                if (
                    !saved
                ) {

                    console.error(
                        "❌ Film konnte nicht gespeichert werden."
                    );

                    return;
                }

                console.log(
                    "💾 Film erfolgreich gespeichert."
                );
            }

            // =================================================================
            // EFFECTIVE COLLECTION
            // =================================================================

            const effectiveCollection:
                string |
                undefined =
                    storedCollection ??
                    detectedCollection ??
                    undefined;

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

                    fileSize,

                    collection:
                        effectiveCollection,

                    archiveId
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
                `🗂️ Archive: ${
                    archiveId ||
                    "keine"
                }`
            );

            console.log(
                `🎞️ Collection: ${
                    effectiveCollection ||
                    "Keine"
                }`
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
    // BUTTON TEXT
    // =========================================================================

    private truncateButtonText(
        value: string
    ): string {

        const text =
            String(
                value ||
                "Unbekannt"
            )
                .trim();

        if (
            text.length <=
            50
        ) {

            return text;
        }

        return (
            text.slice(
                0,
                47
            ).trim() +
            "..."
        );
    }

    // =========================================================================
    // GENRE NAME
    // =========================================================================

    private formatGenreName(
        value: string
    ): string {

        const mapping:
            Record<string, string> = {

            "Action":
                "Action",

            "Horror":
                "Horror",

            "Science":
                "Science Fiction",

            "Comedy":
                "Komödie",

            "Drama":
                "Drama",

            "Crime":
                "Krimi"
        };

        return (
            mapping[
                value
            ] ||
            value
        );
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