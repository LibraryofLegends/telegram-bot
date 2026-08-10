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

===============================================================================
*/

import { TelegramBot } from "./framework/telegram/telegram-bot";
import http from "http";

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

    console.log("🤖 Bot gestartet (TMDB aktiv)");

    // 🔥 WICHTIG: Fake Web Server für Render
    const port = process.env.PORT || 3000;

    http.createServer((req, res) => {
        res.writeHead(200);
        res.end("Library Of Legends Bot läuft 🚀");
    }).listen(port, () => {
        console.log(`🌐 Webserver läuft auf Port ${port}`);
    });

}

bootstrap();