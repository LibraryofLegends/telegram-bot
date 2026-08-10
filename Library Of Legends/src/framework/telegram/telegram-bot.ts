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

Telegram Bot with TMDB integration + Library Storage.

===============================================================================
*/

import { Telegraf } from "telegraf";

import { MediaTypeDetector } from "../../domain/media/detection/media-type-detector";
import { SeriesDetector } from "../../domain/media/detection/series-detector";

import { TelegramPostBuilder } from "../../application/telegram/telegram-post-builder";
import { SeriesPostBuilder } from "../../application/telegram/series-post-builder";

import { SeriesTopicManager } from "./series-topic-manager";
import { TMDBClient } from "../../infrastructure/api/tmdb/tmdb-client";

import { LibraryStore } from "../../domain/library/library-store";

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
            ctx.reply("🚀 Library Of Legends Bot (Archiv aktiv).");
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

                // 🔥 Titel bestimmen
                let title = fileName;

                if (type === "SERIES") {
                    const info = SeriesDetector.detect(fileName);
                    if (info) {
                        title = info.title;
                    }
                }

                // =========================================================================
                // 🔥 SPEICHERN IN LIBRARY
                // =========================================================================

                const item = LibraryStore.add(title, type, fileName);

                // =========================================================================
                // 🔥 DUMMY MEDIA (später ersetzen)
                // =========================================================================

                const media: any = {
                    getVideoSummary: () => "🎬 Video: Unbekannt",
                    getAudioSummary: () => [],
                    getSubtitleSummary: () => []
                };

                // =========================================================================
                // BUILD POST
                // =========================================================================

                let post = "";

                if (type === "MOVIE") {
                    post = TelegramPostBuilder.build(media, title);
                } else {
                    post = SeriesPostBuilder.build(title, media);
                }

                // 🔥 ID in Post einbauen
                post += `\n\n🆔 ${item.id}`;

                // =========================================================================
                // TMDB FETCH
                // =========================================================================

                let tmdb = null;

                try {
                    tmdb = type === "MOVIE"
                        ? await TMDBClient.searchMovie(title)
                        : await TMDBClient.searchSeries(title);
                } catch {}

                let caption = post;

                if (tmdb?.overview) {
                    caption += `\n\n📝 ${tmdb.overview.substring(0, 300)}...`;
                }

                // =========================================================================
                // SEND
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

                } else {

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

                await ctx.reply(`✅ Gespeichert: ${item.id}`);

            } catch (error) {

                console.error(error);
                await ctx.reply("❌ Fehler beim Posten.");

            }

        });

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Bot gestartet (Archiv aktiv)");
    }

}