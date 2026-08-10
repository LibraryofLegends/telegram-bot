/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SearchCommand

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TGB-0003

LOL-ID..............: LOL-TGB-0003

File................: search-command.ts

Location............
Library Of Legends/src/framework/telegram/commands/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Provides /find command to search library items.

===============================================================================
*/

import { Telegraf } from "telegraf";
import { LibraryRepository } from "../../../infrastructure/database/library-repository";

/**
 * Register Search Command
 */
export function registerSearchCommand(bot: Telegraf): void {

    bot.command("find", async (ctx) => {

        const query = ctx.message.text.split(" ").slice(1).join(" ");

        if (!query) {
            return ctx.reply("❌ Bitte Suchbegriff eingeben.\n\nBeispiel:\n/find matrix");
        }

        try {

            const items = await LibraryRepository.getAll();

            const results = items.filter(item =>
                item.title.toLowerCase().includes(query.toLowerCase())
            );

            if (results.length === 0) {
                return ctx.reply("❌ Keine Ergebnisse gefunden.");
            }

            const message = results
                .slice(0, 10)
                .map(item => `🎬 ${item.title}\n🆔 ${item.id}`)
                .join("\n\n");

            await ctx.reply(`🔎 Ergebnisse:\n\n${message}`);

        } catch (error) {

            console.error(error);
            await ctx.reply("❌ Fehler bei der Suche.");

        }

    });

}