/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TG-0001

LOL-ID..............: LOL-TG-BOT-0001

File................: telegram-bot.ts

Location............
Library Of Legends/src/framework/telegram/

Version.............: 11.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central Telegram integration for Library Of Legends.

Responsibilities:

- Start Telegram bot
- Receive Telegram videos
- Receive Telegram documents
- Detect supported media files
- Parse filenames
- Detect movies
- Detect series
- Detect genres
- Route movies to genre groups
- Route series to series group
- Create and reuse series topics
- Generate catalog entries
- Generate archive information
- Store Telegram File-IDs
- Query TMDB
- Build movie posts
- Build series posts
- Provide Netflix-style start menu
- Provide /find
- Provide /search
- Provide /movies
- Provide /series
- Provide /trending
- Provide /favorites
- Handle inline movie actions
- Handle favorites
- Handle series actions
- Track views
- Handle errors without stopping the bot
- Keep Telegram UI logic centralized

Environment variables:

TOKEN
BOT_TOKEN
DATABASE_URL
TMDB_API_KEY

Telegram destinations:

MOVIE_GROUP_ID
SERIES_GROUP_ID

Optional genre groups:

ACTION_GROUP_ID
HORROR_GROUP_ID
SCIFI_GROUP_ID
DRAMA_GROUP_ID
COMEDY_GROUP_ID
ANIMATION_GROUP_ID
CRIME_GROUP_ID
DOCUMENTARY_GROUP_ID
KIDS_GROUP_ID
GENERAL_GROUP_ID

===============================================================================
*/

import {
    Telegraf,
    Context,
    Markup
} from "telegraf";

import {
    LibraryRepository
} from "../../infrastructure/database/library-repository";

import {
    FilenameParser
} from "../../domain/detection/filename-parser";

import {
    GenreDetector
} from "../../domain/detection/genre-detector";

import {
    GenreRouter
} from "../../application/routing/genre-router";

import {
    TopicManager
} from "../../application/routing/topic-manager";

import {
    MovieCatalog
} from "../../domain/catalog/movie-catalog";

import {
    SeriesCatalog
} from "../../domain/catalog/series-catalog";

import {
    TMDBClient
} from "../../infrastructure/tmdb/tmdb-client";

import {
    MoviePostBuilder
} from "../../application/telegram/movie-post-builder";

import {
    SeriesPostBuilder
} from "../../application/telegram/series-post-builder";

/**
 * Telegram media information.
 */
interface TelegramMedia {

    fileId: string;

    fileName: string;

    fileSize?: number;

    type:
        "video" |
        "document";
}

/**
 * Telegram destination.
 */
interface TelegramDestination {

    chatId: string;

    category: string;

    categoryTitle: string;
}

/**
 * TelegramBot.
 */
export class TelegramBot {

    // =========================================================================
    // BOT
    // =========================================================================

    private readonly bot:
        Telegraf<Context>;

    // =========================================================================
    // TOKEN
    // =========================================================================

    private readonly token:
        string;

    // =========================================================================
    // STATE
    // =========================================================================

    private started:
        boolean = false;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor(
        token: string
    ) {

        this.token =
            String(
                token || ""
            ).trim();

        if (
            !this.token
        ) {

            throw new Error(
                "TelegramBot: BOT TOKEN fehlt."
            );
        }

        this.bot =
            new Telegraf<Context>(
                this.token
            );

        console.log(
            "🔧 TelegramBot erfolgreich erstellt"
        );

        this.setup();
    }

    // =========================================================================
    // SETUP
    // =========================================================================

