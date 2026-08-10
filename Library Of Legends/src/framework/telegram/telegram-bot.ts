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

Version.............: 6.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram Bot with Netflix-style user interface.

Responsibilities:
- Netflix-style start screen
- Genre navigation preparation
- Trending media
- Favorite media
- Media pagination integration
- View tracking
- Telegram File-ID playback
- Interactive inline buttons

===============================================================================
*/

import { Telegraf, Markup } from "telegraf";

import { LibraryRepository } from "../../infrastructure/database/library-repository";

/**
 * Telegram Bot
 */
export class TelegramBot {

    private bot: Telegraf;

    /**
     * Creates the Telegram Bot instance.
     */
    public constructor(token: string) {

        this.bot = new Telegraf(token);

        this.setup();
    }

    // =========================================================================
    // BOT SETUP
    // =========================================================================

    private setup(): void {

        // =========================================================================
        // START SCREEN
        // =========================================================================

        this.bot.start((ctx) => {

            ctx.reply(
                "🎬 *Library Of Legends*\n\nNetflix Style UI",
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
        // TRENDING
        // =========================================================================

        this.bot.hears("🔥 Trending", async (ctx) => {

            try {

                const movies =
                    await LibraryRepository.getTrending();

                if (movies.length === 0) {

                    await ctx.reply(
                        "🔥 Trending\n\n❌ Noch keine Titel vorhanden."
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
                    "🔥 *Trending*\n\nWähle einen Titel:",
                    {
                        parse_mode: "Markdown",
                        ...Markup.inlineKeyboard(buttons)
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
                        "⭐ Favoriten\n\n❌ Noch keine Favoriten vorhanden."
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
                    "⭐ *Favoriten*\n\nWähle einen Titel:",
                    {
                        parse_mode: "Markdown",
                        ...Markup.inlineKeyboard(buttons)
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
        // MOVIE CLICK
        // =========================================================================

        this.bot.action(/movie_(.+)/, async (ctx) => {

            try {

                const id = ctx.match[1];

                const movies =
                    await LibraryRepository.getAll(100, 0);

                const movie =
                    movies.find(
                        (item) =>
                            String(item.id) === String(id)
                    );

                if (!movie) {

                    await ctx.answerCbQuery(
                        "❌ Titel nicht gefunden."
                    );

                    return;
                }

                // =================================================================
                // VIEW TRACKING
                // =================================================================

                await LibraryRepository.increaseViews(id);

                // =================================================================
                // SEND FILE
                // =================================================================

                await ctx.replyWithDocument(
                    movie.file_id,
                    {
                        caption:
                            `🎬 ${movie.title}`,

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

                await ctx.answerCbQuery(
                    "🎬 Wird gesendet..."
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

        });

        // =========================================================================
        // FAVORITE BUTTON
        // =========================================================================

        this.bot.action(/fav_(.+)/, async (ctx) => {

            try {

                const id = ctx.match[1];

                await LibraryRepository.toggleFavorite(id);

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

        });

    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public launch(): void {

        this.bot.launch();

        console.log(
            "🔥 Library Of Legends Netflix System aktiv"
        );

    }

}