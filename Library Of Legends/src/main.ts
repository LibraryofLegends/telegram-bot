/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Main

Architecture Layer..: Application

Module..............: Core

Module ID...........: LOL-MOD-CORE-0001

LOL-ID..............: LOL-MAIN-0001

File................: main.ts

Location............
Library Of Legends/src/

Version.............: 2.2.0

Status..............: Core

Lifecycle...........: Production

Description.........

Application entry point.
Initializes Telegram Bot and starts HTTP keep-alive server
for Render deployment compatibility.

===============================================================================
*/

import { TelegramBot } from "./framework/telegram/telegram-bot";
import * as http from "http";

// =========================================================================
// ENVIRONMENT
// =========================================================================

const TOKEN = process.env.TOKEN || "";

if (!TOKEN) {
    console.error("❌ Kein BOT TOKEN gesetzt!");
    process.exit(1);
}

// =========================================================================
// BOT INITIALIZATION
// =========================================================================

const bot = new TelegramBot(TOKEN);
bot.launch();

// =========================================================================
// KEEP-ALIVE SERVER (RENDER FIX)
// =========================================================================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.write("🚀 Library Of Legends Bot läuft");
    res.end();
}).listen(PORT, () => {
    console.log(`🌐 Server läuft auf Port ${PORT}`);
});

// =========================================================================
// START LOG
// =========================================================================

console.log("🤖 Bot gestartet (FULL SYSTEM)");
console.log("🚀 Library Of Legends gestartet");