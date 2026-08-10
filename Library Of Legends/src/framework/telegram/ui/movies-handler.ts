/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MoviesHandler

Architecture Layer..: Framework

Module..............: Telegram UI

Module ID...........: LOL-MOD-TGUI-0002

LOL-ID..............: LOL-TGUI-0002

File................: movies-handler.ts

Location............
Library Of Legends/src/framework/telegram/ui/

Version.............: 1.0.0

Status..............: UI CORE

Lifecycle...........: Production

Description.........

Displays movies list with inline buttons.

===============================================================================
*/

import { Telegraf, Markup } from "telegraf";
import { LibraryRepository } from "../../../infrastructure/database/library-repository";

export class MoviesHandler {

    public static register(bot: Telegraf) {

        bot.hears("🎬 Filme", async (ctx) => {

            const movies = await LibraryRepository.search("");

            if (movies.length === 0) {
                return ctx.reply("❌ Keine Filme vorhanden.");
            }

            const buttons = movies.map((movie) => [
                Markup.button.callback(movie.title, `movie_${movie.id}`)
            ]);

            await ctx.reply(
                "🎬 Filme auswählen:",
                Markup.inlineKeyboard(buttons)
            );

        });

    }

}