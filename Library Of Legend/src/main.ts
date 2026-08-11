/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Main

Architecture Layer..: Application

Module..............: Bootstrap

Module ID...........: LOL-MOD-CORE-0001

LOL-ID..............: LOL-MAIN-0001

File................: main.ts

Location............
Library Of Legend/src/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Clean Bootstrap (Webhook Ready)

Responsibilities:

- Load environment variables
- Create TelegramBot instance with config
- Start bot correctly
- Prevent old init() usage

===============================================================================
*/

import { TelegramBot } from "./framework/telegram/telegram-bot";

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {

    console.log("=================================================");
    console.log("🚀 PROJECT PHOENIX START");
    console.log("=================================================");

    // =========================================================================
    // CONFIG
    // =========================================================================

    const token = process.env.TOKEN;
    const port = Number(process.env.PORT) || 10000;
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!token) {
        throw new Error("❌ TOKEN fehlt in ENV!");
    }

    // =========================================================================
    // BOT INIT (NEU)
    // =========================================================================

    const bot = new TelegramBot({
        token,
        port,
        webhookUrl
    });

    console.log("🔧 TelegramBot erstellt.");

    // =========================================================================
    // START
    // =========================================================================

    await bot.launch();

    console.log("=================================================");
    console.log("🚀 LIBRARY OF LEGENDS");
    console.log("✅ Bot läuft");
    console.log("=================================================");
}

// =============================================================================
// START
// =============================================================================

main().catch((error) => {

    console.error("=================================================");
    console.error("❌ FATALER STARTUP-FEHLER");
    console.error(error);
    console.error("=================================================");

    process.exit(1);
});