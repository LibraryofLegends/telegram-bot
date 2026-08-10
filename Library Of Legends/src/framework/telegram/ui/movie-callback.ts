/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MovieCallback

Architecture Layer..: Framework

Module..............: Telegram UI

Module ID...........: LOL-MOD-TGUI-0003

LOL-ID..............: LOL-TGUI-0003

File................: movie-callback.ts

Location............
Library Of Legends/src/framework/telegram/ui/

Version.............: 1.0.0

Status..............: UI CORE

Lifecycle...........: Production

Description.........

Handles movie button clicks and sends file.

===============================================================================
*/

import { Telegraf } from "telegraf";
import { LibraryRepository } from "../../../infrastructure/database/library-repository";

export class MovieCallback {

    public static register(bot: Telegraf) {

        bot.action(/movie_(.+)/, async (ctx) => {

            const id = ctx.match[1];

            const results = await LibraryRepository.search("");

            const movie = results.find(m => m.id == id);

            if (!movie) {
                return ctx.answerCbQuery("❌ Film nicht gefunden");
            }

            await ctx.replyWithDocument(movie.file_id, {
                caption: `🎬 ${movie.title}`
            });

        });

    }

}