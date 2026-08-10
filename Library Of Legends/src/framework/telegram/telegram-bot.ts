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

Version.............: 10.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central Telegram integration for Library Of Legends.

Responsibilities:

- Start Telegram bot
- Receive Telegram videos
- Receive Telegram documents
- Detect movies
- Detect series
- Parse filenames
- Detect genres
- Route movies to genre groups
- Route series to the series group
- Create and reuse series topics
- Generate archive IDs
- Store Telegram File-IDs
- Query TMDB
- Build movie posts
- Build series posts
- Provide Netflix-style start menu
- Provide search
- Provide /find
- Provide trending
- Provide favorites
- Track views
- Handle duplicate media
- Never crash the complete bot because of one media error

Environment variables:

TOKEN
DATABASE_URL
TMDB_API_KEY

Telegram destination variables:

MOVIE_GROUP_ID
SERIES_GROUP_ID

Optional genre-specific groups:

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
    Update
} from "telegraf/types";

import {
    LibraryRepository
} from "../../infrastructure/database/library-repository";

import {
    FilenameParser,
    ParsedMedia
} from "../../domain/detection/filename-parser";

import {
    MediaTypeDetector
} from "../../domain/detection/media-type-detector";

import {
    GenreDetector
} from "../../domain/detection/genre-detector";

import {
    GenreRouter,
    GenreRoute
} from "../../application/routing/genre-router";

import {
    TopicManager
} from "../../application/routing/topic-manager";

import {
    MovieCatalog,
    MovieCatalogEntry
} from "../../domain/catalog/movie-catalog";

import {
    SeriesCatalog,
    SeriesCatalogEntry
} from "../../domain/catalog/series-catalog";

import {
    TMDBClient,
    TMDBMetadata
} from "../../infrastructure/tmdb/tmdb-client";

import {
    MoviePostBuilder
} from "../../application/post-builder/movie-post-builder";

import {
    SeriesPostBuilder
} from "../../application/post-builder/series-post-builder";

