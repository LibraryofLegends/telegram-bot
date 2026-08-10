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

Version.............: 1.2.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram Bot with admin protection, auto parsing,
and intelligent channel routing (movie / series).

===============================================================================
*/

import { Telegraf } from "telegraf";

import { MediaParser } from "../../domain/media/parser/media-parser";
import { TelegramPostBuilder } from "../../application/telegram/telegram-post-builder";
import { MediaTypeDetector } from "../../domain/media/detection/media-type-detector";

/**
 * Telegram Bot
 */
export class TelegramBot {

    private bot: Telegraf;

    private adminIds: number[];
    private movieChannelId: string;
    private seriesChannelId: string;

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
        this.seriesChannelId = process.env.SERIES_GROUP_ID || "";

        this.setup();

    }

    private setup(): void {

        // =========================================================================
        // START
        // =========================================================================

        this.bot.start((ctx) => {
            ctx.reply("🚀 Library Of Legends Bot aktiv (Routing aktiv).");
        });

        // =========================================================================
        // DOCUMENT HANDLER
        // =========================================================================

        this.bot.on("document", async (ctx) => {

            const userId = ctx.from?.id;

            // ❌ Admin Check
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
                // DETECT TYPE 🔥
                // =========================================================================

                const type = MediaTypeDetector.detect(fileName);

                // =========================================================================
                // PARSE
                // =========================================================================

                const media = MediaParser.parse(fileName);

                // =========================================================================
                // BUILD POST
                // =========================================================================

                const post = TelegramPostBuilder.build(media, fileName);

                // =========================================================================
                // ROUTING 🔥
                // =========================================================================

                let targetChannel = "";

                if (type === "MOVIE") {
                    targetChannel = this.movieChannelId;
                }

                if (type === "SERIES") {
                    targetChannel = this.seriesChannelId;
                }

                if (!targetChannel) {
                    throw new Error("❌ Kein Channel konfiguriert");
                }

                // =========================================================================
                // SEND
                // =========================================================================

                await this.bot.telegram.sendMessage(
                    targetChannel,
                    post
                );

                // =========================================================================
                // FEEDBACK
                // =========================================================================

                await ctx.reply(`✅ ${type} wurde gepostet.`);

            } catch (error) {

                console.error(error);

                await ctx.reply("❌ Fehler beim Posten.");

            }

        });

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Bot gestartet (Auto Routing aktiv)");
    }

}