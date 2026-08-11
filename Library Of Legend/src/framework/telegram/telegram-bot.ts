/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Telegram Bot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-FRAMEWORK-TG-0001

LOL-ID..............: LOL-TG-CORE-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 3.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram Bot with:

- Media detection
- Filename parsing
- TMDB integration (NEW)
- Debug output (NO posting yet)

===============================================================================
*/

import { Telegraf } from "telegraf";
import express from "express";

import { MediaParser } from "../../application/parser/media-parser";
import { TmdbService } from "../../infrastructure/tmdb/tmdb.service";

// =============================================================================
// TYPES
// =============================================================================

interface BotConfig {
    token: string;
    port: number;
    webhookUrl?: string;
}

// =============================================================================
// TELEGRAM BOT
// =============================================================================

export class TelegramBot {

    private bot: Telegraf;
    private config: BotConfig;

    private parser: MediaParser;
    private tmdb: TmdbService;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(config: BotConfig) {

        this.config = config;

        this.bot = new Telegraf(config.token);

        this.parser = new MediaParser();
        this.tmdb = new TmdbService();

        console.log("🔧 TelegramBot erstellt.");
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        console.log("🤖 Starte Telegram Bot...");

        // =====================================================================
        // HANDLER
        // =====================================================================

        this.registerHandlers();

        // =====================================================================
        // WEBHOOK MODE
        // =====================================================================

        if (this.config.webhookUrl) {

            console.log("🌐 Webhook Mode aktiv");

            const app = express();

            app.use(express.json());

            app.post("/webhook", (req, res) => {
                this.bot.handleUpdate(req.body);
                res.sendStatus(200);
            });

            app.listen(this.config.port, "0.0.0.0", () => {
                console.log(`🌐 Express Server läuft auf Port ${this.config.port}`);
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

            // FALLBACK POLLING (NICHT EMPFOHLEN AUF RENDER)

            console.log("⚠️ Polling Mode aktiv");

            await this.bot.launch();
        }

        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }

    // =========================================================================
    // HANDLERS
    // =========================================================================

    private registerHandlers(): void {

        this.bot.on("video", async (ctx) => {

            try {

                const video =
                    ctx.message.video;

                const fileName =
                    video.file_name || "unknown";

                const fileId =
                    video.file_id;

                const fileSize =
                    video.file_size ?? 0;

                // =============================================================
                // DEBUG: MEDIA EMPFANG
                // =============================================================

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
                    this.parser.parse(fileName);

                console.log("🧠 Parser Ergebnis:", parsed);

                // =============================================================
                // TMDB
                // =============================================================

                let tmdbData = null;

                if (parsed.type === "movie") {

                    tmdbData =
                        await this.tmdb.searchMovie(
                            parsed.title,
                            parsed.year
                        );

                    console.log("🎬 TMDB Ergebnis:", tmdbData);
                }

                // =============================================================
                // TELEGRAM RESPONSE
                // =============================================================

                let message =
                    `🧠 Parser Ergebnis\n` +
                    `📄 Datei: ${fileName}\n` +
                    `🎯 Typ: ${parsed.type}\n` +
                    `🎬 Titel: ${parsed.title}\n` +
                    `📅 Jahr: ${parsed.year ?? "?"}\n\n`;

                if (tmdbData) {

                    message +=
                        `🎬 TMDB\n` +
                        `📌 Titel: ${tmdbData.title}\n` +
                        `⭐ Rating: ${tmdbData.rating}\n` +
                        `🎭 Genres: ${tmdbData.genres.join(", ")}\n` +
                        `📖 ${tmdbData.overview?.slice(0, 150)}...\n`;
                } else {

                    message +=
                        `⚠️ Kein TMDB Treffer`;
                }

                await ctx.reply(message);

            } catch (error) {

                console.error("❌ Fehler im Video-Handler:", error);

                await ctx.reply("❌ Fehler bei Verarbeitung");
            }
        });
    }
}