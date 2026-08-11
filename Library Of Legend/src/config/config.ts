/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: AppConfig

Architecture Layer..: Application

Module..............: Configuration

Module ID...........: LOL-MOD-CONFIG-0001

LOL-ID..............: LOL-CONFIG-0001

File................: config.ts

Location............
Library Of Legend/src/config/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Single source of truth for the Phase 2 runtime configuration.

Current configuration:

- Telegram bot token
- Render HTTP port

Not yet configured:

- Database
- TMDB
- Movie groups
- Series groups

Those are intentionally introduced in later phases.

===============================================================================
*/

export interface AppConfig {

    telegramBotToken: string;

    port: number;
}

function required(
    name: string,
    value: string | undefined
): string {

    const clean =
        String(
            value ?? ""
        ).trim();

    if (!clean) {

        throw new Error(
            `Konfigurationsvariable fehlt: ${name}`
        );
    }

    return clean;
}

export function loadConfig(): AppConfig {

    const telegramBotToken =
        required(
            "TELEGRAM_BOT_TOKEN oder TOKEN",
            process.env.TELEGRAM_BOT_TOKEN ||
            process.env.TOKEN
        );

    const portValue =
        Number(
            process.env.PORT ||
            3000
        );

    return {

        telegramBotToken,

        port:
            Number.isFinite(
                portValue
            )
                ? portValue
                : 3000
    };
}