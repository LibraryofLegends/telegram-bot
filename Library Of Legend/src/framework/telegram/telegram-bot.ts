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

Version.............: 3.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram Bot (Webhook Ready, Render Compatible)

Responsibilities:

- Initialize Telegraf bot
- Support Webhook mode
- Handle Express server
- Prevent double slash webhook bug
- Provide health status
- Clean lifecycle handling

===============================================================================
*/

import { Telegraf } from "telegraf";
import express, { Request, Response } from "express";

// =============================================================================
// CONFIG INTERFACE
// =============================================================================

export interface TelegramConfig {
    token: string;
    port: number;
    webhookUrl?: string;
}

// =============================================================================
// TELEGRAM BOT
// =============================================================================

export class TelegramBot {

    private bot: Telegraf;
    private app = express();
    private config: TelegramConfig;
    private isRunning = false;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(config: TelegramConfig) {

        this.config = config;
        this.bot = new Telegraf(config.token);

        this.app.use(express.json());

        this.setupRoutes();
        this.registerCommands();

        console.log("🔧 TelegramBot erstellt.");
    }

    // =========================================================================
    // ROUTES
    // =========================================================================

    private setupRoutes(): void {

        // Health Check
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
            ctx.reply("📺 Library Of Legends");
        });

        this.bot.command("ping", (ctx) => {
            ctx.reply("🏓 Pong");
        });
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        if (this.isRunning) return;

        console.log("🤖 Starte Telegram Bot...");

        // ============================================================
        // WEBHOOK MODE (RENDER)
        // ============================================================

        if (this.config.webhookUrl) {

            console.log("🌐 Webhook Mode aktiv");

            // 🔥 FIX: entfernt doppelte Slashes
            const baseUrl = this.config.webhookUrl.replace(/\/+$/, "");

            await this.bot.telegram.setWebhook(
                `${baseUrl}/webhook`
            );

            this.app.listen(this.config.port, "0.0.0.0", () => {

                console.log(`🌐 Express Server läuft auf Port ${this.config.port}`);

                console.log(
                    `🔗 Webhook gesetzt: ${baseUrl}/webhook`
                );
            });

        } else {

            // ========================================================
            // FALLBACK (LOCAL ONLY)
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
Mode: ${this.config.webhookUrl ? "WEBHOOK" : "POLLING"}
=================================================
        `.trim();
    }
}