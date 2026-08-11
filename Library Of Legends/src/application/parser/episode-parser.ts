/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EpisodeParser

Architecture Layer..: Application

Module..............: Parser

Module ID...........: LOL-MOD-PARSER-0001

LOL-ID..............: LOL-PARSER-EP-0001

File................: episode-parser.ts

Location............
Library Of Legends/src/application/parser/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Automatic filename parser for Series Episodes.

Detects:
- Series title
- Season / Episode
- Episode title
- Quality
- Source
- Audio
- Video codec

===============================================================================
*/

export interface EpisodeParseResult {

    title: string;

    season?: number;

    episode?: number;

    episodeTitle?: string;

    quality?: string;

    source?: string;

    audio?: string;

    videoCodec?: string;
}

export class EpisodeParser {

    // =========================================================================
    // MAIN PARSER
    // =========================================================================

    public static parse(
        filename: string
    ): EpisodeParseResult {

        const clean =
            this.cleanFilename(filename);

        const seasonEpisode =
            this.extractSeasonEpisode(clean);

        const quality =
            this.extractQuality(clean);

        const source =
            this.extractSource(clean);

        const audio =
            this.extractAudio(clean);

        const codec =
            this.extractCodec(clean);

        const episodeTitle =
            this.extractEpisodeTitle(clean);

        const title =
            this.extractSeriesTitle(clean);

        return {
            title,
            season: seasonEpisode?.season,
            episode: seasonEpisode?.episode,
            episodeTitle,
            quality,
            source,
            audio,
            videoCodec: codec
        };
    }

    // =========================================================================
    // CLEAN
    // =========================================================================

    private static cleanFilename(
        name: string
    ): string {

        return name
            .replace(/\.[^.]+$/, "") // extension
            .replace(/[._]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // =========================================================================
    // SxxEyy
    // =========================================================================

    private static extractSeasonEpisode(
        name: string
    ) {

        const match =
            name.match(/S(\d{1,2})E(\d{1,2})/i);

        if (!match) return;

        return {
            season: Number(match[1]),
            episode: Number(match[2])
        };
    }

    // =========================================================================
    // TITLE
    // =========================================================================

    private static extractSeriesTitle(
        name: string
    ): string {

        const match =
            name.split(/S\d{1,2}E\d{1,2}/i)[0];

        return match?.trim() || "Unbekannt";
    }

    // =========================================================================
    // EPISODE TITLE
    // =========================================================================

    private static extractEpisodeTitle(
        name: string
    ): string | undefined {

        const match =
            name.split(/S\d{1,2}E\d{1,2}/i)[1];

        if (!match) return;

        const cleaned =
            match
                .split(/(1080p|720p|2160p|WEB|BluRay|x264|x265)/i)[0]
                .trim();

        return cleaned || undefined;
    }

    // =========================================================================
    // QUALITY
    // =========================================================================

    private static extractQuality(
        name: string
    ): string | undefined {

        const match =
            name.match(/(2160p|1080p|720p|480p)/i);

        return match?.[1];
    }

    // =========================================================================
    // SOURCE
    // =========================================================================

    private static extractSource(
        name: string
    ): string | undefined {

        const match =
            name.match(/(WEB-DL|WEB|BluRay|HDTV)/i);

        return match?.[1];
    }

    // =========================================================================
    // AUDIO
    // =========================================================================

    private static extractAudio(
        name: string
    ): string | undefined {

        const match =
            name.match(/(DD5\.1|AAC|DTS|AC3)/i);

        return match?.[1];
    }

    // =========================================================================
    // CODEC
    // =========================================================================

    private static extractCodec(
        name: string
    ): string | undefined {

        const match =
            name.match(/(x264|x265|H264|H265)/i);

        return match?.[1];
    }
}