/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramPostBuilder

Layer...............: Application

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
     * Builds a formatted Telegram post
     */
    public static build(media: MediaFile, title?: string): string {

        const lines: string[] = [];

        // Title
        if (title) {
            lines.push(`🎬 ${title}`);
            lines.push("");
        }

        // Core Media Info
        lines.push(media.getVideoSummary());

        const audio = media.getAudioSummary();
        const subs = media.getSubtitleSummary();

        if (audio.length > 0) {
            lines.push(...audio);
        }

        if (subs.length > 0) {
            lines.push(...subs);
        }

        return lines.join("\n");

    }

}