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

Version.............: 2.3.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram Bot (STABLE BUILD) – ohne MediaParser

===============================================================================
*/

import { Telegraf } from "telegraf";

import { MediaTypeDetector } from "../../domain/media/detection/media-type-detector";
import { SeriesDetector } from "../../domain/media/detection/series-detector";

import { SeriesTopicManager } from "./series-topic-manager";
import { TMDBClient } from "../../infrastructure/api/tmdb/tmdb-client";

export class TelegramBot {

    private bot: Telegraf;

    private adminIds: number[];
    private movieChannelId: string;
    private seriesChannelId: string;

    public constructor(token: string) {

        this.bot = new Telegraf(token);

        this.adminIds = (process.env.ADMIN_IDS || "")
            .split(",")
            .map(id => Number(id.trim()))
            .filter(id => !isNaN(id));

        this.movieChannelId = process.env.MOVIE_GROUP_ID || "";
        this.seriesChannelId = process.env.SERIES_GROUP_ID || "";

        this.setup();
    }

    private setup(): void {

        this.bot.start((ctx) => {
            ctx.reply("🚀 Library Of Legends Bot (STABLE)");
        });

        // DOCUMENT
        this.bot.on("document", async (ctx) => {
            const fileName = ctx.message.document.file_name;
            await this.handleFile(ctx, fileName);
        });

        // VIDEO 🔥
        this.bot.on("video", async (ctx) => {
            const video = ctx.message.video;
            const fileName = video.file_name || `video_${Date.now()}.mp4`;
            await this.handleFile(ctx, fileName);
        });

    }

    private async handleFile(ctx: any, fileName?: string) {

        const userId = ctx.from?.id;

        if (!userId || !this.adminIds.includes(userId)) {
            return;
        }

        if (!fileName) {
            return ctx.reply("❌ Kein Dateiname erkannt.");
        }

        try {

            const type = MediaTypeDetector.detect(fileName);

            let title = fileName;

            if (type === "SERIES") {
                const info = SeriesDetector.detect(fileName);
                if (info) {
                    title = info.title;
                }
            }

            let tmdb = null;

            try {
                tmdb = type === "MOVIE"
                    ? await TMDBClient.searchMovie(title)
                    : await TMDBClient.searchSeries(title);
            } catch {}

            let caption = `🎬 ${title}`;

            if (tmdb?.overview) {
                caption += `\n\n📝 ${tmdb.overview.substring(0, 300)}...`;
            }

            // SEND
            if (type === "MOVIE") {

                await this.bot.telegram.sendMessage(
                    this.movieChannelId,
                    caption
                );

            } else if (type === "SERIES") {

                const seriesInfo = SeriesDetector.detect(fileName);

                if (!seriesInfo) {
                    throw new Error("❌ Series nicht erkannt");
                }

                const threadId = await SeriesTopicManager.getOrCreateTopic(
                    this.bot,
                    this.seriesChannelId,
                    seriesInfo.title
                );

                await this.bot.telegram.sendMessage(
                    this.seriesChannelId,
                    caption,
                    {
                        message_thread_id: threadId
                    }
                );
            }

            await ctx.reply("✅ Datei verarbeitet!");

        } catch (error) {

            console.error(error);
            await ctx.reply("❌ Fehler beim Verarbeiten.");

        }

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Bot gestartet (STABLE)");
    }

}