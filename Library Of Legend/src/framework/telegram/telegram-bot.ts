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

Minimal and stable Telegram bot foundation for the
Library Of Legends clean restart.

Current Phase:

- Telegram bot initialization
- Telegram polling startup
- Telegram shutdown
- /start command
- /help command
- Global Telegram error handling
- Render health status

Intentionally NOT included yet:

- Database
- TMDB
- Media parser
- Movie processing
- Series processing
- Episode processing
- Telegram forum topics
- Search
- Favorites
- Trending
- Netflix UI

These components will be added only in their defined
architecture phases.

===============================================================================
*/

import {
    Context,
    Telegraf,
    Markup
} from "telegraf";

import {
    AppConfig
} from "../../config/config";

/**
 * TelegramBot
 *
 * Central Telegram framework entry point.
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

        this.registerHandlers();

        console.log(
            "🔧 TelegramBot erstellt."
        );
    }

    // =========================================================================
    // HANDLER REGISTRATION
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
                    /*
                     * Telegram context may no longer be available.
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
         * Phase 2 currently has no external subsystem
         * that needs initialization.
         *
         * The method exists intentionally so later phases
         * can add initialization without changing main.ts.
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

            await this.bot.launch(
                {
                    dropPendingUpdates:
                        false
                }
            );

            this.started =
                true;

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
    // START COMMAND
    // =========================================================================

    private async handleStart(
        ctx: Context
    ): Promise<void> {

        const text = [

            "🎬 <b>Library Of Legends</b>",

            "",

            "━━━━━━━━━━━━━━━━━━",

            "",

            "🎞️ Willkommen im Medienarchiv!",

            "",

            "🚧 Das System befindet sich momentan im",
            "strukturierten Neuaufbau.",

            "",

            "✅ Telegram-Verbindung aktiv",

            "✅ Bot-Grundsystem aktiv",

            "",

            "━━━━━━━━━━━━━━━━━━",

            "",

            "🛠️ Die weiteren Archivfunktionen werden",
            "Schritt für Schritt hinzugefügt."

        ].join(
            "\n"
        );

        await ctx.reply(
            text,
            {
                parse_mode:
                    "HTML",

                ...Markup.keyboard(
                    [
                        [
                            "ℹ️ Hilfe"
                        ]
                    ],
                    {
                        resize_keyboard:
                            true
                    }
                )
            }
        );
    }

    // =========================================================================
    // HELP COMMAND
    // =========================================================================

    private async handleHelp(
        ctx: Context
    ): Promise<void> {

        const text = [

            "🎬 <b>Library Of Legends</b>",

            "",

            "━━━━━━━━━━━━━━━━━━",

            "📚 <b>Aktuell verfügbar</b>",

            "",

            "▶️ /start",
            "ℹ️ /help",

            "",

            "━━━━━━━━━━━━━━━━━━",

            "🚧 Weitere Funktionen folgen",
            "kontrolliert in den nächsten",
            "Projektphasen."

        ].join(
            "\n"
        );

        await ctx.reply(
            text,
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
    // IS STARTED
    // =========================================================================

    public isStarted(): boolean {

        return this.started;
    }
}