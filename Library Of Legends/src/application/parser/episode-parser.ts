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

    public static parse(filename: string): EpisodeParseResult {

        const clean = this.clean(filename);

        return {
            title: this.getTitle(clean),
            ...this.getSE(clean),
            episodeTitle: this.getEpisodeTitle(clean),
            quality: this.getQuality(clean),
            source: this.getSource(clean),
            audio: this.getAudio(clean),
            videoCodec: this.getCodec(clean)
        };
    }

    private static clean(name: string): string {
        return name
            .replace(/\.[^.]+$/, "")
            .replace(/[._]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    private static getSE(name: string) {
        const m = name.match(/S(\d{1,2})E(\d{1,2})/i);
        if (!m) return {};
        return { season: +m[1], episode: +m[2] };
    }

    private static getTitle(name: string): string {
        return name.split(/S\d{1,2}E\d{1,2}/i)[0]?.trim() || "Unbekannt";
    }

    private static getEpisodeTitle(name: string): string | undefined {
        const part = name.split(/S\d{1,2}E\d{1,2}/i)[1];
        if (!part) return;
        return part.split(/(1080p|720p|WEB|BluRay|x264)/i)[0].trim();
    }

    private static getQuality(name: string) {
        return name.match(/(2160p|1080p|720p)/i)?.[1];
    }

    private static getSource(name: string) {
        return name.match(/(WEB-DL|WEB|BluRay|HDTV)/i)?.[1];
    }

    private static getAudio(name: string) {
        return name.match(/(DD5\.1|AAC|DTS|AC3)/i)?.[1];
    }

    private static getCodec(name: string) {
        return name.match(/(x264|x265|H264|H265)/i)?.[1];
    }
}