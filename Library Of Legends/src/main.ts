/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Main

Architecture Layer..: Entry Point

Module..............: Bootstrap

Module ID...........: LOL-MOD-MAIN-0001

LOL-ID..............: LOL-MAIN-0001

File................: main.ts

Location............
Library Of Legends/src/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Production Ready

Description.........

Application entry point.
Bootstraps the Telegram Bot using environment variables.

(⚠️ dotenv entfernt – Render nutzt direkte ENV Variablen)

===============================================================================
*/

import { TelegramBot } from "./framework/telegram/telegram-bot";

/**
 * Bootstrap Application
 */
function bootstrap(): void {

    const token = process.env.TOKEN;

    if (!token) {
        throw new Error("❌ TOKEN fehlt in Environment Variables");
    }

    const bot = new TelegramBot(token);

    bot.launch();

    console.log("🚀 Library Of Legends gestartet");
}

/**
 * Start App
 */
bootstrap();