/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SearchCommand

Architecture Layer..: Framework

Module..............: Telegram Commands

Module ID...........: LOL-MOD-TGC-0001

LOL-ID..............: LOL-TGC-0001

File................: search-command.ts

Location............
Library Of Legends/src/framework/telegram/commands/

Version.............: 3.0.0

Status..............: CORE

Lifecycle...........: Production

Description.........

Handles /find command and returns media with file_id.

===============================================================================
*/

import { Telegraf } from "telegraf";
import { LibraryRepository } from "../../../infrastructure/database/library-repository";

export class SearchCommand {

    public static register(bot: Telegraf) {

        bot.command("find", async (ctx) => {

            const query = ctx.message.text.split(" ").slice(1).join(" ");

            if (!query) {
                return ctx.reply("❌ Bitte Suchbegriff eingeben.");
            }

            const results = await LibraryRepository.search(query);

            if (results.length === 0) {
                return ctx.reply("❌ Keine Ergebnisse gefunden.");
            }

            await ctx.reply(`🔍 Ergebnisse für: "${query}"`);

            for (const item of results) {

                await ctx.replyWithDocument(item.file_id, {
                    caption: `🎬 ${item.title}`
                });

            }

        });

    }

}