/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot
Module..............: Telegram
File................: telegram-bot.ts

Version.............: 5.0.0 (GET SYSTEM)

===============================================================================
*/

import { Telegraf } from "telegraf";
import express, { Request, Response } from "express";

import { parseMedia } from "../../application/parser/media-parser";
import { TMDBService } from "../../application/services/tmdb-service";
import { PostBuilder } from "../../application/post/post-builder";
import { SearchService } from "../../application/search/search-service";

import { MovieRepository } from "../../infrastructure/database/database";

// =============================================================================
// CONFIG
// =============================================================================

interface TelegramBotConfig {
    token: string;
    port: number;
    webhookUrl?: string;
}

// =============================================================================
// BOT
// =============================================================================

export class TelegramBot {

    private readonly bot: Telegraf;
    private readonly config: TelegramBotConfig;
    private readonly app = express();

    // =========================================================================

    constructor(config: TelegramBotConfig) {

        this.config = config;
        this.bot = new Telegraf(config.token);

        console.log("🔧 TelegramBot erstellt.");

        this.registerCommands();
        this.registerMediaHandlers();
    }

    // =========================================================================
    // COMMANDS
    // =========================================================================

    private registerCommands(): void {

        // START
        this.bot.start(async (ctx) => {

            await ctx.reply("🎬 Library Of Legends Bot ist online.");
        });

        // PING
        this.bot.command("ping", async (ctx) => {
            await ctx.reply("🏓 Pong");
        });

        // SEARCH
        this.bot.command("search", async (ctx) => {

            const query = ctx.message.text.replace("/search", "").trim();

            const results = SearchService.search(query);

            const formatted = SearchService.format(results);

            await ctx.reply(formatted, {
                parse_mode: "HTML"
            });
        });

        // =============================================================================
        // GET SYSTEM 🔥
        // =============================================================================

        this.bot.command("get", async (ctx) => {

            try {

                const input =
                    ctx.message.text
                        .replace("/get", "")
                        .trim()
                        .toUpperCase();

                if (!input) {

                    await ctx.reply("❌ Bitte eine Archive-ID angeben.\n\nBeispiel:\n/get LIB-ACT-0001");
                    return;
                }

                console.log("🔎 GET Anfrage:", input);

                // =============================================================
                // DB LOOKUP
                // =============================================================

                const movie =
                    MovieRepository.getAll()
                        .find(m =>
                            String(m.archiveId).toUpperCase() === input
                        );

                if (!movie) {

                    await ctx.reply("❌ Film nicht im Archiv gefunden.");
                    return;
                }

                // =============================================================
                // COVER
                // =============================================================

                if (movie.posterUrl) {

                    await ctx.replyWithPhoto(movie.posterUrl);

                    console.log("🖼️ Cover gesendet.");
                }

                // =============================================================
                // VIDEO
                // =============================================================

                if (movie.fileId) {

                    await ctx.replyWithVideo(movie.fileId, {
                        supports_streaming: true
                    });

                    console.log("🎬 Film gesendet.");

                } else {

                    await ctx.reply("⚠️ Kein Video gespeichert.");
                }

                // =============================================================
                // LAYOUT
                // =============================================================

                const caption =
                    PostBuilder.build({
                        title: movie.title,
                        year: movie.year,
                        rating: movie.rating,
                        genres: movie.genres,
                        overview: movie.overview,
                        fileSize: movie.fileSize
                    });

                await ctx.reply(caption, {
                    parse_mode: "HTML"
                });

                console.log("📝 Layout gesendet.");

            } catch (error) {

                console.error("❌ GET Fehler:", error);

                await ctx.reply("❌ Fehler beim Abrufen des Films.");
            }
        });
    }

    // =========================================================================
    // MEDIA HANDLER (gekürzt – bleibt wie bei dir)
    // =========================================================================

    private registerMediaHandlers(): void {

        this.bot.on("video", async (ctx) => {
            await this.handleMedia(ctx);
        });

        this.bot.on("document", async (ctx) => {
            await this.handleMedia(ctx);
        });
    }

    private async handleMedia(ctx: any): Promise<void> {

        const message = ctx.message;
        const media = message.video || message.document;

        if (!media) return;

        const fileName = media.file_name || "unknown.mp4";
        const fileId = media.file_id;
        const fileSize = media.file_size || 0;

        const parsed = parseMedia(fileName);

        if (parsed.type !== "movie") {
            await ctx.reply("📺 Serie erkannt (wird später gebaut)");
            return;
        }

        const movie = await TMDBService.searchMovie(parsed.title, parsed.year);

        const caption = PostBuilder.build({
            title: movie?.title || parsed.title,
            year: movie?.year,
            rating: movie?.rating,
            genres: movie?.genres,
            overview: movie?.overview,
            fileSize
        });

        // SAVE IN DB 🔥
        MovieRepository.insert({
            title: movie?.title || parsed.title,
            year: movie?.year,
            archiveId: "TEMP", // dein System ersetzt das später
            fileId,
            posterUrl: movie?.posterUrl,
            fileSize,
            genres: movie?.genres,
            overview: movie?.overview,
            rating: movie?.rating
        });

        if (movie?.posterUrl) {
            await ctx.replyWithPhoto(movie.posterUrl);
        }

        await ctx.replyWithVideo(fileId, {
            supports_streaming: true
        });

        await ctx.reply(caption, {
            parse_mode: "HTML"
        });
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        if (this.config.webhookUrl) {

            this.setupWebhook();

        } else {

            await this.bot.launch();
        }

        console.log("✅ Bot läuft.");
    }

    // =========================================================================

    private setupWebhook(): void {

        this.app.use(express.json());

        this.app.post("/webhook", (req: Request, res: Response) => {

            this.bot.handleUpdate(req.body);
            res.sendStatus(200);
        });

        this.app.listen(this.config.port);

        this.bot.telegram.setWebhook(`${this.config.webhookUrl}/webhook`);
    }
}