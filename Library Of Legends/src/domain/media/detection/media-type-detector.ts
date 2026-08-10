/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaTypeDetector

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-MTD-0001

LOL-ID..............: LOL-MTD-0001

File................: media-type-detector.ts

Location............
Library Of Legends/src/domain/media/detection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Detects whether a media file is a movie or a series episode
based on filename patterns.

===============================================================================
*/

/**
 * Media Types
 */
export type MediaType = "MOVIE" | "SERIES";

/**
 * Media Type Detector
 */
export class MediaTypeDetector {

    /**
     * Detect media type from file name
     */
    public static detect(fileName: string): MediaType {

        const name = fileName.toUpperCase();

        // =========================================================================
        // SERIES PATTERNS
        // =========================================================================

        const seriesPatterns = [
            /S\d{1,2}E\d{1,2}/,     // S01E01
            /\d{1,2}x\d{1,2}/,      // 1x01
            /SEASON\s?\d/,          // Season 1
            /EPISODE\s?\d/          // Episode 1
        ];

        for (const pattern of seriesPatterns) {
            if (pattern.test(name)) {
                return "SERIES";
            }
        }

        // =========================================================================
        // DEFAULT
        // =========================================================================

        return "MOVIE";

    }

}