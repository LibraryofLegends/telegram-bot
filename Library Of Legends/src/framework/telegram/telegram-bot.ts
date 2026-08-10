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

Version.............: 5.0.0

Status..............: FULL SYSTEM (PAGINATION UI)

Lifecycle...........: Production

Description.........

Telegram Bot with:
- File Upload Detection
- Database Storage (file_id)
- Search System (/find)
- Netflix UI
- Pagination System

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
        // START MENU
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
        // SEARCH
        // =========================================================================

        SearchCommand.register(this.bot);

        // =========================================================================
        // MOVIES LIST (PAGE 1)
        // =========================================================================

        this.bot.hears("🎬 Filme", async (ctx) => {
            await this.sendMoviePage(ctx, 0);
        });

        // =========================================================================
        // PAGINATION BUTTONS
        // =========================================================================

        this.bot.action(/page_(\d+)/, async (ctx) => {

            const page = Number(ctx.match[1]);
            await this.sendMoviePage(ctx, page);

        });

        // =========================================================================
        // MOVIE CLICK
        // =========================================================================

        this.bot.action(/movie_(.+)/, async (ctx) => {

            const id = ctx.match[1];

            const results = await LibraryRepository.getAll(100, 0);
            const movie = results.find(m => String(m.id) === String(id));

            if (!movie) {
                return ctx.answerCbQuery("❌ Film nicht gefunden");
            }

            await ctx.replyWithDocument(movie.file_id, {
                caption: `🎬 ${movie.title}`
            });

        });

        // =========================================================================
        // FILE UPLOAD
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

                await ctx.reply("✅ Datei gespeichert!");

            } catch (error) {

                console.error(error);
                await ctx.reply("❌ Fehler.");

            }

        });

    }

    // =========================================================================
    // PAGINATION FUNCTION 🔥
    // =========================================================================

    private async sendMoviePage(ctx: any, page: number) {

        const limit = 5;
        const offset = page * limit;

        const movies = await LibraryRepository.getAll(limit, offset);

        if (movies.length === 0) {
            return ctx.reply("❌ Keine weiteren Filme.");
        }

        const buttons = movies.map((movie) => [
            Markup.button.callback(movie.title, `movie_${movie.id}`)
        ]);

        // Navigation
        const nav = [];

        if (page > 0) {
            nav.push(Markup.button.callback("⬅️ Zurück", `page_${page - 1}`));
        }

        if (movies.length === limit) {
            nav.push(Markup.button.callback("➡️ Weiter", `page_${page + 1}`));
        }

        await ctx.reply(
            `🎬 Filme (Seite ${page + 1})`,
            Markup.inlineKeyboard([
                ...buttons,
                nav
            ])
        );

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Bot gestartet (PAGINATION SYSTEM)");
    }

}