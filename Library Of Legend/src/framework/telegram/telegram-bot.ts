/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-FWK-TG-0001

LOL-ID..............: LOL-TG-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 3.0.0

Status..............: FINAL

Lifecycle...........: Production

Description.........

Final Telegram Bot with:

- Media Detection
- Parser Integration
- TMDB Integration
- Post Builder Integration
- Webhook Mode (Render Ready)

===============================================================================
*/

import { Telegraf } from "telegraf";
import express from "express";

import { PostBuilder } from "../../application/post/post-builder";
import { HashtagBuilder } from "../../application/hashtag/hashtag-builder";
import { ArchiveId } from "../../application/archive/archive-id";

// 👉 Deine bestehenden Module (WICHTIG: müssen existieren!)
import { parseMedia } from "../../application/parser/media-parser";
import { TMDBService } from "../../application/services/tmdb-service";

// =============================================================================
// TYPES
// =============================================================================

interface Config {
    token: string;
    port: number;
    webhookUrl?: string;
}

// =============================================================================
// CLASS
// =============================================================================

export class TelegramBot {

    private bot: Telegraf;
    private config: Config;

    constructor(config: Config) {

        this.config = config;
        this.bot = new Telegraf(config.token);

        console.log("🔧 TelegramBot erstellt.");

        this.setupHandlers();
    }

    // =============================================================================
    // HANDLERS
    // =============================================================================

    private setupHandlers(): void {

        this.bot.on("video", async (ctx) => {

            try {

                const video = ctx.message.video;
                const fileName = video.file_name || "unknown.mp4";
                const fileSize = video.file_size;

                console.log("=================================================");
                console.log("📥 MEDIA EMPFANGEN");
                console.log(`📄 Datei: ${fileName}`);
                console.log("=================================================");

                // =========================================================================
                // PARSER
                // =========================================================================

                const parsed = parseMedia(fileName);

                console.log("🧠 Parser Ergebnis:", parsed);

                // =========================================================================
                // TMDB
                // =========================================================================

                let movie = null;

                if (parsed.title) {

                    movie = await TMDBService.searchMovie(
                        parsed.title,
                        parsed.year
                    );

                    if (!movie && parsed.year) {

                        console.log("🔄 Zweiter Versuch ohne Jahr...");

                        movie = await TMDBService.searchMovie(
                            parsed.title
                        );
                    }
                }

                console.log("🎬 TMDB Ergebnis:", movie?.title || "Kein Treffer");

                // =========================================================================
                // FALLBACK WERTE
                // =========================================================================

                const title = movie?.title || parsed.title || "Unbekannt";
                const year = movie?.release_date
                    ? Number(movie.release_date.slice(0, 4))
                    : parsed.year;

                const rating = movie?.vote_average;
                const genres = movie?.genres?.map(g => g.name) || [];

                const overview = movie?.overview;

                // =========================================================================
                // FINAL POST
                // =========================================================================

                const caption = PostBuilder.build({
                    title,
                    year,
                    rating,
                    genres,
                    overview,
                    fileName,
                    fileSize
                });

                // =========================================================================
                // TELEGRAM SEND
                // =========================================================================

                const poster = movie?.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null;

                if (poster) {

                    await ctx.replyWithPhoto(
                        poster,
                        {
                            caption
                        }
                    );

                } else {

                    await ctx.reply(
                        caption
                    );
                }

            } catch (error) {

                console.error("❌ Fehler:", error);

                await ctx.reply(
                    "❌ Fehler beim Verarbeiten der Datei."
                );
            }
        });

        // =========================================================================
        // TEST COMMAND
        // =========================================================================

        this.bot.start((ctx) => {
            ctx.reply("🚀 Library Of Legends Bot ist bereit!");
        });
    }

    // =============================================================================
    // LAUNCH
    // =============================================================================

    public async launch(): Promise<void> {

        console.log("🤖 Starte Telegram Bot...");

        if (this.config.webhookUrl) {

            console.log("🌐 Webhook Mode aktiv");

            const app = express();

            app.use(express.json());

            app.post("/webhook", (req, res) => {
                this.bot.handleUpdate(req.body);
                res.sendStatus(200);
            });

            app.listen(this.config.port, () => {
                console.log(`🌐 Express Server läuft auf Port ${this.config.port}`);
            });

            const baseUrl =
                this.config.webhookUrl.replace(/\/+$/, "");

            await this.bot.telegram.setWebhook(
                `${baseUrl}/webhook`
            );

            console.log(`🔗 Webhook gesetzt: ${baseUrl}/webhook`);

        } else {

            console.log("📡 Polling Mode aktiv");

            await this.bot.launch();
        }

        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }

    // =============================================================================
    // STOP
    // =============================================================================

    public async stop(signal: string): Promise<void> {

        console.log(`🛑 Stoppe Bot (${signal})`);

        this.bot.stop(signal);
    }
}