    private setup(): void {

        // =====================================================================
        // START
        // =====================================================================

        this.bot.start(
            async (
                ctx
            ) => {

                await this.handleStart(
                    ctx
                );
            }
        );

        // =====================================================================
        // HELP
        // =====================================================================

        this.bot.help(
            async (
                ctx
            ) => {

                await this.safeReply(
                    ctx,
                    this.buildHelpText()
                );
            }
        );

        // =====================================================================
        // FIND
        // =====================================================================

        this.bot.command(
            "find",
            async (
                ctx
            ) => {

                await this.handleFindCommand(
                    ctx
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

                await this.handleSearchCommand(
                    ctx
                );
            }
        );

        // =====================================================================
        // MOVIES
        // =====================================================================

        this.bot.command(
            "movies",
            async (
                ctx
            ) => {

                await this.handleMovies(
                    ctx
                );
            }
        );

        // =====================================================================
        // SERIES
        // =====================================================================

        this.bot.command(
            "series",
            async (
                ctx
            ) => {

                await this.handleSeries(
                    ctx
                );
            }
        );

        // =====================================================================
        // TRENDING
        // =====================================================================

        this.bot.command(
            "trending",
            async (
                ctx
            ) => {

                await this.handleTrending(
                    ctx
                );
            }
        );

        // =====================================================================
        // FAVORITES
        // =====================================================================

        this.bot.command(
            "favorites",
            async (
                ctx
            ) => {

                await this.handleFavorites(
                    ctx
                );
            }
        );

        // =====================================================================
        // TEXT MENU
        // =====================================================================

        this.bot.hears(
            "🔥 Trending",
            async (
                ctx
            ) => {

                await this.handleTrending(
                    ctx
                );
            }
        );

        this.bot.hears(
            "⭐ Favoriten",
            async (
                ctx
            ) => {

                await this.handleFavorites(
                    ctx
                );
            }
        );

        this.bot.hears(
            "🎬 Filme",
            async (
                ctx
            ) => {

                await this.handleMovies(
                    ctx
                );
            }
        );

        this.bot.hears(
            "📺 Serien",
            async (
                ctx
            ) => {

                await this.handleSeries(
                    ctx
                );
            }
        );

        // =====================================================================
        // VIDEO HANDLER
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
        // DOCUMENT HANDLER
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

        // =====================================================================
        // MOVIE CALLBACK
        // =====================================================================

        this.bot.action(
            /^movie_(.+)$/,
            async (
                ctx
            ) => {

                await this.handleMovieAction(
                    ctx
                );
            }
        );

        // =====================================================================
        // FAVORITE CALLBACK
        // =====================================================================

        this.bot.action(
            /^fav_(.+)$/,
            async (
                ctx
            ) => {

                await this.handleFavoriteAction(
                    ctx
                );
            }
        );

        // =====================================================================
        // SERIES CALLBACK
        // =====================================================================

        this.bot.action(
            /^series_(.+)$/,
            async (
                ctx
            ) => {

                await this.handleSeriesAction(
                    ctx
                );
            }
        );

        // =====================================================================
        // GLOBAL ERROR HANDLER
        // =====================================================================

        this.bot.catch(
            async (
                error,
                ctx
            ) => {

                console.error(
                    "================================================="
                );

                console.error(
                    "❌ TELEGRAM BOT FEHLER"
                );

                console.error(
                    error
                );

                console.error(
                    "================================================="
                );

                try {

                    await ctx.reply(
                        "❌ Bei der Verarbeitung ist ein Fehler aufgetreten."
                    );

                } catch {
                    // Telegram context may no longer exist.
                }
            }
        );
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public launch(): void {

        if (
            this.started
        ) {

            console.log(
                "⚠️ TelegramBot läuft bereits."
            );

            return;
        }

        this.started =
            true;

        void this.bot.launch(
            {
                dropPendingUpdates:
                    false
            }
        );

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

        console.log(
            "🔎 /find System aktiv"
        );
    }

    // =========================================================================
    // STOP
    // =========================================================================

    public stop(
        reason = "Manual shutdown"
    ): void {

        if (
            !this.started
        ) {

            return;
        }

        try {

            this.bot.stop(
                reason
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Fehler beim Stoppen:",
                error
            );
        }

        this.started =
            false;

        console.log(
            `🛑 TelegramBot gestoppt: ${reason}`
        );
    }

    // =========================================================================
    // START SCREEN
    // =========================================================================

    private async handleStart(
        ctx: Context
    ): Promise<void> {

        await ctx.reply(
            [
                "🎬 <b>Library Of Legends</b>",
                "",
                "━━━━━━━━━━━━━━━━━━",
                "",
                "🎞️ Willkommen im Medienarchiv!",
                "",
                "🔎 Suche Filme und Serien",
                "📚 Durchsuche das Archiv",
                "🔥 Entdecke Trending-Inhalte",
                "⭐ Verwalte deine Favoriten",
                "",
                "━━━━━━━━━━━━━━━━━━",
                "",
                "💡 Suche:",
                "<code>/find Superman</code>"
            ].join(
                "\n"
            ),
            {
                parse_mode:
                    "HTML",

                ...Markup.keyboard(
                    [
                        [
                            "🔥 Trending",
                            "⭐ Favoriten"
                        ],
                        [
                            "🎬 Filme",
                            "📺 Serien"
                        ]
                    ]
                ).resize()
            }
        );
    }

    // =========================================================================
    // HELP
    // =========================================================================

    private buildHelpText(): string {

        return [

            "🎬 <b>Library Of Legends</b>",

            "",

            "━━━━━━━━━━━━━━━━━━",

            "📚 <b>Befehle</b>",

            "",

            "🔎 <code>/find TITEL</code>",
            "🔎 <code>/search TITEL</code>",

            "🎬 <code>/movies</code>",
            "📺 <code>/series</code>",

            "🔥 <code>/trending</code>",
            "⭐ <code>/favorites</code>",

            "",

            "━━━━━━━━━━━━━━━━━━",

            "🤖 Automatische Medienerkennung aktiv."

        ].join(
            "\n"
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
                    "⚠️ Keine unterstützte Mediendatei."
                );

                return;
            }

            console.log(
                `📄 Dateiname: ${media.fileName}`
            );

            console.log(
                `🆔 File-ID: ${media.fileId}`
            );

            console.log(
                `🎞️ Typ: ${media.type}`
            );

            console.log(
                `📦 Größe: ${
                    media.fileSize ??
                    "unbekannt"
                } Bytes`
            );

            console.log(
                "================================================="
            );

            // =================================================================
            // PARSER
            // =================================================================

            const parsed:
                any =
                (FilenameParser as any).parse(
                    media.fileName
                );

            console.log(
                "🧠 Parsed Media:",
                parsed
            );

            if (
                !parsed
            ) {

                throw new Error(
                    "FilenameParser konnte die Datei nicht analysieren."
                );
            }

            // =================================================================
            // TYPE SAFETY FALLBACK
            // =================================================================

            const parsedType =
                String(
                    parsed.type ||
                    ""
                ).toUpperCase();

            // =================================================================
            // SERIES
            // =================================================================

            if (
                parsedType ===
                "SERIES"
            ) {

                await this.processSeries(
                    ctx,
                    media,
                    parsed
                );

            } else {

                // =============================================================
                // MOVIE
                // =============================================================

                await this.processMovie(
                    ctx,
                    media,
                    parsed
                );
            }

        } catch (
            error
        ) {

            console.error(
                "❌ Fehler bei der Medienverarbeitung:",
                error
            );

            await this.safeReply(
                ctx,
                "❌ Die Datei konnte nicht verarbeitet werden."
            );

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

            const fileName =
                message.video.file_name ||
                `video_${message.video.file_unique_id}.mp4`;

            return {

                fileId:
                    message.video.file_id,

                fileName,

                fileSize:
                    message.video.file_size,

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

            const fileName =
                message.document.file_name ||
                `document_${message.document.file_unique_id}`;

            if (
                !this.isSupportedMediaFile(
                    fileName
                )
            ) {

                console.log(
                    `⚠️ Nicht unterstützte Datei: ${fileName}`
                );

                return undefined;
            }

            return {

                fileId:
                    message.document.file_id,

                fileName,

                fileSize:
                    message.document.file_size,

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
    // PROCESS MOVIE
    // =========================================================================

    private async processMovie(
        ctx: Context,
        media: TelegramMedia,
        parsed: any
    ): Promise<void> {

        const title =
            String(
                parsed.title ||
                media.fileName
            ).trim();

        console.log(
            `🎬 Film erkannt: ${title}`
        );

        // =====================================================================
        // GENRE
        // =====================================================================

        let genres:
            any[] = [];

        try {

            genres =
                (GenreDetector as any).detect(
                    title
                ) || [];

        } catch (
            error
        ) {

            console.error(
                "⚠️ Genre-Erkennung fehlgeschlagen:",
                error
            );
        }

        // =====================================================================
        // ROUTING
        // =====================================================================

        let route:
            any = {};

        try {

            route =
                (GenreRouter as any).route(
                    genres
                ) || {};

        } catch (
            error
        ) {

            console.error(
                "⚠️ Genre-Routing fehlgeschlagen:",
                error
            );
        }

        const primaryGenre =
            String(
                route.primaryGenre ||
                genres[0] ||
                "Unknown"
            );

        const category =
            String(
                route.category ||
                route.categoryId ||
                "general"
            );

        const categoryTitle =
            String(
                route.categoryTitle ||
                "📚 Allgemein"
            );

        console.log(
            `🏷️ Genre: ${primaryGenre}`
        );

        console.log(
            `📂 Kategorie: ${categoryTitle}`
        );

        // =====================================================================
        // CATALOG
        // =====================================================================

        let movie:
            any;

        try {

            movie =
                await (
                    MovieCatalog as any
                ).createFromParsed(
                    parsed,
                    media.fileId,
                    media.fileSize,
                    this.getChatId(
                        ctx
                    ),
                    this.getMessageId(
                        ctx
                    )
                );

        } catch (
            error
        ) {

            console.error(
                "⚠️ MovieCatalog konnte nicht erstellt werden:",
                error
            );

            /*
             * Fallback object.
             *
             * This keeps the Telegram pipeline alive even if the
             * catalog implementation changes.
             */

            movie = {

                title,

                year:
                    parsed.year,

                type:
                    "MOVIE",

                originalFileName:
                    media.fileName,

                fileId:
                    media.fileId,

                fileSize:
                    media.fileSize,

                genres:
                    genres,

                archiveId:
                    `LL-${Date.now()}`,

                category,

                categoryTitle,

                quality:
                    parsed.quality,

                resolution:
                    parsed.resolution,

                source:
                    parsed.source,

                audio:
                    parsed.audio,

                videoCodec:
                    parsed.videoCodec
            };
        }

        console.log(
            `🗃️ Archive-ID: ${
                movie.archiveId ||
                movie.libraryId ||
                movie.id ||
                "—"
            }`
        );

        // =====================================================================
        // TMDB
        // =====================================================================

        let tmdb:
            any = undefined;

        try {

            tmdb =
                await this.findTMDB(
                    title,
                    "movie",
                    parsed.year
                );

            if (
                tmdb
            ) {

                console.log(
                    `🎞️ TMDB gefunden: ${
                        tmdb.title ||
                        title
                    }`
                );

            } else {

                console.log(
                    "⚠️ Kein TMDB-Ergebnis."
                );
            }

        } catch (
            error
        ) {

            console.error(
                "⚠️ TMDB Fehler:",
                error
            );
        }

        // =====================================================================
        // DATABASE
        // =====================================================================

        try {

            await LibraryRepository.save(

                title,

                media.fileName,

                "MOVIE",

                media.fileId
            );

            console.log(
                "💾 Film in Datenbank gespeichert."
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Datenbankfehler:",
                error
            );
        }

        // =====================================================================
        // POST BUILDER
        // =====================================================================

        let post:
            any;

        try {

            post =
                (MoviePostBuilder as any).buildFull(
                    movie,
                    tmdb
                );

        } catch (
            error
        ) {

            console.error(
                "⚠️ MoviePostBuilder Fehler:",
                error
            );

            post = {

                caption:
                    this.buildMovieFallbackCaption(
                        movie,
                        tmdb,
                        categoryTitle
                    ),

                buttons:
                    [],

                posterUrl:
                    tmdb?.posterUrl,

                parseMode:
                    "HTML"
            };
        }

        // =====================================================================
        // DESTINATION
        // =====================================================================

        const destination =
            this.resolveMovieDestination(
                category
            );

        if (
            !destination
        ) {

            console.error(
                "❌ Keine Film-Zielgruppe konfiguriert."
            );

            await this.safeReply(
                ctx,
                [
                    "⚠️ <b>Film verarbeitet</b>",
                    "",
                    `🎬 ${this.escapeHtml(
                        title
                    )}`,
                    "",
                    "❌ Keine Zielgruppe konfiguriert.",
                    "",
                    "Bitte MOVIE_GROUP_ID oder eine Genre-Gruppen-ID setzen."
                ].join(
                    "\n"
                )
            );

            return;
        }

        // =====================================================================
        // SEND
        // =====================================================================

        await this.sendMovie(
            destination,
            movie,
            post
        );

        // =====================================================================
        // CONFIRMATION
        // =====================================================================

        await this.safeReply(
            ctx,
            [
                "✅ <b>Film verarbeitet</b>",
                "",
                `🎬 ${this.escapeHtml(
                    title
                )}`,
                `🏷️ ${this.escapeHtml(
                    primaryGenre
                )}`,
                `📂 ${this.escapeHtml(
                    categoryTitle
                )}`
            ].join(
                "\n"
            )
        );

        console.log(
            `✅ Film vollständig verarbeitet: ${title}`
        );
    }

    // =========================================================================
    // PROCESS SERIES
    // =========================================================================

    private async processSeries(
        ctx: Context,
        media: TelegramMedia,
        parsed: any
    ): Promise<void> {

        const title =
            String(
                parsed.title ||
                media.fileName
            ).trim();

        console.log(
            `📺 Serie erkannt: ${title}`
        );

        // =====================================================================
        // GENRE
        // =====================================================================

        let genres:
            any[] = [];

        try {

            genres =
                (GenreDetector as any).detect(
                    title
                ) || [];

        } catch (
            error
        ) {

            console.error(
                "⚠️ Genre-Erkennung fehlgeschlagen:",
                error
            );
        }

        // =====================================================================
        // ROUTING
        // =====================================================================

        let route:
            any = {};

        try {

            route =
                (GenreRouter as any).route(
                    genres
                ) || {};

        } catch (
            error
        ) {

            console.error(
                "⚠️ Genre-Routing fehlgeschlagen:",
                error
            );
        }

        const categoryTitle =
            String(
                route.categoryTitle ||
                "📺 Serien"
            );

        console.log(
            `🏷️ Genre: ${
                route.primaryGenre ||
                genres[0] ||
                "Unknown"
            }`
        );

        console.log(
            `📂 Kategorie: ${categoryTitle}`
        );

        // =====================================================================
        // CATALOG
        // =====================================================================

        let series:
            any;

        try {

            series =
                await (
                    SeriesCatalog as any
                ).createFromParsed(
                    parsed,
                    media.fileId,
                    media.fileSize,
                    this.getChatId(
                        ctx
                    ),
                    this.getMessageId(
                        ctx
                    )
                );

        } catch (
            error
        ) {

            console.error(
                "⚠️ SeriesCatalog konnte nicht erstellt werden:",
                error
            );

            series = {

                title,

                year:
                    parsed.year,

                type:
                    "SERIES",

                season:
                    parsed.season,

                episode:
                    parsed.episode,

                originalFileName:
                    media.fileName,

                fileId:
                    media.fileId,

                fileSize:
                    media.fileSize,

                genres,

                seriesId:
                    `SER-${Date.now()}`,

                episodeId:
                    `EP-${Date.now()}`,

                category:
                    route.category ||
                    "general",

                categoryTitle,

                quality:
                    parsed.quality,

                resolution:
                    parsed.resolution,

                source:
                    parsed.source,

                audio:
                    parsed.audio,

                videoCodec:
                    parsed.videoCodec
            };
        }

        console.log(
            `🆔 Serien-ID: ${
                series.seriesId ||
                series.id ||
                "—"
            }`
        );

        console.log(
            `🎬 Episoden-ID: ${
                series.episodeId ||
                "—"
            }`
        );

        // =====================================================================
        // TMDB
        // =====================================================================

        let tmdb:
            any = undefined;

        try {

            tmdb =
                await this.findTMDB(
                    title,
                    "tv",
                    parsed.year
                );

            if (
                tmdb
            ) {

                console.log(
                    `🎞️ TMDB Serie gefunden: ${
                        tmdb.title ||
                        title
                    }`
                );

            } else {

                console.log(
                    "⚠️ Kein TMDB-Serienergebnis."
                );
            }

        } catch (
            error
        ) {

            console.error(
                "⚠️ TMDB Serienfehler:",
                error
            );
        }

        // =====================================================================
        // DATABASE
        // =====================================================================

        try {

            await LibraryRepository.save(

                title,

                media.fileName,

                "SERIES",

                media.fileId
            );

            console.log(
                "💾 Serie in Datenbank gespeichert."
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Serien-Datenbankfehler:",
                error
            );
        }

        // =====================================================================
        // POST
        // =====================================================================

        let post:
            any;

        try {

            post =
                (SeriesPostBuilder as any).buildFull(
                    series,
                    tmdb
                );

        } catch (
            error
        ) {

            console.error(
                "⚠️ SeriesPostBuilder Fehler:",
                error
            );

            post = {

                caption:
                    this.buildSeriesFallbackCaption(
                        series,
                        tmdb,
                        categoryTitle
                    ),

                buttons:
                    [],

                posterUrl:
                    tmdb?.posterUrl,

                parseMode:
                    "HTML"
            };
        }

        // =====================================================================
        // SERIES GROUP
        // =====================================================================

        const seriesGroup =
            this.getEnv(
                "SERIES_GROUP_ID"
            );

        if (
            !seriesGroup
        ) {

            console.error(
                "❌ SERIES_GROUP_ID fehlt."
            );

            await this.safeReply(
                ctx,
                "⚠️ Serie verarbeitet, aber SERIES_GROUP_ID ist nicht konfiguriert."
            );

            return;
        }

        // =====================================================================
        // TOPIC
        // =====================================================================

        const threadId =
            await this.getOrCreateSeriesTopic(
                seriesGroup,
                title
            );

        // =====================================================================
        // SEND
        // =====================================================================

        await this.sendSeries(
            seriesGroup,
            threadId,
            series,
            post
        );

        // =====================================================================
        // CONFIRMATION
        // =====================================================================

        await this.safeReply(
            ctx,
            [
                "✅ <b>Serie verarbeitet</b>",
                "",
                `📺 ${this.escapeHtml(
                    title
                )}`,
                `🎬 ${this.escapeHtml(
                    this.formatSeasonEpisode(
                        series.season,
                        series.episode
                    )
                )}`,
                `📌 Topic: ${
                    threadId !== undefined
                        ? threadId
                        : "Allgemein"
                }`
            ].join(
                "\n"
            )
        );

        console.log(
            `✅ Serie vollständig verarbeitet: ${title}`
        );
    }

    // =========================================================================
    // TMDB
    // =========================================================================

    private async findTMDB(
        title: string,
        type: "movie" | "tv",
        year?: number
    ): Promise<any> {

        const client:
            any =
            TMDBClient as any;

        /*
         * Support both the current search methods and the newer unified
         * find() method.
         */

        if (
            typeof client.find ===
            "function"
        ) {

            return await client.find(
                title,
                type,
                year
            );
        }

        if (
            type === "movie" &&
            typeof client.searchMovie ===
                "function"
        ) {

            return await client.searchMovie(
                title
            );
        }

        if (
            type === "tv" &&
            typeof client.searchSeries ===
                "function"
        ) {

            return await client.searchSeries(
                title
            );
        }

        return undefined;
    }

    // =========================================================================
    // MOVIE DESTINATION
    // =========================================================================

    private resolveMovieDestination(
        category: string
    ): TelegramDestination | undefined {

        const normalized =
            String(
                category || "general"
            )
                .toLowerCase()
                .trim();

        const mapping:
            Record<
                string,
                string
            > = {

            action:
                "ACTION_GROUP_ID",

            adventure:
                "ACTION_GROUP_ID",

            horror:
                "HORROR_GROUP_ID",

            thriller:
                "HORROR_GROUP_ID",

            scifi:
                "SCIFI_GROUP_ID",

            "sci-fi":
                "SCIFI_GROUP_ID",

            fantasy:
                "SCIFI_GROUP_ID",

            drama:
                "DRAMA_GROUP_ID",

            romance:
                "DRAMA_GROUP_ID",

            comedy:
                "COMEDY_GROUP_ID",

            family:
                "COMEDY_GROUP_ID",

            animation:
                "ANIMATION_GROUP_ID",

            anime:
                "ANIMATION_GROUP_ID",

            crime:
                "CRIME_GROUP_ID",

            mystery:
                "CRIME_GROUP_ID",

            documentary:
                "DOCUMENTARY_GROUP_ID",

            biography:
                "DOCUMENTARY_GROUP_ID",

            kids:
                "KIDS_GROUP_ID",

            children:
                "KIDS_GROUP_ID",

            general:
                "GENERAL_GROUP_ID"
        };

        const specificVariable =
            mapping[
                normalized
            ];

        if (
            specificVariable
        ) {

            const specificGroup =
                this.getEnv(
                    specificVariable
                );

            if (
                specificGroup
            ) {

                return {

                    chatId:
                        specificGroup,

                    category:
                        normalized,

                    categoryTitle:
                        this.categoryTitle(
                            normalized
                        )
                };
            }
        }

        // =====================================================================
        // MOVIE FALLBACK
        // =====================================================================

        const movieGroup =
            this.getEnv(
                "MOVIE_GROUP_ID"
            );

        if (
            movieGroup
        ) {

            return {

                chatId:
                    movieGroup,

                category:
                    normalized,

                categoryTitle:
                    this.categoryTitle(
                        normalized
                    )
            };
        }

        // =====================================================================
        // GENERAL FALLBACK
        // =====================================================================

        const generalGroup =
            this.getEnv(
                "GENERAL_GROUP_ID"
            );

        if (
            generalGroup
        ) {

            return {

                chatId:
                    generalGroup,

                category:
                    "general",

                categoryTitle:
                    "📚 Allgemein"
            };
        }

        return undefined;
    }

    // =========================================================================
    // CATEGORY TITLE
    // =========================================================================

    private categoryTitle(
        category: string
    ): string {

        const titles:
            Record<
                string,
                string
            > = {

            action:
                "🎬 Action & Abenteuer",

            adventure:
                "🎬 Action & Abenteuer",

            horror:
                "👻 Horror & Thriller",

            thriller:
                "👻 Horror & Thriller",

            scifi:
                "🤖 Sci-Fi & Fantasy",

            "sci-fi":
                "🤖 Sci-Fi & Fantasy",

            fantasy:
                "🤖 Sci-Fi & Fantasy",

            drama:
                "🎭 Drama & Romantik",

            romance:
                "🎭 Drama & Romantik",

            comedy:
                "😂 Komödie & Familienfilme",

            family:
                "😂 Komödie & Familienfilme",

            animation:
                "🎨 Animation & Anime",

            anime:
                "🎨 Animation & Anime",

            crime:
                "🕵️ Mystery / Krimi",

            mystery:
                "🕵️ Mystery / Krimi",

            documentary:
                "🏞️ Dokumentationen / Biografien",

            biography:
                "🏞️ Dokumentationen / Biografien",

            kids:
                "🧸 Kinderfilme",

            children:
                "🧸 Kinderfilme",

            general:
                "📚 Allgemein"
        };

        return (
            titles[
                category
            ] ||
            "📚 Allgemein"
        );
    }

    // =========================================================================
    // SEND MOVIE
    // =========================================================================

    private async sendMovie(
        destination: TelegramDestination,
        movie: any,
        post: any
    ): Promise<void> {

        const keyboard =
            this.buildInlineKeyboard(
                post.buttons || []
            );

        try {

            // =================================================================
            // POSTER
            // =================================================================

            if (
                post.posterUrl
            ) {

                await this.bot.telegram.sendPhoto(
                    destination.chatId,
                    post.posterUrl,
                    {
                        caption:
                            post.caption,

                        parse_mode:
                            "HTML",

                        ...keyboard
                    }
                );

            } else {

                await this.bot.telegram.sendMessage(
                    destination.chatId,
                    post.caption,
                    {
                        parse_mode:
                            "HTML",

                        ...keyboard
                    }
                );
            }

            // =================================================================
            // FILE
            // =================================================================

            await this.bot.telegram.sendDocument(
                destination.chatId,
                movie.fileId,
                {
                    caption:
                        [
                            `🎬 <b>${this.escapeHtml(
                                String(
                                    movie.title
                                )
                            )}</b>`,

                            movie.archiveId ||
                            movie.libraryId
                                ? `🆔 <code>${this.escapeHtml(
                                    String(
                                        movie.archiveId ||
                                        movie.libraryId
                                    )
                                )}</code>`
                                : ""
                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                "\n"
                            ),

                    parse_mode:
                        "HTML"
                }
            );

            console.log(
                `📤 Film gesendet → ${destination.chatId}`
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Fehler beim Senden des Films:",
                error
            );

            throw error;
        }
    }

    // =========================================================================
    // SEND SERIES
    // =========================================================================

    private async sendSeries(
        chatId: string,
        threadId: number | undefined,
        series: any,
        post: any
    ): Promise<void> {

        const keyboard =
            this.buildInlineKeyboard(
                post.buttons || []
            );

        const topicOptions:
            Record<
                string,
                any
            > =
            {};

        if (
            threadId !== undefined
        ) {

            topicOptions.message_thread_id =
                threadId;
        }

        try {

            // =================================================================
            // POST
            // =================================================================

            if (
                post.posterUrl
            ) {

                await this.bot.telegram.sendPhoto(
                    chatId,
                    post.posterUrl,
                    {
                        caption:
                            post.caption,

                        parse_mode:
                            "HTML",

                        ...keyboard,

                        ...topicOptions
                    }
                );

            } else {

                await this.bot.telegram.sendMessage(
                    chatId,
                    post.caption,
                    {
                        parse_mode:
                            "HTML",

                        ...keyboard,

                        ...topicOptions
                    }
                );
            }

            // =================================================================
            // EPISODE FILE
            // =================================================================

            await this.bot.telegram.sendDocument(
                chatId,
                series.fileId,
                {
                    caption:
                        [
                            `📺 <b>${this.escapeHtml(
                                String(
                                    series.title
                                )
                            )}</b>`,

                            `🎬 ${this.escapeHtml(
                                this.formatSeasonEpisode(
                                    series.season,
                                    series.episode
                                )
                            )}`,

                            series.episodeId
                                ? `🆔 <code>${this.escapeHtml(
                                    String(
                                        series.episodeId
                                    )
                                )}</code>`
                                : ""
                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                "\n"
                            ),

                    parse_mode:
                        "HTML",

                    ...topicOptions
                }
            );

            console.log(
                `📤 Episode gesendet → ${chatId} / Topic ${
                    threadId ??
                    "Allgemein"
                }`
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Fehler beim Senden der Serie:",
                error
            );

            throw error;
        }
    }

    // =========================================================================
    // INLINE KEYBOARD
    // =========================================================================

    private buildInlineKeyboard(
        buttons: Array<
            Array<{
                text: string;
                callbackData?: string;
                url?: string;
            }>
        >
    ): ReturnType<
        typeof Markup.inlineKeyboard
    > {

        const telegramButtons =
            buttons.map(
                row =>
                    row.map(
                        button => {

                            if (
                                button.url
                            ) {

                                return Markup.button.url(
                                    button.text,
                                    button.url
                                );
                            }

                            return Markup.button.callback(
                                button.text,
                                button.callbackData ||
                                "noop"
                            );
                        }
                    )
            );

        /*
         * IMPORTANT:
         *
         * We return Markup.inlineKeyboard(...)
         * instead of a raw any[][].
         *
         * This fixes the TypeScript errors:
         *
         * Type 'any[][]' is not assignable to
         * type 'InlineKeyboardMarkup ...'
         */

        return Markup.inlineKeyboard(
            telegramButtons
        );
    }

    // =========================================================================
    // CREATE / FIND TOPIC
    // =========================================================================

    private async getOrCreateSeriesTopic(
        chatId: string,
        title: string
    ): Promise<number | undefined> {

        try {

            const manager:
                any =
                TopicManager as any;

            // =================================================================
            // MEMORY LOOKUP
            // =================================================================

            if (
                typeof manager.getThreadId ===
                "function"
            ) {

                const existing =
                    manager.getThreadId(
                        chatId,
                        title
                    );

                if (
                    existing !== undefined &&
                    existing !== null
                ) {

                    console.log(
                        `📌 Topic gefunden: ${title} → ${existing}`
                    );

                    return Number(
                        existing
                    );
                }
            }

            // =================================================================
            // CREATE TOPIC
            // =================================================================

            const topicName =
                this.cleanTopicName(
                    title
                );

            const result =
                await this.bot.telegram.createForumTopic(
                    chatId,
                    topicName
                );

            const threadId =
                result.message_thread_id;

            // =================================================================
            // REGISTER
            // =================================================================

            if (
                typeof manager.registerTopic ===
                "function"
            ) {

                manager.registerTopic(
                    chatId,
                    title,
                    threadId,
                    topicName
                );
            }

            console.log(
                `📌 Neues Topic erstellt: ${topicName} → ${threadId}`
            );

            return threadId;

        } catch (
            error
        ) {

            console.error(
                "❌ Topic konnte nicht erstellt werden:",
                error
            );

            /*
             * Topics require:
             *
             * - Supergroup
             * - Forum mode
             * - Bot admin permissions
             *
             * If any of these are missing, use the general chat.
             */

            return undefined;
        }
    }

    // =========================================================================
    // CLEAN TOPIC NAME
    // =========================================================================

    private cleanTopicName(
        title: string
    ): string {

        return String(
            title || "Serie"
        )
            .replace(
                /[\r\n\t]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .slice(
                0,
                128
            ) ||
            "Serie";
    }

    // =========================================================================
    // MOVIES
    // =========================================================================

    private async handleMovies(
        ctx: Context
    ): Promise<void> {

        try {

            const movies =
                await LibraryRepository.getAll(
                    20,
                    0
                );

            const filtered =
                (movies as any[]).filter(
                    movie =>
                        String(
                            movie.type ||
                            ""
                        ).toUpperCase() !==
                        "SERIES"
                );

            if (
                filtered.length ===
                0
            ) {

                await this.safeReply(
                    ctx,
                    "🎬 Noch keine Filme im Archiv."
                );

                return;
            }

            const buttons =
                filtered.map(
                    movie => [

                        Markup.button.callback(
                            `🎬 ${String(
                                movie.title
                            )}`,
                            `movie_${movie.id}`
                        )

                    ]
                );

            await ctx.reply(
                "🎬 <b>Filme</b>",
                {
                    parse_mode:
                        "HTML",

                    ...Markup.inlineKeyboard(
                        buttons
                    )
                }
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Filme konnten nicht geladen werden:",
                error
            );

            await this.safeReply(
                ctx,
                "❌ Filme konnten nicht geladen werden."
            );
        }
    }

    // =========================================================================
    // SERIES
    // =========================================================================

    private async handleSeries(
        ctx: Context
    ): Promise<void> {

        try {

            const items =
                await LibraryRepository.getAll(
                    100,
                    0
                );

            const series =
                (items as any[]).filter(
                    item =>
                        String(
                            item.type ||
                            ""
                        ).toUpperCase() ===
                        "SERIES"
                );

            if (
                series.length ===
                0
            ) {

                await this.safeReply(
                    ctx,
                    "📺 Noch keine Serien im Archiv."
                );

                return;
            }

            const buttons =
                series.map(
                    item => [

                        Markup.button.callback(
                            `📺 ${String(
                                item.title
                            )}`,
                            `series_${item.id}`
                        )

                    ]
                );

            await ctx.reply(
                "📺 <b>Serien</b>",
                {
                    parse_mode:
                        "HTML",

                    ...Markup.inlineKeyboard(
                        buttons
                    )
                }
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Serien konnten nicht geladen werden:",
                error
            );

            await this.safeReply(
                ctx,
                "❌ Serien konnten nicht geladen werden."
            );
        }
    }

    // =========================================================================
    // TRENDING
    // =========================================================================

    private async handleTrending(
        ctx: Context
    ): Promise<void> {

        try {

            const movies =
                await LibraryRepository.getTrending();

            if (
                movies.length ===
                0
            ) {

                await this.safeReply(
                    ctx,
                    "🔥 Noch keine Trending-Inhalte vorhanden."
                );

                return;
            }

            const buttons =
                (movies as any[]).map(
                    movie => [

                        Markup.button.callback(
                            `🔥 ${String(
                                movie.title
                            )}`,
                            `movie_${movie.id}`
                        )

                    ]
                );

            await ctx.reply(
                "🔥 <b>Trending</b>",
                {
                    parse_mode:
                        "HTML",

                    ...Markup.inlineKeyboard(
                        buttons
                    )
                }
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Trending Fehler:",
                error
            );

            await this.safeReply(
                ctx,
                "❌ Trending konnte nicht geladen werden."
            );
        }
    }

    // =========================================================================
    // FAVORITES
    // =========================================================================

    private async handleFavorites(
        ctx: Context
    ): Promise<void> {

        try {

            const movies =
                await LibraryRepository.getFavorites();

            if (
                movies.length ===
                0
            ) {

                await this.safeReply(
                    ctx,
                    "⭐ Noch keine Favoriten."
                );

                return;
            }

            const buttons =
                (movies as any[]).map(
                    movie => [

                        Markup.button.callback(
                            `⭐ ${String(
                                movie.title
                            )}`,
                            `movie_${movie.id}`
                        )

                    ]
                );

            await ctx.reply(
                "⭐ <b>Favoriten</b>",
                {
                    parse_mode:
                        "HTML",

                    ...Markup.inlineKeyboard(
                        buttons
                    )
                }
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Favoriten Fehler:",
                error
            );

            await this.safeReply(
                ctx,
                "❌ Favoriten konnten nicht geladen werden."
            );
        }
    }

    // =========================================================================
    // FIND COMMAND
    // =========================================================================

    private async handleFindCommand(
        ctx: Context
    ): Promise<void> {

        const message:
            any =
            (ctx as any).message;

        const text =
            String(
                message?.text ||
                ""
            );

        const query =
            text
                .replace(
                    /^\/find(?:@\w+)?/i,
                    ""
                )
                .trim();

        if (
            !query
        ) {

            await this.safeReply(
                ctx,
                [
                    "🔎 <b>Library Of Legends Suche</b>",
                    "",
                    "Verwendung:",
                    "<code>/find Superman</code>"
                ].join(
                    "\n"
                )
            );

            return;
        }

        await this.performSearch(
            ctx,
            query
        );
    }

    // =========================================================================
    // SEARCH COMMAND
    // =========================================================================

    private async handleSearchCommand(
        ctx: Context
    ): Promise<void> {

        const message:
            any =
            (ctx as any).message;

        const text =
            String(
                message?.text ||
                ""
            );

        const query =
            text
                .replace(
                    /^\/search(?:@\w+)?/i,
                    ""
                )
                .trim();

        if (
            !query
        ) {

            await this.safeReply(
                ctx,
                "🔎 Verwendung: <code>/search TITEL</code>"
            );

            return;
        }

        await this.performSearch(
            ctx,
            query
        );
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    private async performSearch(
        ctx: Context,
        query: string
    ): Promise<void> {

        try {

            const results =
                await LibraryRepository.search(
                    query
                );

            if (
                results.length ===
                0
            ) {

                await this.safeReply(
                    ctx,
                    `🔎 Keine Treffer für <b>${this.escapeHtml(
                        query
                    )}</b>.`
                );

                return;
            }

            const buttons =
                (results as any[]).map(
                    item => [

                        Markup.button.callback(
                            `🎬 ${String(
                                item.title
                            )}`,
                            `movie_${item.id}`
                        )

                    ]
                );

            await ctx.reply(
                [
                    "🔎 <b>Suchergebnisse</b>",
                    "",
                    `Suchbegriff: <code>${this.escapeHtml(
                        query
                    )}</code>`
                ].join(
                    "\n"
                ),
                {
                    parse_mode:
                        "HTML",

                    ...Markup.inlineKeyboard(
                        buttons
                    )
                }
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Suchfehler:",
                error
            );

            await this.safeReply(
                ctx,
                "❌ Suche fehlgeschlagen."
            );
        }
    }

    // =========================================================================
    // MOVIE ACTION
    // =========================================================================

    private async handleMovieAction(
        ctx: Context
    ): Promise<void> {

        const callback:
            any =
            (ctx as any).callbackQuery;

        if (
            !callback?.data
        ) {

            return;
        }

        const id =
            String(
                callback.data
            ).replace(
                /^movie_/,
                ""
            );

        try {

            const movies =
                await LibraryRepository.getAll(
                    100,
                    0
                );

            const movie =
                (movies as any[]).find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            id
                        )
                );

            if (
                !movie
            ) {

                await ctx.answerCbQuery(
                    "❌ Film nicht gefunden."
                );

                return;
            }

            await LibraryRepository.increaseViews(
                id
            );

            await ctx.answerCbQuery(
                "🎬 Film wird geöffnet..."
            );

            await ctx.replyWithDocument(
                movie.file_id,
                {
                    caption:
                        `🎬 <b>${this.escapeHtml(
                            String(
                                movie.title
                            )
                        )}</b>`,

                    parse_mode:
                        "HTML",

                    ...Markup.inlineKeyboard(
                        [
                            [
                                Markup.button.callback(
                                    "⭐ Favorit",
                                    `fav_${id}`
                                )
                            ]
                        ]
                    )
                }
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Movie Action Fehler:",
                error
            );

            await ctx.answerCbQuery(
                "❌ Fehler beim Öffnen."
            );
        }
    }

    // =========================================================================
    // FAVORITE ACTION
    // =========================================================================

    private async handleFavoriteAction(
        ctx: Context
    ): Promise<void> {

        const callback:
            any =
            (ctx as any).callbackQuery;

        if (
            !callback?.data
        ) {

            return;
        }

        const id =
            String(
                callback.data
            ).replace(
                /^fav_/,
                ""
            );

        try {

            await LibraryRepository.toggleFavorite(
                id
            );

            await ctx.answerCbQuery(
                "⭐ Favorit gespeichert."
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Favoritenfehler:",
                error
            );

            await ctx.answerCbQuery(
                "❌ Favorit konnte nicht gespeichert werden."
            );
        }
    }

    // =========================================================================
    // SERIES ACTION
    // =========================================================================

    private async handleSeriesAction(
        ctx: Context
    ): Promise<void> {

        const callback:
            any =
            (ctx as any).callbackQuery;

        if (
            !callback?.data
        ) {

            return;
        }

        const id =
            String(
                callback.data
            ).replace(
                /^series_/,
                ""
            );

        await ctx.answerCbQuery(
            `📺 Serie ${id} geöffnet.`
        );
    }

    // =========================================================================
    // FALLBACK MOVIE CAPTION
    // =========================================================================

    private buildMovieFallbackCaption(
        movie: any,
        tmdb: any,
        categoryTitle: string
    ): string {

        return [

            `🎬 <b>${this.escapeHtml(
                String(
                    tmdb?.title ||
                    movie.title ||
                    "Unbekannter Film"
                )
            )}</b>`,

            movie.year
                ? `📅 Jahr: ${movie.year}`
                : "",

            movie.genres?.length
                ? `🏷️ Genre: ${this.escapeHtml(
                    movie.genres.join(
                        " • "
                    )
                )}`
                : "",

            tmdb?.rating !== undefined
                ? `⭐ Bewertung: ${tmdb.rating}`
                : "",

            tmdb?.overview
                ? `📖 ${this.escapeHtml(
                    this.limitText(
                        tmdb.overview,
                        1000
                    )
                )}`
                : "",

            "━━━━━━━━━━━━━━━━━━",

            "🗃️ <b>Library Of Legends</b>",

            `📂 Kategorie: ${this.escapeHtml(
                categoryTitle
            )}`

        ]
            .filter(
                Boolean
            )
            .join(
                "\n"
            );
    }

    // =========================================================================
    // FALLBACK SERIES CAPTION
    // =========================================================================

    private buildSeriesFallbackCaption(
        series: any,
        tmdb: any,
        categoryTitle: string
    ): string {

        return [

            `📺 <b>${this.escapeHtml(
                String(
                    tmdb?.title ||
                    series.title ||
                    "Unbekannte Serie"
                )
            )}</b>`,

            this.formatSeasonEpisode(
                series.season,
                series.episode
            )
                ? `🎬 ${this.formatSeasonEpisode(
                    series.season,
                    series.episode
                )}`
                : "",

            series.genres?.length
                ? `🏷️ Genre: ${this.escapeHtml(
                    series.genres.join(
                        " • "
                    )
                )}`
                : "",

            tmdb?.rating !== undefined
                ? `⭐ Bewertung: ${tmdb.rating}`
                : "",

            tmdb?.overview
                ? `📖 ${this.escapeHtml(
                    this.limitText(
                        tmdb.overview,
                        1000
                    )
                )}`
                : "",

            "━━━━━━━━━━━━━━━━━━",

            "🗃️ <b>Library Of Legends</b>",

            `📂 Kategorie: ${this.escapeHtml(
                categoryTitle
            )}`

        ]
            .filter(
                Boolean
            )
            .join(
                "\n"
            );
    }

    // =========================================================================
    // SAFE REPLY
    // =========================================================================

    private async safeReply(
        ctx: Context,
        text: string
    ): Promise<void> {

        try {

            await ctx.reply(
                text,
                {
                    parse_mode:
                        "HTML"
                }
            );

        } catch (
            error
        ) {

            console.error(
                "⚠️ Telegram Reply Fehler:",
                error
            );
        }
    }

    // =========================================================================
    // GET ENV
    // =========================================================================

    private getEnv(
        name: string
    ): string | undefined {

        const value =
            process.env[
                name
            ];

        if (
            !value
        ) {

            return undefined;
        }

        const result =
            String(
                value
            ).trim();

        return result ||
            undefined;
    }

    // =========================================================================
    // GET CHAT ID
    // =========================================================================

    private getChatId(
        ctx: Context
    ): string | undefined {

        const chat:
            any =
            (ctx as any).chat;

        if (
            !chat
        ) {

            return undefined;
        }

        return String(
            chat.id
        );
    }

    // =========================================================================
    // GET MESSAGE ID
    // =========================================================================

    private getMessageId(
        ctx: Context
    ): number | undefined {

        const message:
            any =
            (ctx as any).message;

        return message?.message_id;
    }

    // =========================================================================
    // FORMAT SEASON / EPISODE
    // =========================================================================

    private formatSeasonEpisode(
        season?: number,
        episode?: number
    ): string {

        if (
            season === undefined &&
            episode === undefined
        ) {

            return "";
        }

        if (
            season !== undefined &&
            episode !== undefined
        ) {

            return `S${String(
                season
            ).padStart(
                2,
                "0"
            )}E${String(
                episode
            ).padStart(
                2,
                "0"
            )}`;
        }

        if (
            season !== undefined
        ) {

            return `S${String(
                season
            ).padStart(
                2,
                "0"
            )}`;
        }

        return `E${String(
            episode
        ).padStart(
            2,
            "0"
        )}`;
    }

    // =========================================================================
    // LIMIT TEXT
    // =========================================================================

    private limitText(
        value: string,
        maxLength: number
    ): string {

        const text =
            String(
                value || ""
            ).trim();

        if (
            text.length <=
            maxLength
        ) {

            return text;
        }

        return (
            text
                .slice(
                    0,
                    maxLength - 1
                )
                .trim() +
            "…"
        );
    }

    // =========================================================================
    // ESCAPE HTML
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