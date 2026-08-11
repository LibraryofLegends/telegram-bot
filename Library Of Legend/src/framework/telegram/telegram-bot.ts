/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-FRAMEWORK-TG-0001

LOL-ID..............: LOL-TG-CORE-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram Bot (Webhook Mode)

Responsibilities:

- Receive media from Telegram
- Parse filename (movie / series)
- Store data in SQLite
- Respond with debug output

===============================================================================
*/

import express, { Request, Response } from "express";
import { Telegraf, Context } from "telegraf";

import { DatabaseService } from "../../infrastructure/database/database";

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

    private bot: Telegraf<Context>;
    private config: BotConfig;
    private db: DatabaseService;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(config: BotConfig) {

        this.config = config;

        this.bot = new Telegraf(config.token);

        this.db = new DatabaseService();

        console.log("🔧 TelegramBot erstellt.");

        this.registerHandlers();
    }

    // =========================================================================
    // REGISTER HANDLERS
    // =========================================================================

    private registerHandlers(): void {

        this.bot.on("video", async (ctx) => {

            try {

                const video = ctx.message.video;

                const fileName = video.file_name || "unknown.mp4";
                const fileId = video.file_id;
                const fileSize = video.file_size;

                console.log("📥 Datei empfangen:", fileName);

                // =============================================================
                // PARSER
                // =============================================================

                const parsed = this.parseFileName(fileName);

                // =============================================================
                // SAVE TO DATABASE
                // =============================================================

                this.db.insertMedia({
                    type: parsed.type,
                    title: parsed.title,
                    year: parsed.year,
                    season: parsed.season,
                    episode: parsed.episode,
                    fileName,
                    fileId,
                    fileSize
                });

                // =============================================================
                // RESPONSE
                // =============================================================

                await ctx.reply(
`🧠 Parser Ergebnis
📄 Datei: ${fileName}
🎯 Typ: ${parsed.type}
🎬 Titel: ${parsed.title}
📅 Jahr: ${parsed.year || "—"}
💾 Größe: ${(fileSize / 1024 / 1024 / 1024).toFixed(2)} GB`
                );

            } catch (error) {

                console.error("❌ Fehler:", error);

                await ctx.reply("❌ Fehler beim Verarbeiten der Datei.");
            }
        });
    }

    // =========================================================================
    // PARSER
    // =========================================================================

    private parseFileName(fileName: string) {

        const clean = fileName.replace(/\./g, " ");

        // SERIES DETECTION (S01E01)
        const seriesMatch = clean.match(/S(\d{1,2})E(\d{1,2})/i);

        if (seriesMatch) {

            return {
                type: "series" as const,
                title: clean.replace(seriesMatch[0], "").trim(),
                season: Number(seriesMatch[1]),
                episode: Number(seriesMatch[2])
            };
        }

        // MOVIE DETECTION (YEAR)
        const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);

        if (yearMatch) {

            return {
                type: "movie" as const,
                title: clean.replace(yearMatch[0], "").trim(),
                year: Number(yearMatch[0])
            };
        }

        return {
            type: "unknown" as const,
            title: clean.trim()
        };
    }

    // =========================================================================
    // LAUNCH (WEBHOOK MODE)
    // =========================================================================

    public async launch(): Promise<void> {

        console.log("🤖 Starte Telegram Bot...");
        console.log("🌐 Webhook Mode aktiv");

        const app = express();

        app.use(express.json());

        // =============================================================
        // WEBHOOK ENDPOINT
        // =============================================================

        app.post("/webhook", (req: Request, res: Response) => {

            this.bot.handleUpdate(req.body);

            res.sendStatus(200);
        });

        // =============================================================
        // HEALTH CHECK
        // =============================================================

        app.get("/", (_req: Request, res: Response) => {

            res.send("✅ Bot läuft");
        });

        // =============================================================
        // START SERVER
        // =============================================================

        app.listen(this.config.port, () => {

            console.log(`🌐 Express Server läuft auf Port ${this.config.port}`);
        });

        // =============================================================
        // SET WEBHOOK
        // =============================================================

        const baseUrl = this.config.webhookUrl?.replace(/\/+$/, "");

        if (!baseUrl) {
            throw new Error("❌ WEBHOOK_URL fehlt!");
        }

        await this.bot.telegram.setWebhook(
            `${baseUrl}/webhook`
        );

        console.log(`🔗 Webhook gesetzt: ${baseUrl}/webhook`);

        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }
}