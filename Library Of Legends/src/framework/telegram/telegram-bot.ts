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

Version.............: 2.2.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram Bot with TMDB integration (poster + description),
series threads, intelligent routing and post building.

(⚠️ MediaParser entfernt – stabile Build-Version)

===============================================================================
*/

import { Telegraf } from "telegraf";

import { MediaTypeDetector } from "../../domain/media/detection/media-type-detector";
import { SeriesDetector } from "../../domain/media/detection/series-detector";

import { TelegramPostBuilder } from "../../application/telegram/telegram-post-builder";
import { SeriesPostBuilder } from "../../application/telegram/series-post-builder";

import { SeriesTopicManager } from "./series-topic-manager";
import { TMDBClient } from "../../infrastructure/api/tmdb/tmdb-client";

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
            ctx.reply("🚀 Library Of Legends Bot (TMDB aktiv).");
        });

        this.bot.on("document", async (ctx) => {

            const userId = ctx.from?.id;

            if (!userId || !this.adminIds.includes(userId)) {
                return;
            }

            const file = ctx.message.document;
            const fileName = file.file_name;

            if (!fileName) {
                return ctx.reply("❌ Datei ohne Namen.");
            }

            try {

                const type = MediaTypeDetector.detect(fileName);

                // 🔥 Dummy Media (ersetzt MediaParser)
                const media: any = {
                    getVideoSummary: () => "🎬 Video: Unbekannt",
                    getAudioSummary: () => [],
                    getSubtitleSummary: () => []
                };

                let post = "";
                let title = fileName;

                // =========================================================================
                // BUILD BASE POST
                // =========================================================================

                if (type === "MOVIE") {
                    post = TelegramPostBuilder.build(media, fileName);
                }

                if (type === "SERIES") {
                    post = SeriesPostBuilder.build(fileName, media);

                    const info = SeriesDetector.detect(fileName);
                    if (info) {
                        title = info.title;
                    }
                }

                // =========================================================================
                // TMDB FETCH 🔥
                // =========================================================================

                let tmdb = null;

                try {
                    tmdb = type === "MOVIE"
                        ? await TMDBClient.searchMovie(title)
                        : await TMDBClient.searchSeries(title);
                } catch (e) {
                    console.warn("TMDB Fehler:", e);
                }

                let caption = post;

                if (tmdb) {

                    const overview = tmdb.overview
                        ? `\n\n📝 ${tmdb.overview.substring(0, 300)}...`
                        : "";

                    caption = `${post}${overview}`;
                }

                // =========================================================================
                // ROUTING + SEND 🔥
                // =========================================================================

                if (type === "MOVIE") {

                    if (tmdb?.posterPath) {

                        const posterUrl = `https://image.tmdb.org/t/p/w500${tmdb.posterPath}`;

                        await this.bot.telegram.sendPhoto(
                            this.movieChannelId,
                            posterUrl,
                            { caption }
                        );

                    } else {

                        await this.bot.telegram.sendMessage(
                            this.movieChannelId,
                            caption
                        );

                    }

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

                    if (tmdb?.posterPath) {

                        const posterUrl = `https://image.tmdb.org/t/p/w500${tmdb.posterPath}`;

                        await this.bot.telegram.sendPhoto(
                            this.seriesChannelId,
                            posterUrl,
                            {
                                caption,
                                message_thread_id: threadId
                            }
                        );

                    } else {

                        await this.bot.telegram.sendMessage(
                            this.seriesChannelId,
                            caption,
                            {
                                message_thread_id: threadId
                            }
                        );

                    }

                }

                await ctx.reply("✅ Mit TMDB gepostet.");

            } catch (error) {

                console.error(error);
                await ctx.reply("❌ Fehler beim Posten.");

            }

        });

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Bot gestartet (TMDB aktiv)");
    }

}