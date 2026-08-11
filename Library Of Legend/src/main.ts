/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Main (Webhook Edition)

Architecture Layer..: Application

Module..............: Bootstrap

Module ID...........: LOL-MOD-CORE-0001

LOL-ID..............: LOL-MAIN-0002

File................: main.ts

Location............
Library Of Legend/src/

Version.............: 3.0.0

Status..............: PRODUCTION

Lifecycle...........: Stable

Description.........

Webhook-based application bootstrap for Render.

Responsibilities:

- Load configuration
- Start HTTP server
- Initialize Telegram Webhook
- Keep Render service alive
- Handle graceful shutdown

IMPORTANT:

- NO polling
- NO bot.launch()
- Webhook handles all updates

===============================================================================
*/

import {
    loadConfig
} from "./config/config";

import {
    TelegramBot
} from "./framework/telegram/telegram-bot";

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {

    console.log("=================================================");
    console.log("🚀 PROJECT PHOENIX START (WEBHOOK)");
    console.log("=================================================");

    // =========================================================================
    // CONFIG
    // =========================================================================

    const config = loadConfig();

    console.log("✅ Konfiguration geladen.");

    // =========================================================================
    // BOT
    // =========================================================================

    const bot = new TelegramBot();

    // =========================================================================
    // INIT WEBHOOK SYSTEM
    // =========================================================================

    try {

        await bot.init();

        console.log("=================================================");
        console.log("🤖 TELEGRAM BOT ONLINE (WEBHOOK)");
        console.log("=================================================");

    } catch (error) {

        console.error("=================================================");
        console.error("❌ TELEGRAM START FEHLER");
        console.error(error);
        console.error("=================================================");
    }

    // =========================================================================
    // READY
    // =========================================================================

    console.log("=================================================");
    console.log("🚀 LIBRARY OF LEGENDS");
    console.log("✅ Anwendung gestartet");
    console.log("✅ Webhook aktiv");
    console.log("=================================================");

    // =========================================================================
    // SHUTDOWN
    // =========================================================================

    const shutdown = async (signal: string): Promise<void> => {

        console.log("=================================================");
        console.log(`🛑 ${signal} erhalten`);
        console.log("🧹 Fahre Anwendung herunter...");
        console.log("=================================================");

        process.exit(0);
    };

    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

// =============================================================================
// START
// =============================================================================

void main().catch((error) => {

    console.error("=================================================");
    console.error("❌ FATALER STARTUP-FEHLER");
    console.error(error);
    console.error("=================================================");

    process.exit(1);
});