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

Version.............: 3.0.0

Status..............: CORE SYSTEM (FILE-ID ENABLED)

Lifecycle...........: Production

Description.........

Telegram Bot with:
- File Upload Detection
- Auto Save to Database
- Search System (/find)
- File-ID Playback System

===============================================================================
*/

import { Telegraf } from "telegraf";
import { LibraryRepository } from "../../infrastructure/database/library-repository";
import { SearchCommand } from "./commands/search-command";

export class TelegramBot {

    private bot: Telegraf;
    private adminIds: number[];

    constructor(token: string) {

        this.bot = new Telegraf(token);

        this.adminIds = (process.env.ADMIN_IDS || "")
            .split(",")
            .map(id => Number(id.trim()))
            .filter(id => !isNaN(id));

        this.setup();
    }

    private setup(): void {

        // =========================================================================
        // START
        // =========================================================================

        this.bot.start((ctx) => {
            ctx.reply("🚀 Library Of Legends Bot (FULL SYSTEM AKTIV)");
        });

        // =========================================================================
        // COMMANDS
        // =========================================================================

        SearchCommand.register(this.bot);

        // =========================================================================
        // FILE UPLOAD
        // =========================================================================

        this.bot.on("document", async (ctx) => {

            const userId = ctx.from?.id;

            if (!userId || !this.adminIds.includes(userId)) {
                return;
            }

            const file = ctx.message.document;
            const fileName = file.file_name || "Unbekannt";
            const fileId = file.file_id;

            try {

                const title = fileName.replace(/\.[^/.]+$/, "");

                const type = fileName.toLowerCase().includes("s01")
                    ? "SERIES"
                    : "MOVIE";

                await LibraryRepository.save(
                    title,
                    fileName,
                    type,
                    fileId
                );

                await ctx.reply("✅ Datei verarbeitet & gespeichert!");

            } catch (error) {

                console.error(error);
                await ctx.reply("❌ Fehler beim Speichern.");

            }

        });

    }

    public launch(): void {
        this.bot.launch();
        console.log("🤖 Bot gestartet (FULL SYSTEM)");
    }

}