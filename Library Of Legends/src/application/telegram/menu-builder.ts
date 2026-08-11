/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MenuBuilder

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-MENU-0001

LOL-ID..............: LOL-TG-MENU-0001

File................: menu-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Netflix-style main menu system.

===============================================================================
*/

export class MenuBuilder {

    public static mainMenu() {

        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "▶️ Weiter schauen", callback_data: "continue" }
                    ],
                    [
                        { text: "🔥 Trending", callback_data: "trending" },
                        { text: "📺 Serien", callback_data: "series" }
                    ],
                    [
                        { text: "🎬 Filme", callback_data: "movies" },
                        { text: "⭐ Favoriten", callback_data: "favorites" }
                    ],
                    [
                        { text: "🔎 Suche", callback_data: "search" }
                    ]
                ]
            }
        };
    }
}