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

Version.............: 2.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Clean and centralized Telegram bot foundation for Library Of Legends.

Responsibilities:

- Create Telegram bot instance
- Register system commands
- Start Telegram polling
- Stop Telegram polling
- Handle Telegram errors
- Expose application health status
- Keep Telegram framework logic centralized

Current Phase:

- Telegram connection
- /start
- /help
- Basic system command registration
- Render-compatible startup

Intentionally NOT included yet:

- Database
- TMDB
- Media parser
- Movie processing
- Series processing
- Episode processing
- Forum topics
- Search
- Favorites
- Trending
- Netflix UI

These components will be introduced only in their
defined project phases.

===============================================================================
*/

import {
    Context,
    Telegraf
} from "telegraf";

import {
    AppConfig
} from "../../config/config";

import {
    registerSystemCommands
} from "./commands/system.command";

/**
 * Central Telegram bot.
 */
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

        console.log(
            "🔧 TelegramBot erstellt."
        );

        this.registerHandlers();
    }

    // =========================================================================
    // REGISTER HANDLERS
    // =========================================================================

    private registerHandlers(): void {

        // =====================================================================
        // SYSTEM COMMANDS
        // =====================================================================

        registerSystemCommands(
            this.bot
        );

        // =====================================================================
        // GLOBAL TELEGRAM ERROR HANDLER
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
                    /*
                     * Telegram context may no longer exist.
                     */
                }
            }
        );
    }

    // =========================================================================
    // INITIALIZE
    // =========================================================================

    public async initialize(): Promise<void> {

        /*
         * Phase 2 contains no external subsystem which
         * requires asynchronous initialization.
         *
         * This method intentionally exists as a stable
         * lifecycle hook for later project phases.
         */

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

            /*
             * Set state before polling starts.
             *
             * This prevents a second local launch()
             * call from creating another polling loop.
             */

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
                "✅ Telegram Polling aktiv"
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
    // HEALTH STATUS
    // =========================================================================

    public getHttpStatus(): string {

        if (
            this.started
        ) {

            return "Library Of Legends Bot läuft";
        }

        return "Library Of Legends Bot gestoppt";
    }

    // =========================================================================
    // STARTED STATUS
    // =========================================================================

    public isStarted(): boolean {

        return this.started;
    }
}