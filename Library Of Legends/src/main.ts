/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Main

Architecture Layer..: Application

Module..............: Core

Module ID...........: LOL-MOD-CORE-0001

LOL-ID..............: LOL-CORE-0001

File................: main.ts

Location............
Library Of Legends/src/

Version.............: 1.2.0

Status..............: Core

Lifecycle...........: Development

Description.........

Application entry point.
Initializes and starts the Telegram bot using Render environment configuration.

===============================================================================
*/

import "dotenv/config";

import { TelegramBot } from "./framework/telegram/telegram-bot";

/**
 * Application bootstrap.
 */
function bootstrap(): void {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    const token = process.env.TOKEN;

    if (!token) {
        throw new Error("❌ TOKEN is not defined in environment variables");
    }

    // =========================================================================
    // BOT INITIALIZATION
    // =========================================================================

    const bot = new TelegramBot(token);

    // =========================================================================
    // START APPLICATION
    // =========================================================================

    bot.launch();

}

// =========================================================================
// EXECUTION
// =========================================================================

bootstrap();