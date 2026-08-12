/*
===============================================================================

                        LIBRARY OF LEGENDS
                        MENU HANDLER

===============================================================================
*/

import { Markup } from "telegraf";

export class MenuHandler {

    // =========================================================================
    // MAIN MENU
    // =========================================================================

    public static mainMenu() {

        return Markup.inlineKeyboard([

            [
                Markup.button.callback("🎬 Filme", "MENU_MOVIES"),
                Markup.button.callback("📺 Serien", "MENU_SERIES")
            ],

            [
                Markup.button.callback("🔥 Trending", "MENU_TRENDING"),
                Markup.button.callback("🏆 Top 100", "MENU_TOP")
            ],

            [
                Markup.button.callback("🎭 Genres", "MENU_GENRES"),
                Markup.button.callback("🔎 Suche", "MENU_SEARCH")
            ]

        ]);
    }

    // =========================================================================
    // GENRES MENU
    // =========================================================================

    public static genresMenu() {

        return Markup.inlineKeyboard([

            [
                Markup.button.callback("💥 Action", "GENRE_Action"),
                Markup.button.callback("👻 Horror", "GENRE_Horror")
            ],

            [
                Markup.button.callback("🤖 Sci-Fi", "GENRE_Science"),
                Markup.button.callback("😂 Komödie", "GENRE_Comedy")
            ],

            [
                Markup.button.callback("🎭 Drama", "GENRE_Drama"),
                Markup.button.callback("🕵️ Krimi", "GENRE_Crime")
            ],

            [
                Markup.button.callback("🔙 Zurück", "BACK_MAIN")
            ]

        ]);
    }
}