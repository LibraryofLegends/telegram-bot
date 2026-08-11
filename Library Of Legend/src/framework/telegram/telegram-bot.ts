/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TG-CORE-0001

LOL-ID..............: LOL-TG-BOT-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Clean Telegram Bot with Webhook Support (Render Ready)

Responsibilities:

- Initialize Telegraf bot
- Support Webhook mode (Render compatible)
- Register commands
- Handle updates via Express
- Provide HTTP status
- Safe start / stop lifecycle

===============================================================================
*/

import { Telegraf } from "telegraf";
import express, { Request, Response } from "express";

export class TelegramBot {

    private bot: Telegraf;
    private app = express();
    private isRunning = false;

    private token: string;
    private webhookUrl: string;
    private port: number;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(config: {
        token: string;
        port: number;
        webhookUrl?: string;
    }) {

        this.token = config.token;
        this.port = config.port;
        this.webhookUrl = config.webhookUrl || "";

        this.bot = new Telegraf(this.token);

        this.setupMiddleware();
        this.setupRoutes();
        this.registerCommands();

        console.log("🔧 TelegramBot erstellt.");
    }

    // =========================================================================
    // SETUP EXPRESS
    // =========================================================================

    private setupMiddleware(): void {
        this.app.use(express.json());
    }

    private setupRoutes(): void {

        // Health Endpoint
        this.app.get("/", (_req: Request, res: Response) => {
            res.send(this.getHttpStatus());
        });

        // Webhook Endpoint
        this.app.post("/webhook", (req: Request, res: Response) => {

            this.bot.handleUpdate(req.body)
                .then(() => res.sendStatus(200))
                .catch((err) => {
                    console.error("❌ Webhook Fehler:", err);
                    res.sendStatus(500);
                });
        });
    }

    // =========================================================================
    // COMMANDS
    // =========================================================================

    private registerCommands(): void {

        this.bot.start((ctx) => {
            ctx.reply("📺 Willkommen bei Library Of Legends");
        });

        this.bot.command("ping", (ctx) => {
            ctx.reply("🏓 Pong");
        });

        this.bot.on("text", (ctx) => {
            ctx.reply("📩 Nachricht empfangen");
        });
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        if (this.isRunning) return;

        console.log("🤖 Starte Telegram Bot...");

        // ============================================================
        // WEBHOOK MODE (EMPFOHLEN für Render)
        // ============================================================

        if (this.webhookUrl) {

            console.log("🌐 Webhook Mode aktiv");

            await this.bot.telegram.setWebhook(
                `${this.webhookUrl}/webhook`
            );

            this.app.listen(this.port, "0.0.0.0", () => {
                console.log(`🌐 Express Server läuft auf Port ${this.port}`);
                console.log(`🔗 Webhook gesetzt: ${this.webhookUrl}/webhook`);
            });

        } else {

            // ========================================================
            // FALLBACK: LONG POLLING (NICHT empfohlen auf Render)
            // ========================================================

            console.log("⚠️ Polling Mode aktiv");

            await this.bot.launch();
        }

        this.isRunning = true;

        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }

    // =========================================================================
    // STOP
    // =========================================================================

    public async stop(reason?: string): Promise<void> {

        console.log(`🛑 Stoppe TelegramBot (${reason || "unknown"})`);

        await this.bot.stop(reason);

        this.isRunning = false;
    }

    // =========================================================================
    // STATUS
    // =========================================================================

    public getHttpStatus(): string {

        return `
=================================================
📺 LIBRARY OF LEGENDS BOT
Status: ${this.isRunning ? "ONLINE" : "OFFLINE"}
Mode: ${this.webhookUrl ? "WEBHOOK" : "POLLING"}
=================================================
        `.trim();
    }
}