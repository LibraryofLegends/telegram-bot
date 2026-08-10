/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaParser

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-MED-0003

LOL-ID..............: LOL-MED-0003

File................: media-parser.ts

Location............
Library Of Legends/src/domain/media/parser/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Parses media file names and extracts structured metadata
like title and release year.

This is a simplified and build-safe parser version.

===============================================================================
*/

export interface ParsedMedia {
    title: string;
    year?: number;
}

/**
 * Media Parser
 */
export class MediaParser {

    /**
     * Parse filename into structured media data
     */
    public static parse(fileName: string): ParsedMedia {

        // =========================================================================
        // CLEAN FILE NAME
        // =========================================================================

        const clean = fileName.replace(/\.[^/.]+$/, "");

        // =========================================================================
        // EXTRACT YEAR
        // =========================================================================

        const yearMatch = clean.match(/\b(19|20)\d{2}\b);

        let year: number | undefined = undefined;

        if (yearMatch) {
            year = parseInt(yearMatch[0]);
        }

        // =========================================================================
        // BUILD TITLE
        // =========================================================================

        let title = clean
            .replace(/\b(19|20)\d{2}\b/, "") // remove year
            .replace(/[._-]/g, " ")          // replace separators
            .replace(/\s+/g, " ")            // normalize spaces
            .trim();

        // =========================================================================
        // RESULT
        // =========================================================================

        return {
            title,
            year
        };
    }

}