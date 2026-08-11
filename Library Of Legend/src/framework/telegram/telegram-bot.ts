/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Telegram Bot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TG-0001

LOL-ID..............: LOL-TG-BOT-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram Bot with:

- Webhook Mode (Render Ready)
- Media Detection
- Parser Integration
- TMDB Integration
- Movie Post Builder

===============================================================================
*/

import { Telegraf, Context } from "telegraf";
import express from "express";

import { parseMedia } from "../../application/parser/media-parser";
import { MoviePostBuilder } from "../../application/builder/movie-post-builder";
import { TMDBService } from "../../application/services/tmdb-service";

// =============================================================================
// TYPES
// =============================================================================

interface BotConfig {
    token: string;
    port: number;
    webhookUrl?: string;
}

// =============================================================================
// CLASS
// =============================================================================

export class TelegramBot {

    private bot: Telegraf<Context>;
    private config: BotConfig;
    private app = express();

    private tmdb = new TMDBService();

    constructor(config: BotConfig) {

        this.config = config;
        this.bot = new Telegraf(config.token);

        console.log("🔧 TelegramBot erstellt.");
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        console.log("🤖 Starte Telegram Bot...");

        this.registerHandlers();

        // =========================================================================
        // WEBHOOK MODE
        // =========================================================================

        if (this.config.webhookUrl) {

            console.log("🌐 Webhook Mode aktiv");

            const baseUrl =
                this.config.webhookUrl.replace(/\/+$/, "");

            const webhookPath = "/webhook";

            this.app.use(express.json());

            this.app.post(
                webhookPath,
                (req, res) => {
                    this.bot.handleUpdate(req.body);
                    res.sendStatus(200);
                }
            );

            this.app.listen(this.config.port, () => {

                console.log(`🌐 Express Server läuft auf Port ${this.config.port}`);

            });

            await this.bot.telegram.setWebhook(
                `${baseUrl}${webhookPath}`
            );

            console.log(`🔗 Webhook gesetzt: ${baseUrl}${webhookPath}`);

        } else {

            // FALLBACK: POLLING
            console.log("⚠️ Polling Mode aktiv");
            await this.bot.launch();
        }

        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }

    // =========================================================================
    // HANDLERS
    // =========================================================================

    private registerHandlers(): void {

        this.bot.on("message", async (ctx) => {

            try {

                const msg: any = ctx.message;

                // =========================================================================
                // MEDIA CHECK
                // =========================================================================

                if (!msg?.video && !msg?.document) {
                    return;
                }

                const file =
                    msg.video || msg.document;

                const fileName =
                    file.file_name || "unknown";

                const fileId =
                    file.file_id;

                const fileSize =
                    file.file_size || 0;

                console.log("=================================================");
                console.log("📥 MEDIA EMPFANGEN");
                console.log(`📄 Datei: ${fileName}`);
                console.log(`🆔 File-ID: ${fileId}`);
                console.log(`💾 Größe: ${fileSize}`);
                console.log("=================================================");

                // =========================================================================
                // PARSER
                // =========================================================================

                const parsed =
                    parseMedia(fileName);

                console.log("🧠 Parser Ergebnis:", parsed);

                // =========================================================================
                // TMDB
                // =========================================================================

                const tmdbResult =
                    await this.tmdb.searchMovie(
                        parsed.title,
                        parsed.year
                    );

                console.log("🎬 TMDB Ergebnis:", tmdbResult);

                // =========================================================================
                // BUILD POST
                // =========================================================================

                const post =
                    MoviePostBuilder.build({
                        fileName,
                        fileId,
                        fileSize,
                        parser: parsed,
                        tmdb: tmdbResult || undefined
                    });

                // =========================================================================
                // SEND
                // =========================================================================

                await ctx.reply(post);

            } catch (error) {

                console.error("❌ Fehler:", error);

                await ctx.reply("❌ Fehler bei Verarbeitung.");

            }

        });
    }
}