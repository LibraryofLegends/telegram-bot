/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SystemCommand

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TG-CMD-0001

LOL-ID..............: LOL-TG-CMD-SYS-0001

File................: system.command.ts

Location............
Library Of Legend/src/framework/telegram/commands/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Core system commands for Telegram bot.

Responsibilities:

- Handle /start command
- Handle /help command
- Provide basic user entry point
- Provide system information
- Provide command overview
- Ensure bot responsiveness
- Serve as base command layer

===============================================================================
*/

import { Telegraf, Context } from "telegraf";

/**
 * Registers all system-level commands.
 */
export function registerSystemCommands(
    bot: Telegraf<Context>
): void {

    // =========================================================================
    // /start
    // =========================================================================

    bot.start(async (ctx) => {

        await ctx.reply(
`
🚀 <b>Library Of Legends</b>

━━━━━━━━━━━━━━━━━━

Willkommen im Archiv.

Dieses System verwaltet:

🎬 Filme  
📺 Serien  
📚 Sammlungen  

━━━━━━━━━━━━━━━━━━

⚙️ Verfügbare Commands:

/start  – Start  
/help   – Hilfe  

━━━━━━━━━━━━━━━━━━

🔥 Status: Aktiv
`,
            {
                parse_mode: "HTML"
            }
        );

    });

    // =========================================================================
    // /help
    // =========================================================================

    bot.command("help", async (ctx) => {

        await ctx.reply(
`
📖 <b>Hilfe</b>

━━━━━━━━━━━━━━━━━━

📌 Aktuell verfügbar:

/start  – Startet den Bot  
/help   – Zeigt diese Hilfe  

━━━━━━━━━━━━━━━━━━

🚧 Kommende Features:

🎬 Film-System  
📺 Serien-System  
🔎 Suche  
⭐ Favoriten  

━━━━━━━━━━━━━━━━━━

📺 <b>Library Of Legends</b>
`,
            {
                parse_mode: "HTML"
            }
        );

    });

}