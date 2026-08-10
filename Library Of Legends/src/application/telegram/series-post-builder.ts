/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesPostBuilder

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-SPB-0001

LOL-ID..............: LOL-SPB-0001

File................: series-post-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Development

Description.........

Builds formatted Telegram posts for series episodes
including Library IDs.

===============================================================================
*/

import { MediaFile } from "../../domain/media/media-file/media-file";
import { SeriesDetector } from "../../domain/media/detection/series-detector";
import { LibraryIdGenerator } from "../../domain/library/library-id-generator";

/**
 * Series Post Builder
 */
export class SeriesPostBuilder {

    /**
     * Builds a formatted series Telegram post
     */
    public static build(fileName: string, media: MediaFile): string {

        const lines: string[] = [];

        // =========================================================================
        // LIBRARY ID 🔥
        // =========================================================================

        const libraryId = LibraryIdGenerator.next("SERIES");

        lines.push(`🆔 ${libraryId}`);
        lines.push("");

        // =========================================================================
        // DETECT SERIES INFO
        // =========================================================================

        const info = SeriesDetector.detect(fileName);

        if (info) {
            lines.push(`📺 ${info.title}`);
            lines.push(`📦 Staffel ${info.season} • Episode ${info.episode}`);
            lines.push("");
        } else {
            lines.push(`📺 ${fileName}`);
            lines.push("");
        }

        // =========================================================================
        // MEDIA INFO
        // =========================================================================

        lines.push(media.getVideoSummary());

        const audio = media.getAudioSummary();
        const subs = media.getSubtitleSummary();

        if (audio.length > 0) {
            lines.push(...audio);
        }

        if (subs.length > 0) {
            lines.push(...subs);
        }

        // =========================================================================
        // RESULT
        // =========================================================================

        return lines.join("\n");

    }

}