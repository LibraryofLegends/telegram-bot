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

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Minimal application bootstrap for Render + Telegram.

Phase 2 contains only:

- configuration
- Telegram bot
- HTTP health server

===============================================================================
*/

import * as http from "http";

import {
    loadConfig
} from "./config/config";

import {
    TelegramBot
} from "./framework/telegram/telegram-bot";

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

    const config =
        loadConfig();

    console.log(
        "✅ Konfiguration geladen."
    );

    const bot =
        new TelegramBot(
            config
        );

    await bot.launch();

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

    server.listen(
        config.port,
        () => {

            console.log(
                `🌐 HTTP Server läuft auf Port ${config.port}`
            );

            console.log(
                "🤖 Library Of Legends Bot gestartet."
            );

            console.log(
                "================================================="
            );
        }
    );

    const shutdown =
        async (
            signal: string
        ): Promise<void> => {

            console.log(
                `🛑 ${signal} erhalten.`
            );

            server.close(
                async () => {

                    await bot.stop(
                        signal
                    );

                    process.exit(
                        0
                    );
                }
            );
        };

    process.once(
        "SIGINT",
        () => {
            void shutdown(
                "SIGINT"
            );
        }
    );

    process.once(
        "SIGTERM",
        () => {
            void shutdown(
                "SIGTERM"
            );
        }
    );
}

main().catch(
    (
        error
    ) => {

        console.error(
            "❌ Startup fehlgeschlagen:",
            error
        );

        process.exit(
            1
        );
    }
);
