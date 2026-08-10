/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesDetector

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SDT-0001

LOL-ID..............: LOL-SDT-0001

File................: series-detector.ts

Location............
Library Of Legends/src/domain/media/detection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Extracts series name, season, and episode from filename.

===============================================================================
*/

/**
 * Series Info Result
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

    public static detect(fileName: string): SeriesInfo | null {

        const name = fileName.replace(/\./g, " ");

        // =========================================================================
        // S01E01 Pattern
        // =========================================================================

        const match = name.match(/(.*?)[\s\-_.]?S(\d{1,2})E(\d{1,2})/i);

        if (match) {

            const title = match[1]
                .replace(/\d{3,4}/g, "") // remove year
                .trim();

            const season = parseInt(match[2], 10);
            const episode = parseInt(match[3], 10);

            return {
                title: title,
                season,
                episode
            };

        }

        // =========================================================================
        // 1x01 Pattern
        // =========================================================================

        const altMatch = name.match(/(.*?)[\s\-_.]?(\d{1,2})x(\d{1,2})/i);

        if (altMatch) {

            const title = altMatch[1]
                .replace(/\d{3,4}/g, "")
                .trim();

            const season = parseInt(altMatch[2], 10);
            const episode = parseInt(altMatch[3], 10);

            return {
                title,
                season,
                episode
            };

        }

        return null;

    }

}