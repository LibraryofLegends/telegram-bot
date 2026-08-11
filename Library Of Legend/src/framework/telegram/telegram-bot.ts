/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Telegram Bot

Architecture Layer..: Framework

Module..............: Telegram

File................: telegram-bot.ts

Version.............: 4.0.0

Description.........

- Webhook Mode
- Media Parser
- TMDB Integration
- MoviePostBuilder
- ✅ Poster Support (NEU)

===============================================================================
*/

import { Telegraf, Context } from "telegraf";
import express from "express";

import { parseMedia } from "../../application/parser/media-parser";
import { MoviePostBuilder } from "../../application/builder/movie-post-builder";
import { TMDBService } from "../../application/services/tmdb-service";

interface BotConfig {
    token: string;
    port: number;
    webhookUrl?: string;
}

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

    public async launch(): Promise<void> {

        console.log("🤖 Starte Telegram Bot...");

        this.registerHandlers();

        if (this.config.webhookUrl) {

            console.log("🌐 Webhook Mode aktiv");

            const baseUrl =
                this.config.webhookUrl.replace(/\/+$/, "");

            const webhookPath = "/webhook";

            this.app.use(express.json());

            this.app.post(webhookPath, (req, res) => {
                this.bot.handleUpdate(req.body);
                res.sendStatus(200);
            });

            this.app.listen(this.config.port, () => {
                console.log(`🌐 Express Server läuft auf Port ${this.config.port}`);
            });

            await this.bot.telegram.setWebhook(
                `${baseUrl}${webhookPath}`
            );

            console.log(`🔗 Webhook gesetzt: ${baseUrl}${webhookPath}`);

        } else {

            console.log("⚠️ Polling Mode aktiv");
            await this.bot.launch();
        }

        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }

    // =============================================================================
    // HANDLER
    // =============================================================================

    private registerHandlers(): void {

        this.bot.on("message", async (ctx) => {

            try {

                const msg: any = ctx.message;

                if (!msg?.video && !msg?.document) {
                    return;
                }

                const file = msg.video || msg.document;

                const fileName = file.file_name || "unknown";
                const fileId = file.file_id;
                const fileSize = file.file_size || 0;

                console.log("📥 MEDIA:", fileName);

                // =========================================================================
                // PARSER
                // =========================================================================

                const parsed =
                    parseMedia(fileName);

                // =========================================================================
                // TMDB
                // =========================================================================

                const tmdb =
                    await this.tmdb.searchMovie(
                        parsed.title,
                        parsed.year
                    );

                // =========================================================================
                // BUILD TEXT
                // =========================================================================

                const caption =
                    MoviePostBuilder.build({
                        fileName,
                        fileId,
                        fileSize,
                        parser: parsed,
                        tmdb: tmdb || undefined
                    });

                // =========================================================================
                // SEND WITH POSTER
                // =========================================================================

                if (tmdb?.posterUrl) {

                    await ctx.replyWithPhoto(
                        tmdb.posterUrl,
                        {
                            caption
                        }
                    );

                } else {

                    await ctx.reply(caption);
                }

            } catch (error) {

                console.error("❌ Fehler:", error);
                await ctx.reply("❌ Fehler bei Verarbeitung.");

            }

        });
    }
}