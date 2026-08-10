/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesDetector

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-MED-0002

LOL-ID..............: LOL-MED-0002

File................: series-detector.ts

Location............
Library Of Legends/src/domain/media/detection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Detects and extracts structured information from series file names:
- Title
- Season
- Episode

Supports multiple common naming patterns.

===============================================================================
*/

export interface SeriesInfo {
    title: string;
    season: number;
    episode: number;
}

/**
 * Series Detector
 */
export class SeriesDetector {

    /**
     * Detect series info from filename
     */
    public static detect(fileName: string): SeriesInfo | null {

        const clean = fileName.replace(/\.[^/.]+$/, "");
        const lower = clean.toLowerCase();

        // =========================================================================
        // PATTERN 1: S01E01
        // =========================================================================

        const sxe = lower.match(/s(\d{1,2})e(\d{1,2})/);

        if (sxe) {
            const season = parseInt(sxe[1]);
            const episode = parseInt(sxe[2]);

            const title = this.extractTitle(clean, sxe[0]);

            return { title, season, episode };
        }

        // =========================================================================
        // PATTERN 2: 1x01
        // =========================================================================

        const xPattern = lower.match(/(\d{1,2})x(\d{1,2})/);

        if (xPattern) {
            const season = parseInt(xPattern[1]);
            const episode = parseInt(xPattern[2]);

            const title = this.extractTitle(clean, xPattern[0]);

            return { title, season, episode };
        }

        // =========================================================================
        // NOT A SERIES
        // =========================================================================

        return null;
    }

    /**
     * Extract clean title
     */
    private static extractTitle(fileName: string, match: string): string {

        return fileName
            .replace(match, "")
            .replace(/[._-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

}