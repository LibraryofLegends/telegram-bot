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

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Handles /find command to search media in the database.

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
    public static async execute(query: string): Promise<string> {

        if (!query || query.trim().length === 0) {
            return "❌ Bitte Suchbegriff angeben.\n\nBeispiel:\n/find matrix";
        }

        const results = await LibraryRepository.search(query);

        if (results.length === 0) {
            return `❌ Keine Ergebnisse für: ${query}`;
        }

        // =========================================================================
        // BUILD RESPONSE
        // =========================================================================

        const lines: string[] = [];

        lines.push(`🔍 Ergebnisse für: "${query}"`);
        lines.push("");

        results.forEach((item: any, index: number) => {

            const emoji = item.type === "SERIES" ? "📺" : "🎬";

            lines.push(
                `${index + 1}. ${emoji} ${item.title}`
            );

        });

        return lines.join("\n");
    }

}