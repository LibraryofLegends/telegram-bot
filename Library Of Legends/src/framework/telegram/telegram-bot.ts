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

Version.............: 7.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central Telegram controller for the Library Of Legends
automatic media archive.

Responsibilities:

- Receive media files from administrators
- Detect movies and series
- Parse filenames
- Build catalog entries
- Search TMDB
- Generate archive IDs
- Route media to the correct category
- Create series topics
- Store Telegram File-IDs
- Store archive metadata
- Publish standardized archive posts
- Provide the Netflix-style user interface

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

        this.registerTrending();

        this.registerFavorites();

        this.registerSearch();

        this.registerFindCommand();

        this.registerDocumentHandler();

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
    // SEARCH BUTTON
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
    // FIND COMMAND
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

                await this.handleFile(
                    ctx
                );
            }
        );
    }

    // =========================================================================
    // HANDLE FILE
    // =========================================================================

    private async handleFile(
        ctx: any
    ): Promise<void> {

        try {

            const file =
                ctx.message.document;

            const fileName =
                file.file_name ||
                "Unbekannte Datei";

            const fileId =
                file.file_id;

            console.log(
                `📥 Datei empfangen: ${fileName}`
            );

            // =================================================================
            // PARSE
            // =================================================================

            const parsed =
                FilenameParser.parse(
                    fileName
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

                const movie =
                    MovieCatalog.createFromParsed(
                        parsed
                    );

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

                const archiveId =
                    ArchiveIdGenerator.generate(
                        primaryGenre,
                        await this.getNextArchiveNumber()
                    );

                const caption =
                    MoviePostBuilder.build(
                        movie,
                        tmdb,
                        {
                            archiveId
                        }
                    );

                const chatId =
                    route.telegramChatId;

                await LibraryRepository.save(
                    movie.title,
                    fileName,
                    "MOVIE",
                    fileId,
                    {
                        genre:
                            primaryGenre,

                        archiveId,

                        telegramChatId:
                            chatId
                    }
                );

                if (
                    chatId
                ) {

                    const poster =
                        MoviePostBuilder.getPosterUrl(
                            tmdb
                        );

                    if (
                        poster
                    ) {

                        await this.bot.telegram.sendPhoto(
                            chatId,
                            poster,
                            {
                                caption
                            }
                        );

                    } else {

                        await this.bot.telegram.sendMessage(
                            chatId,
                            caption
                        );
                    }

                }

                await ctx.reply(
                    [
                        "✅ *Film archiviert*",
                        "",
                        `🎬 ${movie.title}`,
                        `🗂 ${archiveId}`,
                        `📂 ${route.categoryTitle}`
                    ].join("\n"),
                    {
                        parse_mode: "Markdown"
                    }
                );

                return;
            }

            // =================================================================
            // SERIES
            // =================================================================

            if (
                parsed.type === "SERIES"
            ) {

                const series =
                    SeriesCatalog.createFromParsed(
                        parsed
                    );

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

                const archiveId =
                    ArchiveIdGenerator.generate(
                        primaryGenre,
                        await this.getNextArchiveNumber()
                    );

                const chatId =
                    route.telegramChatId;

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

                const caption =
                    SeriesPostBuilder.build(
                        series,
                        tmdb,
                        {
                            archiveId
                        }
                    );

                await LibraryRepository.save(
                    series.title,
                    fileName,
                    "SERIES",
                    fileId,
                    {
                        genre:
                            primaryGenre,

                        archiveId,

                        telegramChatId:
                            chatId,

                        topicId
                    }
                );

                if (
                    chatId
                ) {

                    const poster =
                        SeriesPostBuilder.getPosterUrl(
                            tmdb
                        );

                    if (
                        poster
                    ) {

                        await this.bot.telegram.sendPhoto(
                            chatId,
                            poster,
                            {
                                caption,

                                ...(topicId
                                    ? {
                                        message_thread_id:
                                            topicId
                                    }
                                    : {})
                            }
                        );

                    } else {

                        await this.bot.telegram.sendMessage(
                            chatId,
                            caption,
                            {
                                ...(topicId
                                    ? {
                                        message_thread_id:
                                            topicId
                                    }
                                    : {})
                            }
                        );
                    }
                }

                await ctx.reply(
                    [
                        "✅ *Serie archiviert*",
                        "",
                        `📺 ${series.title}`,
                        `🗂 ${archiveId}`,
                        `📂 ${route.categoryTitle}`,
                        `📌 Topic: ${topicId ?? "—"}`
                    ].join("\n"),
                    {
                        parse_mode: "Markdown"
                    }
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
                "❌ Die Datei konnte nicht archiviert werden."
            );
        }
    }

    // =========================================================================
    // CALLBACKS
    // =========================================================================

    private registerCallbacks(): void {

        // ---------------------------------------------------------------------
        // MOVIE / SERIES
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
                                ? `🗂 ${item.archive_id}`
                                : "",
                            "",
                            "Was möchtest du tun?"
                        ]
                            .filter(
                                line => line !== ""
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

                    await this.bot.telegram.sendDocument(
                        ctx.chat!.id,
                        item.file_id,
                        {
                            caption:
                                `🎬 ${item.title}`
                        }
                    );

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
    // ARCHIVE NUMBER
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
    }
}