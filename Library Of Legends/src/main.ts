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

Version.............: 2.3.1

Status..............: Core

Lifecycle...........: Production

Description.........

Application entry point.

Initializes the Library Of Legends Telegram Bot and starts
the HTTP keep-alive server required for Render Web Service
deployment.

Includes detailed startup diagnostics to identify failures
during bot initialization and deployment.

===============================================================================
*/

import { TelegramBot } from "./framework/telegram/telegram-bot";
import * as http from "http";

// =========================================================================
// START
// =========================================================================

console.log("=================================================");
console.log("🚀 PROJECT PHOENIX START");
console.log("=================================================");

// =========================================================================
// ENVIRONMENT
// =========================================================================

const TOKEN = process.env.TOKEN || "";

console.log("🔍 Prüfe BOT TOKEN...");

if (!TOKEN) {

    console.error(
        "❌ FEHLER: TOKEN ist nicht gesetzt!"
    );

    process.exit(1);
}

console.log(
    "✅ BOT TOKEN vorhanden"
);

// =========================================================================
// TELEGRAM BOT INITIALIZATION
// =========================================================================

console.log(
    "🔧 Erstelle TelegramBot..."
);

let bot: TelegramBot;

try {

    bot = new TelegramBot(TOKEN);

    console.log(
        "✅ TelegramBot erfolgreich erstellt"
    );

} catch (error) {

    console.error(
        "❌ FEHLER beim Erstellen des TelegramBot:",
        error
    );

    process.exit(1);
}

// =========================================================================
// TELEGRAM BOT LAUNCH
// =========================================================================

console.log(
    "🤖 Starte TelegramBot..."
);

try {

    bot.launch();

    console.log(
        "✅ TelegramBot launch() aufgerufen"
    );

} catch (error) {

    console.error(
        "❌ FEHLER beim Starten des TelegramBot:",
        error
    );

    process.exit(1);
}

// =========================================================================
// KEEP-ALIVE SERVER
// =========================================================================

console.log(
    "🔧 Starte Render HTTP Server..."
);

const PORT = Number(
    process.env.PORT || 3000
);

const server = http.createServer(
    (req, res) => {

        res.writeHead(
            200,
            {
                "Content-Type":
                    "text/plain; charset=utf-8"
            }
        );

        res.end(
            "🚀 Library Of Legends Bot läuft"
        );

    }
);

// =========================================================================
// HTTP SERVER ERROR
// =========================================================================

server.on(
    "error",
    (error) => {

        console.error(
            "❌ HTTP Server Fehler:",
            error
        );

    }
);

// =========================================================================
// START HTTP SERVER
// =========================================================================

server.listen(
    PORT,
    () => {

        console.log(
            `🌐 Server läuft auf Port ${PORT}`
        );

        console.log(
            "================================================="
        );

        console.log(
            "🤖 Bot gestartet (FULL SYSTEM)"
        );

        console.log(
            "🚀 Library Of Legends gestartet"
        );

        console.log(
            "💾 Database System aktiv"
        );

        console.log(
            "🎬 Netflix UI aktiv"
        );

        console.log(
            "================================================="
        );

    }
);

// =========================================================================
// GRACEFUL SHUTDOWN
// =========================================================================

process.once(
    "SIGINT",
    () => {

        console.log(
            "🛑 SIGINT erhalten – Server wird beendet..."
        );

        server.close(
            () => {

                console.log(
                    "✅ HTTP Server beendet"
                );

                process.exit(0);

            }
        );

    }
);

process.once(
    "SIGTERM",
    () => {

        console.log(
            "🛑 SIGTERM erhalten – Server wird beendet..."
        );

        server.close(
            () => {

                console.log(
                    "✅ HTTP Server beendet"
                );

                process.exit(0);

            }
        );

    }
);