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

Version.............: 2.0.2

Status..............: Core

Lifecycle...........: Production

Description.........

Stable Render application bootstrap.

Responsibilities:

- Load application configuration
- Start HTTP server BEFORE Telegram polling
- Keep Render Web Service port permanently open
- Start Telegram polling asynchronously
- Handle Telegram startup errors
- Handle graceful shutdown
- Prevent Render restart loops caused by missing ports

Important:

The Telegram polling process MUST NOT block the HTTP server startup.

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

    // =========================================================================
    // PROJECT START
    // =========================================================================

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
    // TELEGRAM BOT INSTANCE
    // =========================================================================

    const bot =
        new TelegramBot(
            config
        );

    // =========================================================================
    // HTTP SERVER
    // =========================================================================
    //
    // Render MUST see an open port before Telegram polling starts.
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
    // START HTTP SERVER FIRST
    // =========================================================================

    await new Promise<void>(
        (
            resolve,
            reject
        ) => {

            const onError =
                (
                    error: Error
                ) => {

                    server.removeListener(
                        "listening",
                        onListening
                    );

                    reject(
                        error
                    );
                };

            const onListening =
                () => {

                    server.removeListener(
                        "error",
                        onError
                    );

                    resolve();
                };

            server.once(
                "error",
                onError
            );

            server.once(
                "listening",
                onListening
            );

            server.listen(
                config.port,
                "0.0.0.0"
            );
        }
    );

    // =========================================================================
    // HTTP SERVER IS NOW READY
    // =========================================================================

    console.log(
        "================================================="
    );

    console.log(
        `🌐 HTTP Server läuft auf Port ${config.port}`
    );

    console.log(
        "✅ Render Health Server aktiv"
    );

    console.log(
        "================================================="
    );

    // =========================================================================
    // START TELEGRAM ASYNCHRONOUSLY
    // =========================================================================
    //
    // IMPORTANT:
    //
    // Do NOT await bot.launch() here.
    //
    // The HTTP server is already running and must remain available
    // independently of Telegram polling.
    //
    // =========================================================================

    void bot.launch()
        .then(
            () => {

                console.log(
                    "================================================="
                );

                console.log(
                    "🤖 TELEGRAM BOT ONLINE"
                );

                console.log(
                    "✅ Telegram Polling aktiv"
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

                /*
                 * IMPORTANT:
                 *
                 * Do NOT immediately terminate the HTTP process here.
                 *
                 * Render must keep the health server alive so that
                 * the deployment itself remains observable.
                 */
            }
        );

    // =========================================================================
    // READY
    // =========================================================================

    console.log(
        "================================================="
    );

    console.log(
        "🚀 LIBRARY OF LEGENDS"
    );

    console.log(
        "✅ Anwendung gestartet"
    );

    console.log(
        "✅ HTTP Server aktiv"
    );

    console.log(
        "⏳ Telegram Bot wird im Hintergrund gestartet"
    );

    console.log(
        "================================================="
    );

    // =========================================================================
    // GRACEFUL SHUTDOWN
    // =========================================================================

    const shutdown =
        async (
            signal: string
        ): Promise<void> => {

            console.log(
                "================================================="
            );

            console.log(
                `🛑 ${signal} erhalten`
            );

            console.log(
                "🧹 Fahre Anwendung sauber herunter..."
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
                        "✅ HTTP Server beendet"
                    );

                    console.log(
                        "👋 PROJECT PHOENIX beendet"
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
// START APPLICATION
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