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

Lifecycle...........: Production

Description.........

Telegram Bot with complete Library Of Legends media system.

Responsibilities:
- Netflix-style start screen
- Movie navigation
- Search system
- Trending media
- Favorite media
- Pagination
- View tracking
- Telegram File-ID playback
- Admin-only media import
- PostgreSQL library storage
- Interactive inline buttons

===============================================================================
*/

import { Telegraf, Markup } from "telegraf";

import { LibraryRepository } from "../../infrastructure/database/library-repository";

import { SearchCommand } from "./commands/search-command";

/**
 * Telegram Bot
 */
export class TelegramBot {

    private bot: Telegraf;

    private adminIds: number[];

    /**
     * Creates the Telegram Bot instance.
     */
    public constructor(token: string) {

        this.bot = new Telegraf(token);

        this.adminIds = (process.env.ADMIN_IDS || "")
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((id) => !Number.isNaN(id));

        this.setup();
    }

    // =========================================================================
    // BOT SETUP
    // =========================================================================

    private setup(): void {

        // =========================================================================
        // START SCREEN
        // =========================================================================

        this.bot.start(async (ctx) => {

            await ctx.reply(
                "🎬 *Library Of Legends*\n\n" +
                "Willkommen in deiner digitalen Mediathek.\n\n" +
                "Wähle eine Kategorie:",
                {
                    parse_mode: "Markdown",

                    ...Markup.keyboard([
                        ["🔥 Trending", "⭐ Favoriten"],
                        ["🎬 Filme", "🔎 Suche"]
                    ]).resize()
                }
            );

        });

        // =========================================================================
        // SEARCH COMMAND
        // =========================================================================

        SearchCommand.register(this.bot);

        // =========================================================================
        // MOVIES BUTTON
        // =========================================================================

        this.bot.hears("🎬 Filme", async (ctx) => {

            try {

                await this.sendMoviePage(ctx, 0);

            } catch (error) {

                console.error(
                    "❌ Fehler beim Laden der Filme:",
                    error
                );

                await ctx.reply(
                    "❌ Filme konnten nicht geladen werden."
                );

            }

        });

        // =========================================================================
        // SEARCH BUTTON
        // =========================================================================

        this.bot.hears("🔎 Suche", async (ctx) => {

            await ctx.reply(
                "🔎 *Mediathek durchsuchen*\n\n" +
                "Verwende:\n\n" +
                "`/find FILMTITEL`\n\n" +
                "Beispiel:\n" +
                "`/find Superman`",
                {
                    parse_mode: "Markdown"
                }
            );

        });

        // =========================================================================
        // TRENDING
        // =========================================================================

        this.bot.hears("🔥 Trending", async (ctx) => {

            try {

                const movies =
                    await LibraryRepository.getTrending();

                if (movies.length === 0) {

                    await ctx.reply(
                        "🔥 *Trending*\n\n" +
                        "❌ Noch keine Titel vorhanden.",
                        {
                            parse_mode: "Markdown"
                        }
                    );

                    return;
                }

                const buttons = movies.map((movie) => [

                    Markup.button.callback(
                        movie.title,
                        `movie_${movie.id}`
                    )

                ]);

                await ctx.reply(
                    "🔥 *Trending*\n\n" +
                    "Wähle einen Titel:",
                    {
                        parse_mode: "Markdown",

                        ...Markup.inlineKeyboard(
                            buttons
                        )
                    }
                );

            } catch (error) {

                console.error(
                    "❌ Fehler beim Laden von Trending:",
                    error
                );

                await ctx.reply(
                    "❌ Trending konnte nicht geladen werden."
                );

            }

        });

        // =========================================================================
        // FAVORITES
        // =========================================================================

        this.bot.hears("⭐ Favoriten", async (ctx) => {

            try {

                const movies =
                    await LibraryRepository.getFavorites();

                if (movies.length === 0) {

                    await ctx.reply(
                        "⭐ *Favoriten*\n\n" +
                        "❌ Noch keine Favoriten vorhanden.",
                        {
                            parse_mode: "Markdown"
                        }
                    );

                    return;
                }

                const buttons = movies.map((movie) => [

                    Markup.button.callback(
                        movie.title,
                        `movie_${movie.id}`
                    )

                ]);

                await ctx.reply(
                    "⭐ *Favoriten*\n\n" +
                    "Wähle einen Titel:",
                    {
                        parse_mode: "Markdown",

                        ...Markup.inlineKeyboard(
                            buttons
                        )
                    }
                );

            } catch (error) {

                console.error(
                    "❌ Fehler beim Laden der Favoriten:",
                    error
                );

                await ctx.reply(
                    "❌ Favoriten konnten nicht geladen werden."
                );

            }

        });

        // =========================================================================
        // MOVIE PAGINATION
        // =========================================================================

        this.bot.action(
            /page_(\d+)/,
            async (ctx) => {

                try {

                    const page =
                        Number(ctx.match[1]);

                    await ctx.answerCbQuery();

                    await this.sendMoviePage(
                        ctx,
                        page
                    );

                } catch (error) {

                    console.error(
                        "❌ Fehler bei der Pagination:",
                        error
                    );

                    await ctx.answerCbQuery(
                        "❌ Fehler beim Laden."
                    );

                }

            }
        );

        // =========================================================================
        // MOVIE CALLBACK
        // =========================================================================

        this.bot.action(
            /movie_(.+)/,
            async (ctx) => {

                try {

                    const id =
                        ctx.match[1];

                    /*
                     * Wir laden eine ausreichend große Liste,
                     * damit auch ältere Library-Einträge gefunden
                     * werden können.
                     */
                    const movies =
                        await LibraryRepository.getAll(
                            1000,
                            0
                        );

                    const movie =
                        movies.find(
                            (item) =>
                                String(item.id) ===
                                String(id)
                        );

                    if (!movie) {

                        await ctx.answerCbQuery(
                            "❌ Titel nicht gefunden."
                        );

                        return;
                    }

                    await ctx.answerCbQuery(
                        "🎬 Wird geladen..."
                    );

                    // =================================================================
                    // VIEW TRACKING
                    // =================================================================

                    await LibraryRepository.increaseViews(
                        id
                    );

                    // =================================================================
                    // SEND FILE
                    // =================================================================

                    await ctx.replyWithDocument(
                        movie.file_id,
                        {
                            caption:
                                `🎬 ${movie.title}\n\n` +
                                `📁 ${movie.file_name}\n` +
                                `🎞 ${movie.type}`,

                            ...Markup.inlineKeyboard([
                                [
                                    Markup.button.callback(
                                        "⭐ Favorit",
                                        `fav_${id}`
                                    )
                                ]
                            ])
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Fehler beim Abrufen des Mediums:",
                        error
                    );

                    await ctx.answerCbQuery(
                        "❌ Medium konnte nicht geladen werden."
                    );

                }

            }
        );

        // =========================================================================
        // FAVORITE BUTTON
        // =========================================================================

        this.bot.action(
            /fav_(.+)/,
            async (ctx) => {

                try {

                    const id =
                        ctx.match[1];

                    await LibraryRepository.toggleFavorite(
                        id
                    );

                    await ctx.answerCbQuery(
                        "⭐ Favorit gespeichert"
                    );

                } catch (error) {

                    console.error(
                        "❌ Fehler beim Speichern des Favoriten:",
                        error
                    );

                    await ctx.answerCbQuery(
                        "❌ Favorit konnte nicht gespeichert werden."
                    );

                }

            }
        );

        // =========================================================================
        // ADMIN MEDIA IMPORT
        // =========================================================================

        this.bot.on(
            "document",
            async (ctx) => {

                const userId =
                    ctx.from?.id;

                // -----------------------------------------------------------------
                // ADMIN CHECK
                // -----------------------------------------------------------------

                if (
                    !userId ||
                    !this.adminIds.includes(userId)
                ) {

                    return;
                }

                const file =
                    ctx.message.document;

                const fileName =
                    file.file_name ||
                    "Unbekannt";

                const fileId =
                    file.file_id;

                try {

                    // -----------------------------------------------------------------
                    // TITLE
                    // -----------------------------------------------------------------

                    const title =
                        fileName
                            .replace(/\.[^/.]+$/, "")
                            .trim();

                    // -----------------------------------------------------------------
                    // MEDIA TYPE
                    // -----------------------------------------------------------------

                    const lowerFileName =
                        fileName.toLowerCase();

                    const type =
                        /s\d{1,2}e\d{1,3}/i.test(
                            lowerFileName
                        )
                            ? "SERIES"
                            : "MOVIE";

                    // -----------------------------------------------------------------
                    // DATABASE SAVE
                    // -----------------------------------------------------------------

                    await LibraryRepository.save(
                        title,
                        fileName,
                        type,
                        fileId
                    );

                    console.log(
                        "💾 Datei gespeichert:",
                        {
                            title,
                            fileName,
                            type
                        }
                    );

                    await ctx.reply(
                        "✅ Datei verarbeitet & gespeichert!"
                    );

                } catch (error) {

                    console.error(
                        "❌ Fehler beim Speichern:",
                        error
                    );

                    await ctx.reply(
                        "❌ Fehler beim Speichern der Datei."
                    );

                }

            }
        );

    }

    // =========================================================================
    // MOVIE PAGE
    // =========================================================================

    private async sendMoviePage(
        ctx: any,
        page: number
    ): Promise<void> {

        const limit = 5;

        const offset =
            page * limit;

        const movies =
            await LibraryRepository.getAll(
                limit,
                offset
            );

        if (movies.length === 0) {

            await ctx.reply(
                page === 0
                    ? "🎬 *Filme*\n\n❌ Noch keine Filme vorhanden."
                    : "❌ Keine weiteren Filme vorhanden.",
                {
                    parse_mode: "Markdown"
                }
            );

            return;
        }

        const buttons =
            movies.map((movie) => [

                Markup.button.callback(
                    movie.title,
                    `movie_${movie.id}`
                )

            ]);

        // =========================================================================
        // NAVIGATION
        // =========================================================================

        const navigation = [];

        if (page > 0) {

            navigation.push(
                Markup.button.callback(
                    "⬅️ Zurück",
                    `page_${page - 1}`
                )
            );

        }

        if (movies.length === limit) {

            navigation.push(
                Markup.button.callback(
                    "➡️ Weiter",
                    `page_${page + 1}`
                )
            );

        }

        if (navigation.length > 0) {

            buttons.push(
                navigation
            );

        }

        await ctx.reply(
            `🎬 *Filme*\n\n` +
            `Seite ${page + 1}\n\n` +
            `Wähle einen Titel:`,
            {
                parse_mode: "Markdown",

                ...Markup.inlineKeyboard(
                    buttons
                )
            }
        );

    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public launch(): void {

        this.bot.launch();

        console.log(
            "🤖 Bot gestartet (FULL SYSTEM + UI)"
        );

        console.log(
            "🔥 Netflix UI aktiv"
        );

        console.log(
            "💾 Database + File-ID System aktiv"
        );

    }

}