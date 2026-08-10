/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TGB-0002

LOL-ID..............: LOL-TGB-0002

File................: telegram-bot.ts

Location............
Library Of Legends/src/framework/telegram/

Version.............: 7.1.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central Telegram controller for the Library Of Legends
automatic media archive.

Responsibilities:

- Receive Telegram documents
- Receive Telegram videos
- Detect movies and series
- Read Telegram File-IDs
- Parse filenames
- Read captions when Telegram videos have no filename
- Build catalog entries
- Search TMDB
- Generate archive IDs
- Detect genres
- Route media to the correct category
- Create series topics
- Store archive metadata
- Publish standardized archive posts
- Provide Netflix-style user interface

IMPORTANT:

Telegram videos and Telegram documents are handled separately.

Telegram video files are NOT downloaded.

The original Telegram File-ID is used directly.

===============================================================================
*/

import {
    Telegraf,
    Markup
} from "telegraf";

import {
    FilenameParser
} from "../../domain/detection/filename-parser";

import {
    MovieCatalog
} from "../../domain/catalog/movie-catalog";

import {
    SeriesCatalog
} from "../../domain/catalog/series-catalog";

import {
    GenreDetector
} from "../../domain/detection/genre-detector";

import {
    ArchiveIdGenerator
} from "../../domain/archive/archive-id-generator";

import {
    TMDBClient
} from "../../infrastructure/api/tmdb/tmdb-client";

import {
    MoviePostBuilder
} from "../../application/telegram/movie-post-builder";

import {
    SeriesPostBuilder
} from "../../application/telegram/series-post-builder";

import {
    GenreRouter
} from "../../application/routing/genre-router";

import {
    TopicManager
} from "../../application/routing/topic-manager";

import {
    LibraryRepository
} from "../../infrastructure/database/library-repository";

/**
 * Telegram media source.
 */
type TelegramMediaType =
    | "document"
    | "video";

/**
 * Normalized Telegram media information.
 */
interface NormalizedMedia {

    fileId: string;

    fileName: string;

    mediaType: TelegramMediaType;

    caption?: string;

    fileSize?: number;
}

/**
 * Telegram Bot
 */
export class TelegramBot {

    // =========================================================================
    // BOT
    // =========================================================================

    private readonly bot: Telegraf;

    // =========================================================================
    // ADMIN
    // =========================================================================

    private readonly adminIds: number[];

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor(
        token: string
    ) {

        if (!token) {

            throw new Error(
                "❌ Telegram BOT TOKEN fehlt."
            );
        }

        this.bot =
            new Telegraf(
                token
            );

        this.adminIds =
            (process.env.ADMIN_IDS || "")
                .split(",")
                .map(
                    id =>
                        Number(
                            id.trim()
                        )
                )
                .filter(
                    id =>
                        Number.isFinite(id)
                );

        this.setup();
    }

    // =========================================================================
    // SETUP
    // =========================================================================

    private setup(): void {

        this.registerStartCommand();

        this.registerMovieMenu();

        this.registerSeriesMenu();

        this.registerTrending();

        this.registerFavorites();

        this.registerSearch();

        this.registerFindCommand();

        this.registerDocumentHandler();

        this.registerVideoHandler();

        this.registerCallbacks();
    }

    // =========================================================================
    // START
    // =========================================================================

    private registerStartCommand(): void {

        this.bot.start(
            async ctx => {

                await ctx.reply(
                    [
                        "🎬 *Library Of Legends*",
                        "",
                        "🚀 Automatisches Medienarchiv",
                        "",
                        "Wähle eine Funktion:"
                    ].join("\n"),
                    {
                        parse_mode: "Markdown",

                        ...Markup.keyboard([
                            [
                                "🔥 Trending",
                                "⭐ Favoriten"
                            ],
                            [
                                "🎬 Filme",
                                "📺 Serien"
                            ],
                            [
                                "🔎 Suche"
                            ]
                        ]).resize()
                    }
                );
            }
        );
    }

