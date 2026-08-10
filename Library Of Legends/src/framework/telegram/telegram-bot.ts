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

Version.............: 4.0.0

Status..............: FULL SYSTEM (UI + FILE-ID + DATABASE)

Lifecycle...........: Production

Description.........

Telegram Bot with:
- File Upload Detection
- Auto Save to Database
- Search System (/find)
- File-ID Playback System
- Netflix Style UI (Buttons + Navigation)

===============================================================================
*/

import { Telegraf, Markup } from "telegraf";
import { LibraryRepository } from "../../infrastructure/database/library-repository";
import { SearchCommand } from "./commands/search-command";

export class TelegramBot {

    private bot: Telegraf;
    private adminIds: number[];

    constructor(token: string) {

        this.bot = new Telegraf(token);

        this.adminIds = (process.env.ADMIN_IDS || "")
            .split(",")
            .map(id => Number(id.trim()))
            .filter(id => !isNaN(id));

        this.setup();
    }

    private setup(): void {

        // =========================================================================
        // START MENU (UI)
        // =========================================================================

        this.bot.start((ctx) => {

            ctx.reply(
                "🎬 *Library Of Legends*\n\nWähle eine Option:",
                {
                    parse_mode: "Markdown",
                    ...Markup.keyboard([
                        ["🎬 Filme", "🔎 Suche"]
                    ]).resize()
                }
            );

        });

        // =========================================================================
        // SEARCH COMMAND (/find)
        // =========================================================================

        SearchCommand.register(this.bot);

        // =========================================================================
        // MOVIES BUTTON (UI)
        // =========================================================================

        this.bot.hears("🎬 Filme", async (ctx) => {

            const movies = await LibraryRepository.search("");

            if (movies.length === 0) {
                return ctx.reply("❌ Keine Filme vorhanden.");
            }

            const buttons = movies.map((movie) => [
                Markup.button.callback(movie.title, `movie_${movie.id}`)
            ]);

            await ctx.reply(
                "🎬 Filme auswählen:",
                Markup.inlineKeyboard(buttons)
            );

        });

        // =========================================================================
        // MOVIE CLICK (SEND FILE)
        // =========================================================================

        this.bot.action(/movie_(.+)/, async (ctx) => {

            const id = ctx.match[1];

            const results = await LibraryRepository.search("");
            const movie = results.find(m => String(m.id) === String(id));

            if (!movie) {
                return ctx.answerCbQuery("❌ Film nicht gefunden");
            }

            await ctx.replyWithDocument(movie.file_id, {
                caption: `🎬 ${movie.title}`
            });

        });

        // =========================================================================
        // FILE UPLOAD (ADMIN ONLY)
        // =========================================================================

        this.bot.on("document", async (ctx) => {

            const userId = ctx.from?.id;

            if (!userId || !this.adminIds.includes(userId)) {
                return;
            }

            const file = ctx.message.document;
            const fileName = file.file_name || "Unbekannt";
            const fileId = file.file_id;

            try {

                const title = fileName.replace(/\.[^/.]+$/, "");

                const type = fileName.toLowerCase().includes("s01")
                    ? "SERIES"
                    : "MOVIE";

                await LibraryRepository.save(
                    title,
                    fileName,
                    type,
                    fileId
                );

                await ctx.reply("✅ Datei verarbeitet & gespeichert!");

            } catch (error) {

                console.error(error);
                await ctx.reply("❌ Fehler beim Speichern.");

            }

        });

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Bot gestartet (FULL SYSTEM + UI)");
    }

}