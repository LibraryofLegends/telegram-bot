/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TG-0001

LOL-ID..............: LOL-TG-BOT-0001

File................: telegram-bot.ts

Location............
Library Of Legend/src/framework/telegram/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Minimal Telegram framework for the clean restart.

Phase 2 responsibilities:

- Create Telegram bot
- Register /start
- Register /help
- Start polling
- Stop polling
- Handle Telegram errors
- Provide Render health status

Intentionally NOT implemented:

- Database
- TMDB
- Media processing
- Filename parsing
- Movie processing
- Series processing
- Episode processing
- Forum topics
- Search
- Favorites
- Trending
- Netflix UI

===============================================================================
*/

import {
    Context,
    Markup,
    Telegraf
} from "telegraf";

import {
    AppConfig
} from "../../config/config";

export class TelegramBot {

    // =========================================================================
    // TELEGRAM INSTANCE
    // =========================================================================

    private readonly bot:
        Telegraf<Context>;

    // =========================================================================
    // STATE
    // =========================================================================

    private started:
        boolean = false;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor(
        private readonly config: AppConfig
    ) {

        this.bot =
            new Telegraf<Context>(
                this.config.telegramBotToken
            );

        this.registerHandlers();

        console.log(
            "🔧 TelegramBot erstellt."
        );
    }

    // =========================================================================
    // HANDLERS
    // =========================================================================

    private registerHandlers(): void {

        // =====================================================================
        // START
        // =====================================================================

        this.bot.start(
            async (
                ctx
            ) => {

                await this.handleStart(
                    ctx
                );
            }
        );

        // =====================================================================
        // HELP
        // =====================================================================

        this.bot.help(
            async (
                ctx
            ) => {

                await this.handleHelp(
                    ctx
                );
            }
        );

        // =====================================================================
        // GLOBAL ERROR HANDLER
        // =====================================================================

        this.bot.catch(
            async (
                error,
                ctx
            ) => {

                console.error(
                    "================================================="
                );

                console.error(
                    "❌ TELEGRAM BOT FEHLER"
                );

                console.error(
                    error
                );

                console.error(
                    "================================================="
                );

                try {

                    await ctx.reply(
                        "❌ Bei der Verarbeitung ist ein Fehler aufgetreten."
                    );

                } catch {
                    // Telegram context may no longer exist.
                }
            }
        );
    }

    // =========================================================================
    // INITIALIZE
    // =========================================================================

    public async initialize(): Promise<void> {

        console.log(
            "✅ TelegramBot Initialisierung abgeschlossen."
        );
    }

    // =========================================================================
    // LAUNCH
    // =========================================================================

    public async launch(): Promise<void> {

        if (
            this.started
        ) {

            console.log(
                "⚠️ TelegramBot läuft bereits."
            );

            return;
        }

        await this.initialize();

        console.log(
            "🤖 Starte Telegram Bot..."
        );

        try {

            this.started =
                true;

            await this.bot.launch(
                {
                    dropPendingUpdates:
                        false
                }
            );

            console.log(
                "================================================="
            );

            console.log(
                "🤖 LIBRARY OF LEGENDS TELEGRAM BOT"
            );

            console.log(
                "✅ Telegram Verbindung aktiv"
            );

            console.log(
                "✅ /start aktiv"
            );

            console.log(
                "✅ /help aktiv"
            );

            console.log(
                "================================================="
            );

        } catch (
            error
        ) {

            this.started =
                false;

            console.error(
                "❌ TelegramBot konnte nicht gestartet werden:",
                error
            );

            throw error;
        }
    }

    // =========================================================================
    // STOP
    // =========================================================================

    public async stop(
        reason = "shutdown"
    ): Promise<void> {

        if (
            !this.started
        ) {

            console.log(
                "ℹ️ TelegramBot ist bereits beendet."
            );

            return;
        }

        console.log(
            `🛑 TelegramBot wird beendet: ${reason}`
        );

        try {

            this.bot.stop(
                reason
            );

        } catch (
            error
        ) {

            console.error(
                "❌ Fehler beim Stoppen des TelegramBots:",
                error
            );

        } finally {

            this.started =
                false;

            console.log(
                "✅ TelegramBot beendet."
            );
        }
    }

    // =========================================================================
    // START SCREEN
    // =========================================================================

    private async handleStart(
        ctx: Context
    ): Promise<void> {

        await ctx.reply(
            [
                "🎬 <b>Library Of Legends</b>",
                "",
                "━━━━━━━━━━━━━━━━━━",
                "",
                "🎞️ Willkommen im Medienarchiv!",
                "",
                "✅ Telegram-Grundsystem aktiv",
                "",
                "🚧 Der Bot wird jetzt Schritt für Schritt",
                "sauber aufgebaut.",
                "",
                "━━━━━━━━━━━━━━━━━━",
                "",
                "ℹ️ /help"
            ].join(
                "\n"
            ),
            {
                parse_mode:
                    "HTML",

                ...Markup.keyboard(
                    [
                        "ℹ️ Hilfe"
                    ]
                ).resize()
            }
        );
    }

    // =========================================================================
    // HELP
    // =========================================================================

    private async handleHelp(
        ctx: Context
    ): Promise<void> {

        await ctx.reply(
            [
                "🎬 <b>Library Of Legends</b>",
                "",
                "━━━━━━━━━━━━━━━━━━",
                "",
                "📚 <b>Aktuell verfügbar</b>",
                "",
                "/start",
                "/help",
                "",
                "🚧 Weitere Funktionen werden",
                "erst in den nächsten Phasen",
                "hinzugefügt."
            ].join(
                "\n"
            ),
            {
                parse_mode:
                    "HTML"
            }
        );
    }

    // =========================================================================
    // HTTP STATUS
    // =========================================================================

    public getHttpStatus(): string {

        return this.started
            ? "Library Of Legends Bot läuft"
            : "Library Of Legends Bot gestoppt";
    }

    // =========================================================================
    // STARTED
    // =========================================================================

    public isStarted(): boolean {

        return this.started;
    }
}