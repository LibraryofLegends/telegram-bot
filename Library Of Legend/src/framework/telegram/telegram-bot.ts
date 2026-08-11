/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot (Webhook Edition)

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TG-CORE-0001

LOL-ID..............: LOL-TG-BOT-CORE-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 5.0.0

Status..............: PRODUCTION

Lifecycle...........: Stable

Description.........

Telegram Bot Core using Webhook (NO POLLING)

Advantages:

- No 409 Conflict Errors
- Stable on Render
- Scalable Architecture
- No duplicate instances problem
- Instant message delivery

===============================================================================
*/

import { Telegraf, Context } from "telegraf";
import express, { Request, Response } from "express";

export class TelegramBot {

    private bot: Telegraf<Context>;
    private app = express();

    private readonly token: string;
    private readonly port: number;
    private readonly webhookUrl: string;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor() {

        this.token =
            process.env.TELEGRAM_BOT_TOKEN ||
            process.env.TOKEN ||
            "";

        if (!this.token) {
            throw new Error("❌ TELEGRAM TOKEN FEHLT");
        }

        this.port =
            Number(process.env.PORT) || 10000;

        this.webhookUrl =
            process.env.WEBHOOK_URL || "";

        if (!this.webhookUrl) {
            throw new Error("❌ WEBHOOK_URL fehlt");
        }

        this.bot = new Telegraf(this.token);

        console.log("🔧 TelegramBot erstellt (Webhook Mode)");
    }

    // =========================================================================
    // INIT
    // =========================================================================

    public async init(): Promise<void> {

        this.setupCommands();
        this.setupRoutes();

        await this.startServer();
        await this.startWebhook();

        console.log("✅ TelegramBot vollständig gestartet (Webhook)");
    }

    // =========================================================================
    // COMMANDS
    // =========================================================================

    private setupCommands(): void {

        this.bot.start((ctx) => {
            ctx.reply("🚀 Library Of Legends ist online!");
        });

        this.bot.help((ctx) => {
            ctx.reply("📖 Hilfe kommt bald...");
        });

        this.bot.on("text", (ctx) => {
            ctx.reply("📩 Nachricht erhalten!");
        });
    }

    // =========================================================================
    // EXPRESS ROUTES
    // =========================================================================

    private setupRoutes(): void {

        this.app.use(express.json());

        // Health Check (Render)
        this.app.get("/", (_req: Request, res: Response) => {
            res.send("✅ Bot läuft");
        });

        // Webhook Endpoint
        this.app.post(`/webhook/${this.token}`, (req, res) => {
            this.bot.handleUpdate(req.body);
            res.sendStatus(200);
        });
    }

    // =========================================================================
    // SERVER START
    // =========================================================================

    private async startServer(): Promise<void> {

        this.app.listen(this.port, () => {

            console.log("=================================================");
            console.log(`🌐 HTTP Server läuft auf Port ${this.port}`);
            console.log("=================================================");

        });
    }

    // =========================================================================
    // WEBHOOK START
    // =========================================================================

    private async startWebhook(): Promise<void> {

        console.log("🤖 Starte Webhook...");

        // 🔥 Wichtig: alte Sachen entfernen
        await this.bot.telegram.deleteWebhook({
            drop_pending_updates: true
        });

        // 🔥 Webhook setzen
        const url = `${this.webhookUrl}/webhook/${this.token}`;

        await this.bot.telegram.setWebhook(url);

        console.log("=================================================");
        console.log("✅ Webhook gesetzt:");
        console.log(url);
        console.log("=================================================");
    }
}