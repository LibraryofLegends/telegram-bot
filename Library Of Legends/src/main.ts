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

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Application entry point.
Initializes and starts the Telegram bot.

===============================================================================
*/

import { TelegramBot } from "./framework/telegram/telegram-bot";

/**
 * Application bootstrap.
 */
function bootstrap(): void {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    const TOKEN = "DEIN_BOT_TOKEN_HIER";

    // =========================================================================
    // BOT INITIALIZATION
    // =========================================================================

    const bot = new TelegramBot(TOKEN);

    // =========================================================================
    // START APPLICATION
    // =========================================================================

    bot.launch();

}

// =========================================================================
// EXECUTION
// =========================================================================

bootstrap();