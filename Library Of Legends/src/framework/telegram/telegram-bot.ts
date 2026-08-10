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

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram Bot with admin protection and channel auto post system.

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

    private adminIds: number[];
    private movieChannelId: string;

    public constructor(token: string) {

        this.bot = new Telegraf(token);

        // =========================================================================
        // ENV CONFIG
        // =========================================================================

        this.adminIds = (process.env.ADMIN_IDS || "")
            .split(",")
            .map(id => Number(id.trim()))
            .filter(id => !isNaN(id));

        this.movieChannelId = process.env.MOVIE_GROUP_ID || "";

        this.setup();

    }

    private setup(): void {

        // =========================================================================
        // START
        // =========================================================================

        this.bot.start((ctx) => {
            ctx.reply("🚀 Library Of Legends Bot aktiv.");
        });

        // =========================================================================
        // DOCUMENT HANDLER (AUTO POST)
        // =========================================================================

        this.bot.on("document", async (ctx) => {

            const userId = ctx.from?.id;

            // ❌ Nur Admin darf posten
            if (!userId || !this.adminIds.includes(userId)) {
                return;
            }

            const file = ctx.message.document;
            const fileName = file.file_name;

            if (!fileName) {
                return ctx.reply("❌ Datei ohne Namen.");
            }

            try {

                // =========================================================================
                // PARSE
                // =========================================================================

                const media = MediaParser.parse(fileName);

                // =========================================================================
                // BUILD POST
                // =========================================================================

                const post = TelegramPostBuilder.build(media, fileName);

                // =========================================================================
                // SEND TO CHANNEL 🔥
                // =========================================================================

                if (!this.movieChannelId) {
                    throw new Error("MOVIE_GROUP_ID fehlt");
                }

                await this.bot.telegram.sendMessage(
                    this.movieChannelId,
                    post
                );

                // Optional Feedback
                await ctx.reply("✅ Film wurde gepostet.");

            } catch (error) {

                console.error(error);

                await ctx.reply("❌ Fehler beim Posten.");

            }

        });

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Telegram Bot gestartet (Auto Post aktiv)");
    }

}