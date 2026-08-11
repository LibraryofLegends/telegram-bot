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

Version.............: 3.3.0

Status..............: Core

Lifecycle...........: Production

Description.........

Telegram Bot with:

- Webhook (Render ready)
- Media reception
- Media parsing (Movie / Series detection)

===============================================================================
*/

import {
    Context,
    Telegraf
} from "telegraf";

import express, {
    Request,
    Response
} from "express";

import {
    MediaParser
} from "../../domain/parser/media-parser";

// =============================================================================
// CONFIG
// =============================================================================

export interface TelegramConfig {
    token: string;
    port: number;
    webhookUrl?: string;
}

// =============================================================================
// BOT
// =============================================================================

export class TelegramBot {

    private readonly bot: Telegraf<Context>;
    private readonly app = express();
    private readonly config: TelegramConfig;

    private isRunning = false;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor(config: TelegramConfig) {

        this.config = config;

        this.bot = new Telegraf(config.token);

        this.app.use(express.json());

        this.setupRoutes();
        this.registerCommands();
        this.registerMediaHandlers();

        console.log("🔧 TelegramBot erstellt.");
    }

    // =========================================================================
    // ROUTES
    // =========================================================================

    private setupRoutes(): void {

        this.app.get("/", (_req: Request, res: Response) => {
            res.send("OK");
        });

        this.app.post("/webhook", (req: Request, res: Response) => {

            this.bot.handleUpdate(req.body)
                .then(() => res.sendStatus(200))
                .catch(err => {
                    console.error("❌ Webhook Fehler:", err);
                    res.sendStatus(500);
                });
        });
    }

    // =========================================================================
    // COMMANDS
    // =========================================================================

    private registerCommands(): void {

        this.bot.start(async (ctx) => {
            await ctx.reply("🎬 Library Of Legends aktiv");
        });

        this.bot.command("ping", async (ctx) => {
            await ctx.reply("🏓 Pong");
        });
    }

    // =========================================================================
    // MEDIA HANDLER
    // =========================================================================

    private registerMediaHandlers(): void {

        this.bot.on("video", async (ctx) => {
            await this.handleMedia(ctx);
        });

        this.bot.on("document", async (ctx) => {
            await this.handleMedia(ctx);
        });
    }

    // =========================================================================
    // HANDLE MEDIA
    // =========================================================================

    private async handleMedia(ctx: Context): Promise<void> {

        const message: any = (ctx as any).message;

        const fileName =
            message?.video?.file_name ||
            message?.document?.file_name ||
            "unknown";

        const fileId =
            message?.video?.file_id ||
            message?.document?.file_id;

        const fileSize =
            message?.video?.file_size ||
            message?.document?.file_size;

        // =============================================================
        // PARSE
        // =============================================================

        const parsed =
            MediaParser.parse(fileName);

        // =============================================================
        // RESPONSE
        // =============================================================

        await ctx.reply(
            [
                "🧠 <b>Parser Ergebnis</b>",
                "",
                `📄 Datei: <code>${fileName}</code>`,
                "",
                `🎯 Typ: <b>${parsed.type}</b>`,
                `🎬 Titel: <b>${parsed.title}</b>`,
                parsed.year ? `📅 Jahr: <b>${parsed.year}</b>` : "",
                parsed.season ? `📺 Staffel: <b>${parsed.season}</b>` : "",
                parsed.episode ? `🎬 Episode: <b>${parsed.episode}</b>` : "",
                parsed.episodeTitle ? `🎞️ Episodentitel: <b>${parsed.episodeTitle}</b>` : "",
                parsed.quality ? `📦 Qualität: <b>${parsed.quality}</b>` : "",
                parsed.source ? `🌐 Source: <b>${parsed.source}</b>` : "",
                "",
                `🆔 File-ID: <code>${fileId}</code>`,
                `💾 Größe: <code>${this.formatFileSize(fileSize)}</code>`
            ].filter(Boolean).join("\n"),
            { parse_mode: "HTML" }
        );
    }

    // =========================================================================
    // START
    // =========================================================================

    public async launch(): Promise<void> {

        console.log("🤖 Starte Telegram Bot...");

        if (this.config.webhookUrl) {

            console.log("🌐 Webhook Mode aktiv");

            const baseUrl =
                this.config.webhookUrl.replace(/\/+$/, "");

            const webhookUrl =
                `${baseUrl}/webhook`;

            await this.bot.telegram.setWebhook(webhookUrl);

            this.app.listen(this.config.port, () => {
                console.log(`🌐 Express läuft auf Port ${this.config.port}`);
                console.log(`🔗 Webhook: ${webhookUrl}`);
            });

        } else {

            await this.bot.launch();
        }

        this.isRunning = true;

        console.log("✅ TelegramBot Initialisierung abgeschlossen.");
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private formatFileSize(bytes?: number): string {

        if (!bytes) return "unbekannt";

        const gb = bytes / (1024 * 1024 * 1024);

        return `${gb.toFixed(2)} GB`;
    }
}