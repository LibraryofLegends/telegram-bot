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

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Builds formatted Telegram posts from MediaFile.

===============================================================================
*/

import { MediaFile } from "../../domain/media/media-file/media-file";

/**
 * Telegram Post Builder
 */
export class TelegramPostBuilder {

    /**
     * Builds a formatted Telegram post.
     *
     * @param media Media file aggregate.
     * @param title Optional title.
     * @returns Formatted Telegram message.
     */
    public static build(media: MediaFile, title?: string): string {

        const lines: string[] = [];

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