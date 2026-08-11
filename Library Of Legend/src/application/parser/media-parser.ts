/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Media Parser

Architecture Layer..: Application

Module..............: Parser

File................: media-parser.ts

===============================================================================
*/

export interface ParsedMedia {
    type: "movie" | "series" | "unknown";
    title: string;
    year?: number;
    quality?: string;
    source?: string;
}

// =============================================================================
// PARSER FUNCTION (WICHTIG: EXPORT NAME!)
// =============================================================================

export function parseMedia(fileName: string): ParsedMedia {

    const clean =
        fileName.replace(/\.[^/.]+$/, "");

    // Titel + Jahr erkennen
    const match =
        clean.match(/(.+?)\s*-\s*(\d{4})/);

    if (match) {
        return {
            type: "movie",
            title: match[1].trim(),
            year: Number(match[2])
        };
    }

    return {
        type: "unknown",
        title: clean
    };
}