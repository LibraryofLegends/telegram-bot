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
Library Of Legend/src/framework/telegram/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram Bot with Webhook support.

Responsibilities:

- Receive media from Telegram
- Parse media files
- Fetch TMDB data
- Build formatted movie posts
- Send poster + caption
- Provide webhook endpoint for Render

===============================================================================
*/

import { Telegraf } from "telegraf";
import express from "express";

import { parseMedia } from "../../application/parser/media-parser";
import { TMDBService } from "../../application/services/tmdb-service";
import { MoviePostBuilder } from "../../application/builder/movie-post-builder";

// =============================================================================
// TYPES
// =============================================================================

interface TelegramBotConfig {
    token: string;
    port: number;
    webhookUrl?: string;
}

// =============================================================================
// TELEGRAM BOT
// =============================================================================

export class TelegramBot {

    private bot: Telegraf;
    private config: TelegramBotConfig;
    private app = express();

    constructor(config: TelegramBotConfig) {

        this.config = config;
        this.bot = new Telegraf(config.token);

        console.log("🔧 TelegramBot erstellt.");
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        console.log("🤖 Starte Telegram Bot...");

        // =====================================================================
        // MEDIA HANDLER
        // =====================================================================

        this.bot.on("video", async (ctx) => {

            try {

                const video = ctx.message.video;

                const fileName =
                    video.file_name || "Unbekannt";

                const fileId =
                    video.file_id;

                const fileSize =
                    video.file_size || 0;

                console.log("=================================================");
                console.log("📥 MEDIA EMPFANGEN");
                console.log(`📄 Datei: ${fileName}`);
                console.log(`🆔 File-ID: ${fileId}`);
                console.log(`💾 Größe: ${fileSize}`);
                console.log("=================================================");

                // =============================================================
                // PARSER
                // =============================================================

                const parsed =
                    parseMedia(fileName);

                console.log("🧠 Parser Ergebnis:", parsed);

                // =============================================================
                // TMDB
                // =============================================================

                let tmdbData = null;

                if (parsed.title) {

                    console.log(
                        `🔎 TMDB Suche: "${parsed.title}" (${parsed.year})`
                    );

                    tmdbData =
                        await TMDBService.searchMovie(
                            parsed.title,
                            parsed.year
                        );
                }

                console.log("🎬 TMDB Ergebnis:", tmdbData);

                // =============================================================
                // BUILD POST
                // =============================================================

                const post =
                    MoviePostBuilder.build({
                        fileName,
                        fileId,
                        fileSize,
                        parser: parsed,
                        tmdb: tmdbData || undefined
                    });

                // =============================================================
                // SEND MESSAGE (FIXED)
                // =============================================================

                if (post.posterUrl) {

                    await ctx.replyWithPhoto(
                        post.posterUrl,
                        {
                            caption: post.caption,
                            parse_mode: "HTML"
                        }
                    );

                } else {

                    await ctx.reply(
                        post.caption,
                        {
                            parse_mode: "HTML"
                        }
                    );
                }

            } catch (error) {

                console.error("❌ Fehler:", error);

                await ctx.reply(
                    "❌ Fehler beim Verarbeiten der Datei."
                );
            }
        });

        // =====================================================================
        // WEBHOOK MODE
        // =====================================================================

        if (this.config.webhookUrl) {

            console.log("🌐 Webhook Mode aktiv");

            this.app.use(express.json());

            this.app.post("/webhook", (req, res) => {

                this.bot.handleUpdate(req.body, res);
            });

            this.app.listen(this.config.port, () => {

                console.log(
                    `🌐 Express Server läuft auf Port ${this.config.port}`
                );
            });

            const baseUrl =
                this.config.webhookUrl.replace(/\/+$/, "");

            await this.bot.telegram.setWebhook(
                `${baseUrl}/webhook`
            );

            console.log(
                `🔗 Webhook gesetzt: ${baseUrl}/webhook`
            );

        } else {

            // =============================================================
            // FALLBACK: POLLING (NICHT EMPFOHLEN AUF RENDER)
            // =============================================================

            await this.bot.launch();

            console.log("⚠️ Polling Mode aktiv");
        }

        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }

    // =========================================================================
    // STOP
    // =========================================================================

    public async stop(signal: string): Promise<void> {

        console.log(`🛑 Stoppe Bot (${signal})`);

        this.bot.stop(signal);
    }
}