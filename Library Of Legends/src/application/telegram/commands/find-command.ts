/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: FindCommand

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TGB-0003

LOL-ID..............: LOL-TGB-0003

File................: find-command.ts

Location............
Library Of Legends/src/application/telegram/commands/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Handles /find command with interactive buttons.

===============================================================================
*/

import { LibraryRepository } from "../../../infrastructure/database/library-repository";

/**
 * Find Command
 */
export class FindCommand {

    /**
     * Execute search
     */
    public static async execute(query: string) {

        if (!query || query.trim().length === 0) {
            return {
                text: "❌ Bitte Suchbegriff angeben.\n\nBeispiel:\n/find matrix",
                buttons: []
            };
        }

        const results = await LibraryRepository.search(query);

        if (results.length === 0) {
            return {
                text: `❌ Keine Ergebnisse für: ${query}`,
                buttons: []
            };
        }

        // =========================================================================
        // BUILD RESPONSE
        // =========================================================================

        let text = `🔍 Ergebnisse für: "${query}"\n\n`;

        const buttons: any[] = [];

        results.forEach((item: any, index: number) => {

            const emoji = item.type === "SERIES" ? "📺" : "🎬";

            text += `${emoji} ${item.title}\n`;

            buttons.push([
                {
                    text: `📥 ${item.title}`,
                    callback_data: `download_${item.id}`
                }
            ]);
        });

        return {
            text,
            buttons
        };
    }

}