/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-FW-TG-0001

LOL-ID..............: LOL-TG-BOT-0001

File................: telegram-bot.ts

Location............
Library Of Legends/src/framework/telegram/

Version.............: 5.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central Telegram integration for Library Of Legends.

Responsibilities:

- Receive Telegram media
- Parse filenames
- Query TMDB
- Build movie post
- Handle duplicates (re-post allowed)
- Store movies (only once)
- Send:
  1. Cover
  2. Movie file
  3. Layout

===============================================================================
*/

import { Telegraf } from "telegraf";
import express, { Request, Response } from "express";

import { parseMedia } from "../../application/parser/media-parser";
import { TMDBService } from "../../application/services/tmdb-service";
import { PostBuilder } from "../../application/post/post-builder";
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

    public constructor(config: TelegramBotConfig) {

        this.config = config;
        this.bot = new Telegraf(config.token);

        console.log("🔧 TelegramBot erstellt.");

        this.registerCommands();
        this.registerMediaHandlers();
    }

    // =============================================================================
    // COMMANDS
    // =============================================================================

    private registerCommands(): void {

        this.bot.start(async (ctx) => {

            await ctx.reply(
                [
                    "🎬 <b>Library Of Legends</b>",
                    "",
                    "━━━━━━━━━━━━━━━━━━",
                    "",
                    "✅ Bot ist online.",
                    "📥 Medienempfang aktiv.",
                    "🎞️ TMDB aktiv.",
                    "",
                    "━━━━━━━━━━━━━━━━━━"
                ].join("\n"),
                { parse_mode: "HTML" }
            );
        });

        this.bot.command("ping", async (ctx) => {
            await ctx.reply("🏓 Pong");
        });
    }

    // =============================================================================
    // MEDIA HANDLER
    // =============================================================================

    private registerMediaHandlers(): void {

        this.bot.on("video", async (ctx) => {
            await this.handleMedia(ctx);
        });

        this.bot.on("document", async (ctx) => {
            await this.handleMedia(ctx);
        });
    }

    // =============================================================================
    // HANDLE MEDIA
    // =============================================================================

    private async handleMedia(ctx: any): Promise<void> {

        try {

            const message = ctx.message;
            if (!message) return;

            const media = message.video || message.document;
            if (!media) return;

            const fileName = String(
                media.file_name || `media_${media.file_unique_id}`
            );

            const fileId = String(media.file_id);
            const fileSize = Number(media.file_size || 0);

            console.log("📥 MEDIA:", fileName);

            // =========================================================================
            // DUPLICATE CHECK (🔥 FIXED)
            // =========================================================================

            const alreadyExists =
                MovieRepository.exists(fileId);

            if (alreadyExists) {

                await ctx.reply(
                    [
                        "⚠️ <b>Bereits im Archiv</b>",
                        "",
                        `📄 <code>${this.escapeHtml(fileName)}</code>`,
                        "",
                        "🔁 Wird erneut gesendet..."
                    ].join("\n"),
                    { parse_mode: "HTML" }
                );
            }

            // =========================================================================
            // PARSER
            // =========================================================================

            const parsed = parseMedia(fileName);

            if (parsed.type !== "movie") {
                await ctx.reply("📺 Serien werden später unterstützt.");
                return;
            }

            // =========================================================================
            // TMDB
            // =========================================================================

            const movie = await TMDBService.searchMovie(
                parsed.title,
                parsed.year
            );

            const title = movie?.title || parsed.title;
            const year = movie?.year || parsed.year;
            const rating = movie?.rating;
            const genres = movie?.genres || [];
            const overview = movie?.overview;

            // =========================================================================
            // SAVE (ONLY IF NEW)
            // =========================================================================

            if (!alreadyExists) {

                MovieRepository.addMovie({
                    title,
                    year,
                    fileId,
                    fileName,
                    fileSize,
                    collection: movie?.collection,
                    archiveId: undefined
                });
            }

            // =========================================================================
            // POST
            // =========================================================================

            const caption = PostBuilder.build({
                title,
                year,
                rating,
                genres,
                overview,
                fileSize
            });

            // =========================================================================
            // COVER
            // =========================================================================

            if (movie?.posterUrl) {
                await ctx.replyWithPhoto(movie.posterUrl);
            }

            // =========================================================================
            // VIDEO
            // =========================================================================

            await ctx.replyWithVideo(fileId, {
                supports_streaming: true
            });

            // =========================================================================
            // LAYOUT
            // =========================================================================

            await ctx.reply(caption, {
                parse_mode: "HTML",
                disable_web_page_preview: true
            });

            console.log("✅ Film verarbeitet");

        } catch (error) {

            console.error("❌ Fehler:", error);

            try {
                await ctx.reply("❌ Fehler beim Verarbeiten.");
            } catch {}
        }
    }

    // =============================================================================
    // WEBHOOK
    // =============================================================================

    private setupWebhook(): void {

        this.app.use(express.json());

        this.app.get("/", (_req: Request, res: Response) => {
            res.send("Bot läuft");
        });

        this.app.post("/webhook", (req: Request, res: Response) => {

            this.bot.handleUpdate(req.body)
                .then(() => res.sendStatus(200))
                .catch(() => res.sendStatus(500));
        });

        this.app.listen(this.config.port, "0.0.0.0");

        const webhookUrl =
            `${this.config.webhookUrl}/webhook`;

        this.bot.telegram.setWebhook(webhookUrl);

        console.log("🌐 Webhook aktiv:", webhookUrl);
    }

    // =============================================================================
    // LAUNCH
    // =============================================================================

    public async launch(): Promise<void> {

        if (this.config.webhookUrl) {
            this.setupWebhook();
        } else {
            await this.bot.launch();
        }

        console.log("🚀 Bot läuft");
    }

    // =============================================================================
    // HELPERS
    // =============================================================================

    private escapeHtml(value: string): string {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
}