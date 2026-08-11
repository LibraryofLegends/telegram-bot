/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

File................: telegram-bot.ts

Version.............: 3.0.1 (BUILD FIX)

===============================================================================
*/

import express, { Request, Response } from "express";
import { Telegraf, Context } from "telegraf";

import { DatabaseService } from "../../infrastructure/database/database";

interface BotConfig {
    token: string;
    port: number;
    webhookUrl?: string;
}

export class TelegramBot {

    private bot: Telegraf<Context>;
    private config: BotConfig;
    private db: DatabaseService;

    constructor(config: BotConfig) {

        this.config = config;
        this.bot = new Telegraf(config.token);
        this.db = new DatabaseService();

        console.log("🔧 TelegramBot erstellt.");

        this.registerHandlers();
    }

    private registerHandlers(): void {

        this.bot.on("video", async (ctx) => {

            try {

                const video = ctx.message.video;

                const fileName = video.file_name || "unknown.mp4";
                const fileId = video.file_id;

                // ✅ FIX: Default Value setzen
                const fileSize = video.file_size ?? 0;

                console.log("📥 Datei empfangen:", fileName);

                const parsed = this.parseFileName(fileName);

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

                const sizeGB = fileSize > 0
                    ? (fileSize / 1024 / 1024 / 1024).toFixed(2)
                    : "—";

                await ctx.reply(
`🧠 Parser Ergebnis
📄 Datei: ${fileName}
🎯 Typ: ${parsed.type}
🎬 Titel: ${parsed.title}
📅 Jahr: ${parsed.year || "—"}
💾 Größe: ${sizeGB} GB`
                );

            } catch (error) {

                console.error("❌ Fehler:", error);

                await ctx.reply("❌ Fehler beim Verarbeiten der Datei.");
            }
        });
    }

    private parseFileName(fileName: string) {

        const clean = fileName.replace(/\./g, " ");

        const seriesMatch = clean.match(/S(\d{1,2})E(\d{1,2})/i);

        if (seriesMatch) {
            return {
                type: "series" as const,
                title: clean.replace(seriesMatch[0], "").trim(),
                season: Number(seriesMatch[1]),
                episode: Number(seriesMatch[2])
            };
        }

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

    public async launch(): Promise<void> {

        console.log("🤖 Starte Telegram Bot...");
        console.log("🌐 Webhook Mode aktiv");

        const app = express();
        app.use(express.json());

        app.post("/webhook", (req: Request, res: Response) => {
            this.bot.handleUpdate(req.body);
            res.sendStatus(200);
        });

        app.get("/", (_req: Request, res: Response) => {
            res.send("✅ Bot läuft");
        });

        app.listen(this.config.port, () => {
            console.log(`🌐 Express Server läuft auf Port ${this.config.port}`);
        });

        const baseUrl = this.config.webhookUrl?.replace(/\/+$/, "");

        if (!baseUrl) {
            throw new Error("❌ WEBHOOK_URL fehlt!");
        }

        await this.bot.telegram.setWebhook(`${baseUrl}/webhook`);

        console.log(`🔗 Webhook gesetzt: ${baseUrl}/webhook`);
        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }
}