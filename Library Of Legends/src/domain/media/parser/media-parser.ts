/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaParser

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-PRS-0001

LOL-ID..............: LOL-PRS-0001

File................: media-parser.ts

Location............
Library Of Legends/src/domain/media/parser/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Parses file names into structured media data.

===============================================================================
*/

import { EntityId } from "../../shared/domain/identifiers/entity-id";

import { MediaFile } from "../media-file/media-file";

import {
    VideoStream,
    VideoStreamId,
    VideoResolution,
    VideoCodec
} from "../video-stream";

import {
    AudioStream,
    AudioStreamId,
    AudioLanguage,
    AudioCodec,
    AudioChannels
} from "../audio-stream";

import {
    SubtitleStream,
    SubtitleStreamId,
    SubtitleLanguage,
    SubtitleFormat,
    SubtitleType
} from "../subtitle-stream";

/**
 * Media Parser
 */
export class MediaParser {

    public static parse(fileName: string): MediaFile {

        const media = new MediaFile(
            new EntityId(`MDF-${Date.now()}`)
        );

        const upper = fileName.toUpperCase();

        // =============================================================
        // VIDEO
        // =============================================================

        const resolution = this.detectResolution(upper);
        const codec = this.detectVideoCodec(upper);

        if (resolution && codec) {

            media.addVideoStream(
                new VideoStream(
                    new VideoStreamId(`VST-${Date.now()}`),
                    new VideoResolution(resolution),
                    new VideoCodec(codec)
                )
            );

        }

        // =============================================================
        // AUDIO
        // =============================================================

        const language = this.detectLanguage(upper);
        const audioCodec = this.detectAudioCodec(upper);
        const channels = this.detectChannels(upper);

        if (language && audioCodec && channels) {

            media.addAudioStream(
                new AudioStream(
                    new AudioStreamId(`AST-${Date.now()}`),
                    new AudioLanguage(language),
                    new AudioCodec(audioCodec),
                    new AudioChannels(channels)
                )
            );

        }

        // =============================================================
        // SUBTITLES
        // =============================================================

        const subLang = this.detectLanguage(upper);
        const subFormat = this.detectSubtitleFormat(upper);
        const subType = this.detectSubtitleType(upper);

        if (subLang && subFormat && subType) {

            media.addSubtitleStream(
                new SubtitleStream(
                    new SubtitleStreamId(`SST-${Date.now()}`),
                    new SubtitleLanguage(subLang),
                    new SubtitleFormat(subFormat),
                    new SubtitleType(subType)
                )
            );

        }

        return media;

    }

    // =============================================================
    // DETECTION METHODS
    // =============================================================

    private static detectResolution(name: string): string | null {

        if (name.includes("2160P") || name.includes("4K")) return "4K";
        if (name.includes("1080P")) return "1080p";
        if (name.includes("720P")) return "720p";
        if (name.includes("480P")) return "480p";

        return null;

    }

    private static detectVideoCodec(name: string): string | null {

        if (name.includes("H265") || name.includes("HEVC")) return "H265";
        if (name.includes("H264") || name.includes("AVC")) return "H264";
        if (name.includes("AV1")) return "AV1";

        return null;

    }

    private static detectAudioCodec(name: string): string | null {

        if (name.includes("TRUEHD")) return "TRUEHD";
        if (name.includes("DTS")) return "DTS";
        if (name.includes("EAC3") || name.includes("DDP")) return "EAC3";
        if (name.includes("AC3") || name.includes("DD")) return "AC3";
        if (name.includes("AAC")) return "AAC";

        return null;

    }

    private static detectChannels(name: string): string | null {

        if (name.includes("7.1")) return "7.1";
        if (name.includes("5.1")) return "5.1";
        if (name.includes("2.0") || name.includes("STEREO")) return "2.0";

        return null;

    }

    private static detectLanguage(name: string): string | null {

        if (name.includes("GERMAN") || name.includes("DEUTSCH")) return "DE";
        if (name.includes("ENGLISH") || name.includes("ENG")) return "EN";
        if (name.includes("MULTI")) return "MULTI";

        return null;

    }

    private static detectSubtitleFormat(name: string): string | null {

        if (name.includes("SRT")) return "SRT";
        if (name.includes("ASS")) return "ASS";
        if (name.includes("PGS") || name.includes("SUP")) return "PGS";

        return null;

    }

    private static detectSubtitleType(name: string): string | null {

        if (name.includes("FORCED")) return "FORCED";
        if (name.includes("SDH") || name.includes("HI")) return "SDH";

        return "FULL";

    }

}