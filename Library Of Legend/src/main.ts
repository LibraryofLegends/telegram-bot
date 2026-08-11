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

Version.............: 2.0.1

Status..............: Core

Lifecycle...........: Production

Description.........

Application bootstrap for Render + Telegram.

Responsibilities:

- Load application configuration
- Start HTTP health server FIRST
- Start Telegram bot independently
- Keep Render Web Service port available
- Handle graceful shutdown
- Keep startup failures visible in logs

IMPORTANT:

The HTTP server intentionally starts BEFORE Telegram polling.

This prevents Render from reporting:

"No open ports detected"

when Telegram startup is delayed.

===============================================================================
*/

import * as http from "http";

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

    console.log(
        "================================================="
    );

    console.log(
        "🚀 PROJECT PHOENIX START"
    );

    console.log(
        "================================================="
    );

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    const config =
        loadConfig();

    console.log(
        "✅ Konfiguration geladen."
    );

    // =========================================================================
    // TELEGRAM BOT
    // =========================================================================

    const bot =
        new TelegramBot(
            config
        );

    // =========================================================================
    // HTTP SERVER
    // =========================================================================
    //
    // IMPORTANT:
    //
    // Render must detect an open port.
    //
    // Therefore the HTTP server is started BEFORE Telegram polling.
    //
    // =========================================================================

    const server =
        http.createServer(
            (
                _request,
                response
            ) => {

                response.writeHead(
                    200,
                    {
                        "Content-Type":
                            "text/plain; charset=utf-8"
                    }
                );

                response.end(
                    bot.getHttpStatus()
                );
            }
        );

    // =========================================================================
    // HTTP SERVER ERROR
    // =========================================================================

    server.on(
        "error",
        (
            error
        ) => {

            console.error(
                "❌ HTTP Server Fehler:",
                error
            );
        }
    );

    // =========================================================================
    // START HTTP SERVER
    // =========================================================================

    await new Promise<void>(
        (
            resolve,
            reject
        ) => {

            server.once(
                "error",
                reject
            );

            server.listen(
                config.port,
                () => {

                    server.removeListener(
                        "error",
                        reject
                    );

                    console.log(
                        `🌐 HTTP Server läuft auf Port ${config.port}`
                    );

                    resolve();
                }
            );
        }
    );

    // =========================================================================
    // START TELEGRAM
    // =========================================================================
    //
    // IMPORTANT:
    //
    // Telegram is started WITHOUT blocking the HTTP server.
    //
    // Render can therefore immediately detect the open port.
    //
    // =========================================================================

    void bot.launch()
        .then(
            () => {

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
                    "================================================="
                );
            }
        )
        .catch(
            (
                error
            ) => {

                console.error(
                    "================================================="
                );

                console.error(
                    "❌ TELEGRAM START FEHLER"
                );

                console.error(
                    error
                );

                console.error(
                    "================================================="
                );
            }
        );

    // =========================================================================
    // APPLICATION STATUS
    // =========================================================================

    console.log(
        "================================================="
    );

    console.log(
        "🚀 LIBRARY OF LEGENDS"
    );

    console.log(
        "✅ HTTP Health Server aktiv"
    );

    console.log(
        "⏳ Telegram wird gestartet..."
    );

    console.log(
        "================================================="
    );

    // =========================================================================
    // SHUTDOWN
    // =========================================================================

    const shutdown =
        async (
            signal: string
        ): Promise<void> => {

            console.log(
                "================================================="
            );

            console.log(
                `🛑 ${signal} erhalten.`
            );

            console.log(
                "🧹 Anwendung wird sauber beendet..."
            );

            console.log(
                "================================================="
            );

            try {

                await bot.stop(
                    signal
                );

            } catch (
                error
            ) {

                console.error(
                    "❌ Telegram Shutdown Fehler:",
                    error
                );
            }

            server.close(
                (
                    error
                ) => {

                    if (
                        error
                    ) {

                        console.error(
                            "❌ HTTP Server Shutdown Fehler:",
                            error
                        );

                        process.exit(
                            1
                        );

                        return;
                    }

                    console.log(
                        "✅ HTTP Server beendet."
                    );

                    console.log(
                        "👋 PROJECT PHOENIX beendet."
                    );

                    process.exit(
                        0
                    );
                }
            );
        };

    // =========================================================================
    // SIGINT
    // =========================================================================

    process.once(
        "SIGINT",
        () => {

            void shutdown(
                "SIGINT"
            );
        }
    );

    // =========================================================================
    // SIGTERM
    // =========================================================================

    process.once(
        "SIGTERM",
        () => {

            void shutdown(
                "SIGTERM"
            );
        }
    );
}

// =============================================================================
// APPLICATION START
// =============================================================================

void main().catch(
    (
        error
    ) => {

        console.error(
            "================================================="
        );

        console.error(
            "❌ FATALER STARTUP-FEHLER"
        );

        console.error(
            error
        );

        console.error(
            "================================================="
        );

        process.exit(
            1
        );
    }
);