/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MenuHandler

Architecture Layer..: Framework

Module..............: Telegram UI

Module ID...........: LOL-MOD-TGUI-0001

LOL-ID..............: LOL-TGUI-0001

File................: menu-handler.ts

Location............
Library Of Legends/src/framework/telegram/ui/

Version.............: 1.0.0

Status..............: UI CORE

Lifecycle...........: Production

Description.........

Main menu with buttons (Netflix style navigation).

===============================================================================
*/

import { Telegraf, Markup } from "telegraf";

export class MenuHandler {

    public static register(bot: Telegraf) {

        bot.start((ctx) => {

            ctx.reply(
                "🎬 *Library Of Legends*\n\nWähle eine Option:",
                {
                    parse_mode: "Markdown",
                    ...Markup.keyboard([
                        ["🎬 Filme", "🔎 Suche"]
                    ]).resize()
                }
            );

        });

    }

}