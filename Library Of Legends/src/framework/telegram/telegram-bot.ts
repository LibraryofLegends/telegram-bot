/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramBot

Architecture Layer..: Framework

Module..............: Telegram

Module ID...........: LOL-MOD-TGB-0002

LOL-ID..............: LOL-TGB-0002

File................: telegram-bot.ts

Location............
Library Of Legends/src/framework/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram Bot integration using Telegraf.
Automatically parses media files and posts formatted output.

===============================================================================
*/

import { Telegraf } from "telegraf";

import { MediaParser } from "../../domain/media/parser/media-parser";
import { TelegramPostBuilder } from "../../application/telegram/telegram-post-builder";

/**
 * Telegram Bot
 */
export class TelegramBot {

    private bot: Telegraf;

    public constructor(token: string) {
        this.bot = new Telegraf(token);
        this.setup();
    }

    private setup(): void {

        // =========================================================================
        // START COMMAND
        // =========================================================================

        this.bot.start((ctx) => {
            ctx.reply("🚀 Library Of Legends Bot ist aktiv.");
        });

        // =========================================================================
        // FILE HANDLER (AUTO PARSE)
        // =========================================================================

        this.bot.on("document", async (ctx) => {

            const file = ctx.message.document;
            const fileName = file.file_name;

            if (!fileName) {
                return ctx.reply("❌ Datei hat keinen Namen.");
            }

            try {

                // Parse Media
                const media = MediaParser.parse(fileName);

                // Build Post
                const post = TelegramPostBuilder.build(media, fileName);

                // Send Result
                await ctx.reply(post);

            } catch (error) {

                console.error(error);

                await ctx.reply("❌ Fehler beim Verarbeiten der Datei.");

            }

        });

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Telegram Bot gestartet");
    }

}