    // =========================================================================
    // MOVIES
    // =========================================================================

    private registerMovieMenu(): void {

        this.bot.hears(
            "🎬 Filme",
            async ctx => {

                try {

                    const movies =
                        await LibraryRepository.getMovies(
                            20,
                            0
                        );

                    if (
                        movies.length === 0
                    ) {

                        await ctx.reply(
                            "❌ Noch keine Filme im Archiv."
                        );

                        return;
                    }

                    const buttons =
                        movies.map(
                            movie => [
                                Markup.button.callback(
                                    `🎬 ${movie.title}`,
                                    `movie_${movie.id}`
                                )
                            ]
                        );

                    await ctx.reply(
                        "🎬 *Filme*",
                        {
                            parse_mode: "Markdown",

                            ...Markup.inlineKeyboard(
                                buttons
                            )
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Fehler bei Filme:",
                        error
                    );

                    await ctx.reply(
                        "❌ Filme konnten nicht geladen werden."
                    );
                }
            }
        );
    }

    // =========================================================================
    // SERIES
    // =========================================================================

    private registerSeriesMenu(): void {

        this.bot.hears(
            "📺 Serien",
            async ctx => {

                try {

                    const series =
                        await LibraryRepository.getSeries(
                            20,
                            0
                        );

                    if (
                        series.length === 0
                    ) {

                        await ctx.reply(
                            "❌ Noch keine Serien im Archiv."
                        );

                        return;
                    }

                    const buttons =
                        series.map(
                            item => [
                                Markup.button.callback(
                                    `📺 ${item.title}`,
                                    `movie_${item.id}`
                                )
                            ]
                        );

                    await ctx.reply(
                        "📺 *Serien*",
                        {
                            parse_mode: "Markdown",

                            ...Markup.inlineKeyboard(
                                buttons
                            )
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Fehler bei Serien:",
                        error
                    );

                    await ctx.reply(
                        "❌ Serien konnten nicht geladen werden."
                    );
                }
            }
        );
    }

    // =========================================================================
    // TRENDING
    // =========================================================================

    private registerTrending(): void {

        this.bot.hears(
            "🔥 Trending",
            async ctx => {

                try {

                    const items =
                        await LibraryRepository.getTrending(
                            10
                        );

                    if (
                        items.length === 0
                    ) {

                        await ctx.reply(
                            "🔥 Noch keine Trending-Inhalte."
                        );

                        return;
                    }

                    const buttons =
                        items.map(
                            item => [
                                Markup.button.callback(
                                    `🔥 ${item.title}`,
                                    `movie_${item.id}`
                                )
                            ]
                        );

                    await ctx.reply(
                        "🔥 *Trending*",
                        {
                            parse_mode: "Markdown",

                            ...Markup.inlineKeyboard(
                                buttons
                            )
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Trending Fehler:",
                        error
                    );

                    await ctx.reply(
                        "❌ Trending konnte nicht geladen werden."
                    );
                }
            }
        );
    }

    // =========================================================================
    // FAVORITES
    // =========================================================================

    private registerFavorites(): void {

        this.bot.hears(
            "⭐ Favoriten",
            async ctx => {

                try {

                    const items =
                        await LibraryRepository.getFavorites(
                            20
                        );

                    if (
                        items.length === 0
                    ) {

                        await ctx.reply(
                            "⭐ Noch keine Favoriten vorhanden."
                        );

                        return;
                    }

                    const buttons =
                        items.map(
                            item => [
                                Markup.button.callback(
                                    `⭐ ${item.title}`,
                                    `movie_${item.id}`
                                )
                            ]
                        );

                    await ctx.reply(
                        "⭐ *Favoriten*",
                        {
                            parse_mode: "Markdown",

                            ...Markup.inlineKeyboard(
                                buttons
                            )
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Favoriten Fehler:",
                        error
                    );

                    await ctx.reply(
                        "❌ Favoriten konnten nicht geladen werden."
                    );
                }
            }
        );
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    private registerSearch(): void {

        this.bot.hears(
            "🔎 Suche",
            async ctx => {

                await ctx.reply(
                    [
                        "🔎 *Library Of Legends Suche*",
                        "",
                        "Verwende:",
                        "",
                        "`/find TITEL`",
                        "",
                        "Beispiel:",
                        "`/find Superman`"
                    ].join("\n"),
                    {
                        parse_mode: "Markdown"
                    }
                );
            }
        );
    }

    // =========================================================================
    // FIND
    // =========================================================================

    private registerFindCommand(): void {

        this.bot.command(
            "find",
            async ctx => {

                try {

                    const text =
                        ctx.message.text
                            .replace(
                                /^\/find\s*/i,
                                ""
                            )
                            .trim();

                    if (!text) {

                        await ctx.reply(
                            "🔎 Bitte einen Suchbegriff eingeben.\n\nBeispiel: `/find Superman`",
                            {
                                parse_mode: "Markdown"
                            }
                        );

                        return;
                    }

                    const results =
                        await LibraryRepository.search(
                            text
                        );

                    if (
                        results.length === 0
                    ) {

                        await ctx.reply(
                            `❌ Keine Ergebnisse für "${text}".`
                        );

                        return;
                    }

                    const buttons =
                        results.map(
                            item => [
                                Markup.button.callback(
                                    item.type === "MOVIE"
                                        ? `🎬 ${item.title}`
                                        : `📺 ${item.title}`,
                                    `movie_${item.id}`
                                )
                            ]
                        );

                    await ctx.reply(
                        [
                            `🔎 *Ergebnisse für:* "${text}"`,
                            "",
                            `📚 ${results.length} Treffer`
                        ].join("\n"),
                        {
                            parse_mode: "Markdown",

                            ...Markup.inlineKeyboard(
                                buttons
                            )
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Suchfehler:",
                        error
                    );

                    await ctx.reply(
                        "❌ Suche konnte nicht ausgeführt werden."
                    );
                }
            }
        );
    }

    // =========================================================================
    // DOCUMENT HANDLER
    // =========================================================================

    private registerDocumentHandler(): void {

        this.bot.on(
            "document",
            async ctx => {

                const userId =
                    ctx.from?.id;

                if (
                    !userId ||
                    !this.isAdmin(userId)
                ) {

                    await ctx.reply(
                        "⛔ Nur Administratoren dürfen Medien archivieren."
                    );

                    return;
                }

                const document =
                    ctx.message.document;

                const media: NormalizedMedia = {

                    fileId:
                        document.file_id,

                    fileName:
                        document.file_name ||
                        "Unbekannte Datei",

                    mediaType:
                        "document",

                    caption:
                        ctx.message.caption,

                    fileSize:
                        document.file_size
                };

                await this.handleMedia(
                    ctx,
                    media
                );
            }
        );
    }

    // =========================================================================
    // VIDEO HANDLER
    // =========================================================================

    private registerVideoHandler(): void {

        this.bot.on(
            "video",
            async ctx => {

                const userId =
                    ctx.from?.id;

                if (
                    !userId ||
                    !this.isAdmin(userId)
                ) {

                    await ctx.reply(
                        "⛔ Nur Administratoren dürfen Medien archivieren."
                    );

                    return;
                }

                const video =
                    ctx.message.video;

                /*
                 * Telegram Video-Objekte besitzen nicht zuverlässig
                 * den ursprünglichen Dateinamen.
                 *
                 * Deshalb verwenden wir:
                 *
                 * 1. caption
                 * 2. generierten Dateinamen
                 *
                 * Die File-ID bleibt dabei vollständig erhalten.
                 */

                const caption =
                    ctx.message.caption ||
                    "";

                const extractedName =
                    this.extractFilenameFromCaption(
                        caption
                    );

                const media: NormalizedMedia = {

                    fileId:
                        video.file_id,

                    fileName:
                        extractedName ||
                        "Telegram-Video.mp4",

                    mediaType:
                        "video",

                    caption,

                    fileSize:
                        video.file_size
                };

                await this.handleMedia(
                    ctx,
                    media
                );
            }
        );
    }

    // =========================================================================
    // EXTRACT FILENAME FROM CAPTION
    // =========================================================================

    private extractFilenameFromCaption(
        caption: string
    ): string | undefined {

        if (!caption) {

            return undefined;
        }

        let text =
            caption.trim();

        /*
         * Entfernt beispielsweise:
         *
         * /movie Superman II – Allein gegen alle | 1980
         */

        text =
            text.replace(
                /^\/movie\s*/i,
                ""
            ).trim();

        text =
            text.replace(
                /^\/start\s*/i,
                ""
            ).trim();

        if (!text) {

            return undefined;
        }

        /*
         * Falls die Caption bereits eine Dateiendung enthält,
         * übernehmen wir sie unverändert.
         */

        if (
            /\.(mp4|mkv|avi|mov|m4v|webm)$/i.test(
                text
            )
        ) {

            return text;
        }

        /*
         * Andernfalls erzeugen wir einen brauchbaren
         * Dateinamen für die interne Verarbeitung.
         */

        return `${text}.mp4`;
    }

    // =========================================================================
    // COMMON MEDIA HANDLER
    // =========================================================================

    private async handleMedia(
        ctx: any,
        media: NormalizedMedia
    ): Promise<void> {

        try {

            console.log(
                "================================================="
            );

            console.log(
                "📥 TELEGRAM MEDIA EMPFANGEN"
            );

            console.log(
                `📄 Dateiname: ${media.fileName}`
            );

            console.log(
                `🆔 File-ID: ${media.fileId}`
            );

            console.log(
                `🎞️ Typ: ${media.mediaType}`
            );

            if (
                media.fileSize
            ) {

                console.log(
                    `📦 Größe: ${media.fileSize} Bytes`
                );
            }

            console.log(
                "================================================="
            );

            // =================================================================
            // PARSE
            // =================================================================

            const parsed =
                FilenameParser.parse(
                    media.fileName
                );

            console.log(
                "🧠 Parsed Media:",
                parsed
            );

            // =================================================================
            // GENRE
            // =================================================================

            const genres =
                GenreDetector.detect(
                    parsed.title
                );

            const primaryGenre =
                GenreDetector.detectPrimary(
                    parsed.title
                );

            console.log(
                `🏷️ Genre: ${primaryGenre}`
            );

            // =================================================================
            // ROUTING
            // =================================================================

            const route =
                GenreRouter.route(
                    genres
                );

            console.log(
                `📂 Kategorie: ${route.categoryTitle}`
            );

            // =================================================================
            // MOVIE
            // =================================================================

            if (
                parsed.type === "MOVIE"
            ) {

                await this.processMovie(
                    ctx,
                    media,
                    parsed,
                    primaryGenre,
                    route
                );

                return;
            }

            // =================================================================
            // SERIES
            // =================================================================

            if (
                parsed.type === "SERIES"
            ) {

                await this.processSeries(
                    ctx,
                    media,
                    parsed,
                    primaryGenre,
                    route
                );

                return;
            }

            await ctx.reply(
                "❌ Medientyp konnte nicht erkannt werden."
            );

        } catch (error) {

            console.error(
                "❌ Fehler bei der Medienverarbeitung:",
                error
            );

            await ctx.reply(
                "❌ Die Datei konnte nicht verarbeitet werden."
            );
        }
    }

    // =========================================================================
    // PROCESS MOVIE
    // =========================================================================

    private async processMovie(
        ctx: any,
        media: NormalizedMedia,
        parsed: any,
        primaryGenre: any,
        route: any
    ): Promise<void> {

        const movie =
            MovieCatalog.createFromParsed(
                parsed
            );

        console.log(
            `🎬 Film erkannt: ${movie.title}`
        );

        // =====================================================================
        // TMDB
        // =====================================================================

        let tmdb = null;

        try {

            tmdb =
                await TMDBClient.searchMovie(
                    movie.title
                );

        } catch (error) {

            console.warn(
                "⚠️ TMDB Movie Suche fehlgeschlagen:",
                error
            );
        }

        // =====================================================================
        // ARCHIVE ID
        // =====================================================================

        const archiveId =
            ArchiveIdGenerator.generate(
                primaryGenre,
                await this.getNextArchiveNumber()
            );

        // =====================================================================
        // POST
        // =====================================================================

        const caption =
            MoviePostBuilder.build(
                movie,
                tmdb,
                {
                    archiveId
                }
            );

        // =====================================================================
        // TARGET
        // =====================================================================

        const chatId =
            route.telegramChatId;

        // =====================================================================
        // DATABASE
        // =====================================================================

        await LibraryRepository.save(
            movie.title,
            media.fileName,
            "MOVIE",
            media.fileId,
            {
                genre:
                    primaryGenre,

                archiveId,

                telegramChatId:
                    chatId
            }
        );

        console.log(
            "💾 Film in Datenbank gespeichert."
        );

        // =====================================================================
        // TELEGRAM ARCHIVE
        // =====================================================================

        if (
            chatId
        ) {

            await this.publishMovie(
                chatId,
                media,
                caption
            );

            console.log(
                `📂 Film nach Telegram verschoben: ${chatId}`
            );
        }

        // =====================================================================
        // CONFIRMATION
        // =====================================================================

        await ctx.reply(
            [
                "✅ *Film verarbeitet & gespeichert!*",
                "",
                `🎬 ${movie.title}`,
                `🗃️ ${archiveId}`,
                `🏷️ ${primaryGenre}`,
                `📂 ${route.categoryTitle}`,
                "",
                `🆔 File-ID gespeichert`,
                `🎞️ Quelle: ${media.mediaType}`
            ].join("\n"),
            {
                parse_mode: "Markdown"
            }
        );
    }

    // =========================================================================
    // PROCESS SERIES
    // =========================================================================

    private async processSeries(
        ctx: any,
        media: NormalizedMedia,
        parsed: any,
        primaryGenre: any,
        route: any
    ): Promise<void> {

        const series =
            SeriesCatalog.createFromParsed(
                parsed
            );

        console.log(
            `📺 Serie erkannt: ${series.title}`
        );

        // =====================================================================
        // TMDB
        // =====================================================================

        let tmdb = null;

        try {

            tmdb =
                await TMDBClient.searchSeries(
                    series.title
                );

        } catch (error) {

            console.warn(
                "⚠️ TMDB Series Suche fehlgeschlagen:",
                error
            );
        }

        // =====================================================================
        // ARCHIVE ID
        // =====================================================================

        const archiveId =
            ArchiveIdGenerator.generate(
                primaryGenre,
                await this.getNextArchiveNumber()
            );

        // =====================================================================
        // TARGET
        // =====================================================================

        const chatId =
            route.telegramChatId;

        // =====================================================================
        // TOPIC
        // =====================================================================

        let topicId:
            number | undefined;

        if (
            chatId
        ) {

            topicId =
                await TopicManager.getOrCreateSeriesTopic(
                    this.bot,
                    chatId,
                    series.title
                );
        }

        // =====================================================================
        // POST
        // =====================================================================

        const caption =
            SeriesPostBuilder.build(
                series,
                tmdb,
                {
                    archiveId
                }
            );

        // =====================================================================
        // DATABASE
        // =====================================================================

        await LibraryRepository.save(
            series.title,
            media.fileName,
            "SERIES",
            media.fileId,
            {
                genre:
                    primaryGenre,

                archiveId,

                telegramChatId:
                    chatId,

                topicId
            }
        );

        console.log(
            "💾 Serie in Datenbank gespeichert."
        );

        // =====================================================================
        // TELEGRAM ARCHIVE
        // =====================================================================

        if (
            chatId
        ) {

            await this.publishSeries(
                chatId,
                topicId,
                media,
                caption
            );

            console.log(
                `📂 Serie nach Telegram verschoben: ${chatId}`
            );
        }

        // =====================================================================
        // CONFIRMATION
        // =====================================================================

        await ctx.reply(
            [
                "✅ *Serie verarbeitet & gespeichert!*",
                "",
                `📺 ${series.title}`,
                `🗃️ ${archiveId}`,
                `🏷️ ${primaryGenre}`,
                `📂 ${route.categoryTitle}`,
                `📌 Topic: ${topicId ?? "—"}`,
                "",
                `🆔 File-ID gespeichert`,
                `🎞️ Quelle: ${media.mediaType}`
            ].join("\n"),
            {
                parse_mode: "Markdown"
            }
        );
    }

    // =========================================================================
    // PUBLISH MOVIE
    // =========================================================================

    private async publishMovie(
        chatId: string,
        media: NormalizedMedia,
        caption: string
    ): Promise<void> {

        /*
         * Telegram Video:
         *
         * sendVideo()
         *
         * Telegram Document:
         *
         * sendDocument()
         */

        if (
            media.mediaType === "video"
        ) {

            await this.bot.telegram.sendVideo(
                chatId,
                media.fileId,
                {
                    caption
                }
            );

            return;
        }

        await this.bot.telegram.sendDocument(
            chatId,
            media.fileId,
            {
                caption
            }
        );
    }

    // =========================================================================
    // PUBLISH SERIES
    // =========================================================================

    private async publishSeries(
        chatId: string,
        topicId: number | undefined,
        media: NormalizedMedia,
        caption: string
    ): Promise<void> {

        const topicOptions =
            topicId
                ? {
                    message_thread_id:
                        topicId
                }
                : {};

        if (
            media.mediaType === "video"
        ) {

            await this.bot.telegram.sendVideo(
                chatId,
                media.fileId,
                {
                    caption,

                    ...topicOptions
                }
            );

            return;
        }

        await this.bot.telegram.sendDocument(
            chatId,
            media.fileId,
            {
                caption,

                ...topicOptions
            }
        );
    }

    // =========================================================================
    // CALLBACKS
    // =========================================================================

    private registerCallbacks(): void {

        // ---------------------------------------------------------------------
        // MEDIA CLICK
        // ---------------------------------------------------------------------

        this.bot.action(
            /movie_(.+)/,
            async ctx => {

                try {

                    const id =
                        ctx.match[1];

                    const item =
                        await LibraryRepository.findById(
                            id
                        );

                    if (!item) {

                        await ctx.answerCbQuery(
                            "❌ Eintrag nicht gefunden."
                        );

                        return;
                    }

                    await LibraryRepository.increaseViews(
                        id
                    );

                    await ctx.answerCbQuery();

                    await ctx.reply(
                        [
                            item.type === "MOVIE"
                                ? "🎬 *Film*"
                                : "📺 *Serie*",
                            "",
                            `🎞️ ${item.title}`,
                            "",
                            `🏷️ ${item.genre}`,
                            item.archive_id
                                ? `🗃️ ${item.archive_id}`
                                : "",
                            "",
                            "Was möchtest du tun?"
                        ]
                            .filter(
                                line =>
                                    line !== ""
                            )
                            .join("\n"),
                        {
                            parse_mode: "Markdown",

                            ...Markup.inlineKeyboard([
                                [
                                    Markup.button.callback(
                                        "📥 Datei senden",
                                        `file_${item.id}`
                                    )
                                ],
                                [
                                    Markup.button.callback(
                                        item.is_favorite
                                            ? "💔 Entfernen"
                                            : "⭐ Favorit",
                                        `fav_${item.id}`
                                    )
                                ]
                            ])
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Callback Fehler:",
                        error
                    );

                    await ctx.answerCbQuery(
                        "❌ Fehler."
                    );
                }
            }
        );

        // ---------------------------------------------------------------------
        // FILE
        // ---------------------------------------------------------------------

        this.bot.action(
            /file_(.+)/,
            async ctx => {

                try {

                    const id =
                        ctx.match[1];

                    const item =
                        await LibraryRepository.findById(
                            id
                        );

                    if (!item) {

                        await ctx.answerCbQuery(
                            "❌ Datei nicht gefunden."
                        );

                        return;
                    }

                    await ctx.answerCbQuery(
                        "📥 Datei wird gesendet..."
                    );

                    /*
                     * Aktuell wird das gespeicherte Medium
                     * anhand der Archivierung als Video oder
                     * Dokument behandelt.
                     *
                     * Bei klassischen MP4-Videos ist sendVideo
                     * der korrekte Telegram-Weg.
                     */

                    if (
                        /\.mp4$/i.test(
                            item.file_name
                        )
                    ) {

                        await this.bot.telegram.sendVideo(
                            ctx.chat!.id,
                            item.file_id,
                            {
                                caption:
                                    `🎬 ${item.title}`
                            }
                        );

                    } else {

                        await this.bot.telegram.sendDocument(
                            ctx.chat!.id,
                            item.file_id,
                            {
                                caption:
                                    `🎬 ${item.title}`
                            }
                        );
                    }

                } catch (error) {

                    console.error(
                        "❌ File-ID Fehler:",
                        error
                    );

                    await ctx.answerCbQuery(
                        "❌ Datei konnte nicht gesendet werden."
                    );
                }
            }
        );

        // ---------------------------------------------------------------------
        // FAVORITE
        // ---------------------------------------------------------------------

        this.bot.action(
            /fav_(.+)/,
            async ctx => {

                try {

                    const id =
                        ctx.match[1];

                    const favorite =
                        await LibraryRepository.toggleFavorite(
                            id
                        );

                    await ctx.answerCbQuery(
                        favorite
                            ? "⭐ Favorit gespeichert"
                            : "💔 Favorit entfernt"
                    );

                } catch (error) {

                    console.error(
                        "❌ Favoriten Fehler:",
                        error
                    );

                    await ctx.answerCbQuery(
                        "❌ Favorit konnte nicht geändert werden."
                    );
                }
            }
        );
    }

    // =========================================================================
    // ADMIN CHECK
    // =========================================================================

    private isAdmin(
        userId: number
    ): boolean {

        return this.adminIds.includes(
            userId
        );
    }

    // =========================================================================
    // NEXT ARCHIVE NUMBER
    // =========================================================================

    private async getNextArchiveNumber(): Promise<number> {

        const total =
            await LibraryRepository.count();

        return total + 1;
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public launch(): void {

        this.bot.launch();

        console.log(
            "🤖 Bot gestartet (FULL SYSTEM + AUTO ARCHIVE)"
        );

        console.log(
            "🔥 Netflix UI aktiv"
        );

        console.log(
            "💾 Database + File-ID System aktiv"
        );

        console.log(
            "🧠 Automatic Detection aktiv"
        );

        console.log(
            "🎬 Movie/Series Catalog aktiv"
        );

        console.log(
            "🎞️ TMDB Integration aktiv"
        );

        console.log(
            "📂 Genre Routing aktiv"
        );

        console.log(
            "📌 Topic Management aktiv"
        );

        console.log(
            "🗃️ Archive ID System aktiv"
        );

        console.log(
            "🎥 Telegram VIDEO Handler aktiv"
        );

        console.log(
            "📄 Telegram DOCUMENT Handler aktiv"
        );
    }
}