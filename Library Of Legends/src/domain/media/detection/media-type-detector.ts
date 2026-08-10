/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaTypeDetector

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-MED-0001

LOL-ID..............: LOL-MED-0001

File................: media-type-detector.ts

Location............
Library Of Legends/src/domain/media/detection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Detects whether a file is a MOVIE or a SERIES based on filename patterns.

===============================================================================
*/

export type MediaType = "MOVIE" | "SERIES";

/**
 * Media Type Detector
 */
export class MediaTypeDetector {

    /**
     * Detect media type
     */
    public static detect(fileName: string): MediaType {

        const lower = fileName.toLowerCase();

        // =========================================================================
        // SERIES PATTERNS
        // =========================================================================

        const isSeries =
            /s\d{1,2}e\d{1,2}/.test(lower) ||   // S01E01
            /\d{1,2}x\d{1,2}/.test(lower) ||    // 1x01
            /season\s?\d+/.test(lower) ||       // Season 1
            /episode\s?\d+/.test(lower);        // Episode 1

        if (isSeries) {
            return "SERIES";
        }

        // =========================================================================
        // DEFAULT → MOVIE
        // =========================================================================

        return "MOVIE";
    }

}