/**
 * Generic Telegram media information.
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
    // TELEGRAM BOT
    // =========================================================================

    private readonly bot:
        Telegraf<Context>;

    // =========================================================================
    // TOKEN
    // =========================================================================

    private readonly token:
        string;

    // =========================================================================
    // STARTED
    // =========================================================================

    private started =
        false;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(
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

                await ctx.reply(
                    this.buildHelpText()
                );
            }
        );

        // =====================================================================
        // FIND COMMAND
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
        // SEARCH COMMAND
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
        // INLINE MOVIE
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
        // INLINE FAVORITE
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
        // INLINE SERIES
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
        // CALLBACK ERROR HANDLER
        // =====================================================================

        this.bot.catch(
            async (
                error,
                ctx
            ) => {

                console.error(
                    "❌ TelegramBot Fehler:",
                    error
                );

                try {

                    await ctx.reply(
                        "❌ Bei der Verarbeitung ist ein Fehler aufgetreten."
                    );

                } catch {
                    // Telegram context may no longer be available.
                }
            }
        );
    }

    // =========================================================================
    // START
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
                "❌ Fehler beim Stoppen des TelegramBots:",
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
                "Hier kannst du Filme und Serien durchsuchen.",
                "",
                "🔎 Nutze <code>/find TITEL</code> für eine Suche.",
                "",
                "━━━━━━━━━━━━━━━━━━"
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
            "📚 Befehle:",
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
                    "⚠️ Keine unterstützte Mediendatei gefunden."
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
            // ROUTE
            // =================================================================

            if (
                parsed.type ===
                "SERIES"
            ) {

                await this.processSeries(
                    ctx,
                    media,
                    parsed
                );

            } else {

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

            try {

                await ctx.reply(
                    "❌ Die Datei konnte nicht verarbeitet werden."
                );

            } catch {
                // Ignore secondary Telegram error.
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
            ctx.message;

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

            return {

                fileId:
                    message.video.file_id,

                fileName:
                    message.video.file_name ||
                    `video_${message.video.file_unique_id}.mp4`,

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
        parsed: ParsedMedia
    ): Promise<void> {

        console.log(
            `🎬 Film erkannt: ${parsed.title}`
        );

        // =====================================================================
        // GENRE
        // =====================================================================

        const genres =
            GenreDetector.detect(
                parsed.title
            );

        const route:
            GenreRoute =
            GenreRouter.route(
                genres
            );

        console.log(
            `🏷️ Genre: ${route.primaryGenre}`
        );

        console.log(
            `📂 Kategorie: ${route.categoryTitle}`
        );

        // =====================================================================
        // CATALOG
        // =====================================================================

        const movie:
            MovieCatalogEntry =
            MovieCatalog.createFromParsed(
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

        console.log(
            `🗃️ Archive-ID: ${movie.archiveId}`
        );

        // =====================================================================
        // TMDB
        // =====================================================================

        let tmdb:
            TMDBMetadata | undefined;

        try {

            tmdb =
                await TMDBClient.find(
                    movie.title,
                    "movie",
                    movie.year
                );

            if (
                tmdb
            ) {

                console.log(
                    `🎞️ TMDB gefunden: ${tmdb.title} (${tmdb.id})`
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

            await this.saveMovie(
                movie
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Datenbankfehler:",
                error
            );

            /*
             * Do NOT stop the entire Telegram processing.
             *
             * The media can still be routed and posted.
             */
        }

        // =====================================================================
        // POST
        // =====================================================================

        const post =
            MoviePostBuilder.buildFull(
                movie,
                tmdb
            );

        // =====================================================================
        // DESTINATION
        // =====================================================================

        const destination =
            this.resolveMovieDestination(
                route
            );

        if (
            !destination
        ) {

            console.error(
                "❌ Keine Movie-Zielgruppe konfiguriert."
            );

            await this.safeReply(
                ctx,
                [
                    "⚠️ <b>Film verarbeitet</b>",
                    "",
                    `🎬 ${this.escapeHtml(
                        movie.title
                    )}`,
                    `🆔 ${movie.archiveId}`,
                    "",
                    "❌ Keine Zielgruppe konfiguriert."
                ].join(
                    "\n"
                )
            );

            return;
        }

        // =====================================================================
        // SEND
        // =====================================================================

        await this.sendMoviePost(
            ctx,
            destination,
            movie,
            post
        );

        console.log(
            `✅ Film vollständig verarbeitet: ${movie.title}`
        );
    }

    // =========================================================================
    // PROCESS SERIES
    // =========================================================================

    private async processSeries(
        ctx: Context,
        media: TelegramMedia,
        parsed: ParsedMedia
    ): Promise<void> {

        console.log(
            `📺 Serie erkannt: ${parsed.title}`
        );

        // =====================================================================
        // GENRE
        // =====================================================================

        const genres =
            GenreDetector.detect(
                parsed.title
            );

        const route:
            GenreRoute =
            GenreRouter.route(
                genres
            );

        console.log(
            `🏷️ Genre: ${route.primaryGenre}`
        );

        console.log(
            `📂 Kategorie: ${route.categoryTitle}`
        );

        // =====================================================================
        // CATALOG
        // =====================================================================

        const series:
            SeriesCatalogEntry =
            SeriesCatalog.createFromParsed(
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

        console.log(
            `🆔 Serien-ID: ${series.seriesId}`
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
            TMDBMetadata | undefined;

        try {

            tmdb =
                await TMDBClient.find(
                    series.title,
                    "tv"
                );

            if (
                tmdb
            ) {

                console.log(
                    `🎞️ TMDB gefunden: ${tmdb.title} (${tmdb.id})`
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

            await this.saveSeries(
                series
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

        const post =
            SeriesPostBuilder.buildFull(
                series,
                tmdb
            );

        // =====================================================================
        // DESTINATION
        // =====================================================================

        const seriesChatId =
            this.getEnv(
                "SERIES_GROUP_ID"
            );

        if (
            !seriesChatId
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
                seriesChatId,
                series.title
            );

        // =====================================================================
        // SEND SERIES
        // =====================================================================

        await this.sendSeriesPost(
            seriesChatId,
            threadId,
            series,
            post
        );

        console.log(
            `✅ Serie vollständig verarbeitet: ${series.title}`
        );
    }

    // =========================================================================
    // SAVE MOVIE
    // =========================================================================

    private async saveMovie(
        movie: MovieCatalogEntry
    ): Promise<void> {

        await LibraryRepository.save(

            movie.title,

            movie.originalFileName,

            "MOVIE",

            movie.fileId
        );

        console.log(
            "💾 Film in Datenbank gespeichert."
        );
    }

    // =========================================================================
    // SAVE SERIES
    // =========================================================================

    private async saveSeries(
        series: SeriesCatalogEntry
    ): Promise<void> {

        await LibraryRepository.save(

            series.title,

            series.originalFileName,

            "SERIES",

            series.fileId
        );

        console.log(
            "💾 Serie in Datenbank gespeichert."
        );
    }

    // =========================================================================
    // MOVIE DESTINATION
    // =========================================================================

    private resolveMovieDestination(
        route: GenreRoute
    ): TelegramDestination | undefined {

        const envName =
            this.getGenreEnvironmentName(
                route.category
            );

        const specificGroup =
            this.getEnv(
                envName
            );

        /*
         * Prefer genre-specific group.
         */

        if (
            specificGroup
        ) {

            return {

                chatId:
                    specificGroup,

                category:
                    route.category,

                categoryTitle:
                    route.categoryTitle
            };
        }

        /*
         * Fallback to general movie group.
         */

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
                    route.category,

                categoryTitle:
                    route.categoryTitle
            };
        }

        /*
         * Final fallback.
         */

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
    // ENVIRONMENT NAME
    // =========================================================================

    private getGenreEnvironmentName(
        category: string
    ): string {

        const mapping:
            Record<string, string> = {

            action:
                "ACTION_GROUP_ID",

            horror:
                "HORROR_GROUP_ID",

            scifi:
                "SCIFI_GROUP_ID",

            drama:
                "DRAMA_GROUP_ID",

            comedy:
                "COMEDY_GROUP_ID",

            animation:
                "ANIMATION_GROUP_ID",

            crime:
                "CRIME_GROUP_ID",

            documentary:
                "DOCUMENTARY_GROUP_ID",

            kids:
                "KIDS_GROUP_ID",

            general:
                "GENERAL_GROUP_ID"
        };

        return (
            mapping[
                category
            ] ||
            "GENERAL_GROUP_ID"
        );
    }

    // =========================================================================
    // SEND MOVIE
    // =========================================================================

    private async sendMoviePost(
        ctx: Context,
        destination: TelegramDestination,
        movie: MovieCatalogEntry,
        post: ReturnType<
            typeof MoviePostBuilder.buildFull
        >
    ): Promise<void> {

        try {

            const buttons =
                this.convertButtons(
                    post.buttons
                );

            /*
             * Prefer poster when available.
             */

            if (
                post.posterUrl
            ) {

                await ctx.telegram.sendPhoto(
                    destination.chatId,
                    post.posterUrl,
                    {
                        caption:
                            post.caption,

                        parse_mode:
                            "HTML",

                        reply_markup:
                            buttons
                    }
                );

                /*
                 * Send the actual file separately.
                 */

                await ctx.telegram.sendDocument(
                    destination.chatId,
                    movie.fileId,
                    {
                        caption:
                            `🎬 <b>${this.escapeHtml(
                                movie.title
                            )}</b>\n🆔 <code>${this.escapeHtml(
                                movie.archiveId
                            )}</code>`,

                        parse_mode:
                            "HTML"
                    }
                );

            } else {

                await ctx.telegram.sendDocument(
                    destination.chatId,
                    movie.fileId,
                    {
                        caption:
                            post.caption,

                        parse_mode:
                            "HTML",

                        reply_markup:
                            buttons
                    }
                );
            }

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

            await this.safeReply(
                ctx,
                [
                    "⚠️ Film wurde verarbeitet, konnte aber nicht in die Zielgruppe gesendet werden.",
                    "",
                    `🎬 ${this.escapeHtml(
                        movie.title
                    )}`
                ].join(
                    "\n"
                )
            );
        }
    }

    // =========================================================================
    // SEND SERIES
    // =========================================================================

    private async sendSeriesPost(
        chatId: string,
        threadId: number | undefined,
        series: SeriesCatalogEntry,
        post: ReturnType<
            typeof SeriesPostBuilder.buildFull
        >
    ): Promise<void> {

        const buttons =
            this.convertButtons(
                post.buttons
            );

        const extra:
            Record<string, unknown> =
            {};

        if (
            threadId !== undefined
        ) {

            extra.message_thread_id =
                threadId;
        }

        try {

            /*
             * Poster first.
             */

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

                        reply_markup:
                            buttons,

                        ...extra
                    } as any
                );

            } else {

                await this.bot.telegram.sendMessage(
                    chatId,
                    post.caption,
                    {
                        parse_mode:
                            "HTML",

                        reply_markup:
                            buttons,

                        ...extra
                    } as any
                );
            }

            /*
             * Actual episode file.
             */

            await this.bot.telegram.sendDocument(
                chatId,
                series.fileId,
                {
                    caption:
                        [
                            `📺 <b>${this.escapeHtml(
                                series.title
                            )}</b>`,

                            `🎬 ${
                                this.formatSeasonEpisode(
                                    series.season,
                                    series.episode
                                )
                            }`,

                            series.episodeId
                                ? `🆔 <code>${this.escapeHtml(
                                    series.episodeId
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

                    ...extra
                } as any
            );

            console.log(
                `📤 Serie gesendet → ${chatId} / Topic ${threadId ?? "general"}`
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Fehler beim Senden der Serie:",
                error
            );
        }
    }

    // =========================================================================
    // CREATE / FIND TOPIC
    // =========================================================================

    private async getOrCreateSeriesTopic(
        chatId: string,
        seriesTitle: string
    ): Promise<number | undefined> {

        // =====================================================================
        // EXISTING MEMORY TOPIC
        // =====================================================================

        const existing =
            TopicManager.getThreadId(
                chatId,
                seriesTitle
            );

        if (
            existing !== undefined
        ) {

            console.log(
                `📌 Topic gefunden: ${seriesTitle} → ${existing}`
            );

            return existing;
        }

        // =====================================================================
        // CREATE TELEGRAM TOPIC
        // =====================================================================

        try {

            const topicName =
                TopicManager.cleanTopicName(
                    seriesTitle
                );

            const result =
                await this.bot.telegram.createForumTopic(
                    chatId,
                    topicName
                );

            const threadId =
                result.message_thread_id;

            TopicManager.registerTopic(
                chatId,
                seriesTitle,
                threadId,
                topicName
            );

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
             * If topics are disabled or the bot lacks admin permission,
             * return undefined and use the general forum.
             */

            return undefined;
        }
    }

    // =========================================================================
    // MOVIES LIST
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

            if (
                movies.length === 0
            ) {

                await ctx.reply(
                    "🎬 Noch keine Filme im Archiv."
                );

                return;
            }

            const buttons =
                movies.map(
                    (
                        movie: any
                    ) => [

                        Markup.button.callback(
                            `🎬 ${movie.title}`,
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

            await ctx.reply(
                "❌ Filme konnten nicht geladen werden."
            );
        }
    }

    // =========================================================================
    // SERIES LIST
    // =========================================================================

    private async handleSeries(
        ctx: Context
    ): Promise<void> {

        try {

            const series =
                await LibraryRepository.getAll(
                    20,
                    0
                );

            const filtered =
                series.filter(
                    (
                        item: any
                    ) =>
                        String(
                            item.type ||
                            ""
                        ).toUpperCase() ===
                        "SERIES"
                );

            if (
                filtered.length ===
                0
            ) {

                await ctx.reply(
                    "📺 Noch keine Serien im Archiv."
                );

                return;
            }

            const buttons =
                filtered.map(
                    (
                        item: any
                    ) => [

                        Markup.button.callback(
                            `📺 ${item.title}`,
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

            await ctx.reply(
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

                await ctx.reply(
                    "🔥 Noch keine Trending-Inhalte vorhanden."
                );

                return;
            }

            const buttons =
                movies.map(
                    (
                        movie: any
                    ) => [

                        Markup.button.callback(
                            `🔥 ${movie.title}`,
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

            await ctx.reply(
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

                await ctx.reply(
                    "⭐ Noch keine Favoriten."
                );

                return;
            }

            const buttons =
                movies.map(
                    (
                        movie: any
                    ) => [

                        Markup.button.callback(
                            `⭐ ${movie.title}`,
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

            await ctx.reply(
                "❌ Favoriten konnten nicht geladen werden."
            );
        }
    }

    // =========================================================================
    // FIND
    // =========================================================================

    private async handleFindCommand(
        ctx: Context
    ): Promise<void> {

        const text =
            this.getMessageText(
                ctx
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

            await ctx.reply(
                [
                    "🔎 <b>Filmsuche</b>",
                    "",
                    "Verwendung:",
                    "<code>/find Superman</code>"
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

        await this.performSearch(
            ctx,
            query
        );
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    private async handleSearchCommand(
        ctx: Context
    ): Promise<void> {

        const text =
            this.getMessageText(
                ctx
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

            await ctx.reply(
                "🔎 Verwendung: <code>/search TITEL</code>",
                {
                    parse_mode:
                        "HTML"
                }
            );

            return;
        }

        await this.performSearch(
            ctx,
            query
        );
    }

    // =========================================================================
    // PERFORM SEARCH
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

                await ctx.reply(
                    `🔎 Keine Treffer für <b>${this.escapeHtml(
                        query
                    )}</b>.`,
                    {
                        parse_mode:
                            "HTML"
                    }
                );

                return;
            }

            const buttons =
                results.map(
                    (
                        item: any
                    ) => [

                        Markup.button.callback(
                            `🎬 ${item.title}`,
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

            await ctx.reply(
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

        const callback =
            ctx.callbackQuery;

        if (
            !callback ||
            !("data" in callback)
        ) {

            return;
        }

        const id =
            callback.data.replace(
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
                movies.find(
                    (
                        item: any
                    ) =>
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
                            movie.title
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

        const callback =
            ctx.callbackQuery;

        if (
            !callback ||
            !("data" in callback)
        ) {

            return;
        }

        const id =
            callback.data.replace(
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

        await ctx.answerCbQuery(
            "📺 Serienansicht ist vorbereitet."
        );
    }

    // =========================================================================
    // CONVERT BUTTONS
    // =========================================================================

    private convertButtons(
        rows: Array<
            Array<{
                text: string;
                callbackData?: string;
                url?: string;
            }>
        >
    ): any[][] {

        return rows.map(
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
    }

    // =========================================================================
    // GET CHAT ID
    // =========================================================================

    private getChatId(
        ctx: Context
    ): string | undefined {

        const chat =
            ctx.chat;

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
            ctx.message;

        return message?.message_id;
    }

    // =========================================================================
    // GET TEXT
    // =========================================================================

    private getMessageText(
        ctx: Context
    ): string {

        const message:
            any =
            ctx.message;

        return String(
            message?.text ||
            ""
        );
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

        return String(
            value
        ).trim() ||
            undefined;
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

            return "Episode";
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