/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramPostBuilder

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TGB-0001

LOL-ID..............: LOL-TGB-0001

File................: telegram-post-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Development

Description.........

Builds formatted Telegram posts for movies including Library IDs.

===============================================================================
*/

import { MediaFile } from "../../domain/media/media-file/media-file";
import { LibraryIdGenerator } from "../../domain/library/library-id-generator";

/**
 * Telegram Post Builder
 */
export class TelegramPostBuilder {

    /**
     * Builds a formatted Telegram post
     */
    public static build(media: MediaFile, title?: string): string {

        const lines: string[] = [];

        // =========================================================================
        // LIBRARY ID 🔥
        // =========================================================================

        const libraryId = LibraryIdGenerator.next("MOVIE");

        lines.push(`🆔 ${libraryId}`);
        lines.push("");

        // =========================================================================
        // TITLE
        // =========================================================================

        if (title) {
            lines.push(`🎬 ${title}`);
            lines.push("");
        }

        // =========================================================================
        // VIDEO
        // =========================================================================

        lines.push(media.getVideoSummary());

        // =========================================================================
        // AUDIO
        // =========================================================================

        const audio = media.getAudioSummary();

        if (audio.length > 0) {
            lines.push(...audio);
        }

        // =========================================================================
        // SUBTITLES
        // =========================================================================

        const subtitles = media.getSubtitleSummary();

        if (subtitles.length > 0) {
            lines.push(...subtitles);
        }

        // =========================================================================
        // RESULT
        // =========================================================================

        return lines.join("\n");

    }

}