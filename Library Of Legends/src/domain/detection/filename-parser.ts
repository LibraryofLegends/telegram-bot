/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: FilenameParser

Architecture Layer..: Domain

Module..............: Detection

Module ID...........: LOL-MOD-DET-0002

LOL-ID..............: LOL-DET-FILE-0001

File................: filename-parser.ts

Location............
Library Of Legends/src/domain/detection/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Automatic filename parser for Library Of Legends.

Responsibilities:

- Extract clean media title
- Detect release year
- Detect movie or series
- Detect season
- Detect episode
- Detect quality
- Detect resolution
- Detect source
- Detect audio
- Detect video codec
- Detect audio codec
- Detect HDR
- Detect file extension
- Remove technical filename information from title
- Support German and English filenames
- Support common release naming conventions
- Never crash on malformed filenames

Examples:

Superman II – Allein gegen alle | 1980.mp4

Superman.S01E01.1080p.WEB-DL.German.DD5.1.x264.mkv

The.Matrix.1999.2160p.UHD.BluRay.HEVC.DTS.mkv

===============================================================================
*/

import {
    MediaTypeDetector,
    MediaType
} from "./media-type-detector";

/**
 * Parsed media information.
 */
export interface ParsedMedia {

    originalFileName: string;

    title: string;

    year?: number;

    type: MediaType;

    season?: number;

    episode?: number;

    quality?: string;

    resolution?: string;

    source?: string;

    audio?: string;

    audioCodec?: string;

    audioChannels?: string;

    videoCodec?: string;

    hdr?: string;

    extension?: string;
}

/**
 * Filename Parser
 */
export class FilenameParser {

    // =========================================================================
    // QUALITY PATTERNS
    // =========================================================================

    private static readonly QUALITY_PATTERNS = [

        {
            pattern: /\b2160p\b/i,
            value: "4K"
        },

        {
            pattern: /\b1080p\b/i,
            value: "FHD"
        },

        {
            pattern: /\b720p\b/i,
            value: "HD"
        },

        {
            pattern: /\b576p\b/i,
            value: "SD"
        },

        {
            pattern: /\b480p\b/i,
            value: "SD"
        },

        {
            pattern: /\bUHD\b/i,
            value: "UHD"
        },

        {
            pattern: /\b4K\b/i,
            value: "4K"
        },

        {
            pattern: /\bFHD\b/i,
            value: "FHD"
        },

        {
            pattern: /\bHD\b/i,
            value: "HD"
        }

    ];

    // =========================================================================
    // RESOLUTION
    // =========================================================================

    private static readonly RESOLUTION_PATTERNS = [

        /\b3840x2160\b/i,

        /\b4096x2160\b/i,

        /\b1920x1080\b/i,

        /\b1280x720\b/i,

        /\b720x576\b/i,

        /\b720x480\b/i

    ];

    // =========================================================================
    // SOURCE
    // =========================================================================

    private static readonly SOURCE_PATTERNS = [

        {
            pattern: /\bWEB[-_. ]?DL\b/i,
            value: "WEB-DL"
        },

        {
            pattern: /\bWEB[-_. ]?RIP\b/i,
            value: "WEBRip"
        },

        {
            pattern: /\bBLU[-_. ]?RAY\b/i,
            value: "BluRay"
        },

        {
            pattern: /\bBD[-_. ]?RIP\b/i,
            value: "BDRip"
        },

        {
            pattern: /\bBR[-_. ]?RIP\b/i,
            value: "BRRip"
        },

        {
            pattern: /\bDVDRIP\b/i,
            value: "DVDRip"
        },

        {
            pattern: /\bHDTV\b/i,
            value: "HDTV"
        },

        {
            pattern: /\bREMUX\b/i,
            value: "Remux"
        },

        {
            pattern: /\bCAM\b/i,
            value: "CAM"
        },

        {
            pattern: /\bTELESYNC\b/i,
            value: "TS"
        },

        {
            pattern: /\bTS\b/i,
            value: "TS"
        }

    ];

    // =========================================================================
    // AUDIO
    // =========================================================================

    private static readonly AUDIO_PATTERNS = [

        {
            pattern: /\bGerman\b/i,
            value: "Deutsch"
        },

        {
            pattern: /\bDeutsch\b/i,
            value: "Deutsch"
        },

        {
            pattern: /\bEnglish\b/i,
            value: "Englisch"
        },

        {
            pattern: /\bEnglisch\b/i,
            value: "Englisch"
        },

        {
            pattern: /\bFrench\b/i,
            value: "Französisch"
        },

        {
            pattern: /\bFranzösisch\b/i,
            value: "Französisch"
        },

        {
            pattern: /\bSpanish\b/i,
            value: "Spanisch"
        },

        {
            pattern: /\bItalian\b/i,
            value: "Italienisch"
        },

        {
            pattern: /\bDual[-_. ]?Audio\b/i,
            value: "Dual Audio"
        },

        {
            pattern: /\bMulti[-_. ]?Audio\b/i,
            value: "Multi Audio"
        },

        {
            pattern: /\bMULTi\b/i,
            value: "Multi Audio"
        }

    ];

    // =========================================================================
    // VIDEO CODEC
    // =========================================================================

    private static readonly VIDEO_CODEC_PATTERNS = [

        {
            pattern: /\bH\.?265\b/i,
            value: "H.265"
        },

        {
            pattern: /\bHEVC\b/i,
            value: "HEVC"
        },

        {
            pattern: /\bx265\b/i,
            value: "x265"
        },

        {
            pattern: /\bH\.?264\b/i,
            value: "H.264"
        },

        {
            pattern: /\bAVC\b/i,
            value: "AVC"
        },

        {
            pattern: /\bx264\b/i,
            value: "x264"
        },

        {
            pattern: /\bAV1\b/i,
            value: "AV1"
        }

    ];

    // =========================================================================
    // AUDIO CODEC
    // =========================================================================

    private static readonly AUDIO_CODEC_PATTERNS = [

        {
            pattern: /\bDolby Atmos\b/i,
            value: "Dolby Atmos"
        },

        {
            pattern: /\bAtmos\b/i,
            value: "Dolby Atmos"
        },

        {
            pattern: /\bTrueHD\b/i,
            value: "TrueHD"
        },

        {
            pattern: /\bDTS[-_. ]?HD\b/i,
            value: "DTS-HD"
        },

        {
            pattern: /\bDTS\b/i,
            value: "DTS"
        },

        {
            pattern: /\bDDP\b/i,
            value: "DD+"
        },

        {
            pattern: /\bDD\+?\b/i,
            value: "Dolby Digital"
        },

        {
            pattern: /\bAAC\b/i,
            value: "AAC"
        },

        {
            pattern: /\bAC3\b/i,
            value: "AC3"
        },

        {
            pattern: /\bEAC3\b/i,
            value: "E-AC3"
        },

        {
            pattern: /\bFLAC\b/i,
            value: "FLAC"
        }

    ];

    // =========================================================================
    // AUDIO CHANNELS
    // =========================================================================

    private static readonly AUDIO_CHANNEL_PATTERNS = [

        {
            pattern: /\b(7\.1)\b/i,
            value: "7.1"
        },

        {
            pattern: /\b(5\.1)\b/i,
            value: "5.1"
        },

        {
            pattern: /\b(2\.0)\b/i,
            value: "2.0"
        },

        {
            pattern: /\b(2\.1)\b/i,
            value: "2.1"
        },

        {
            pattern: /\b(1\.0)\b/i,
            value: "1.0"
        }

    ];

    // =========================================================================
    // HDR
    // =========================================================================

    private static readonly HDR_PATTERNS = [

        {
            pattern: /\bDolby[-_. ]?Vision\b/i,
            value: "Dolby Vision"
        },

        {
            pattern: /\bDV\b/i,
            value: "Dolby Vision"
        },

        {
            pattern: /\bHDR10\+\b/i,
            value: "HDR10+"
        },

        {
            pattern: /\bHDR10\b/i,
            value: "HDR10"
        },

        {
            pattern: /\bHDR\b/i,
            value: "HDR"
        }

    ];

    // =========================================================================
    // PARSE
    // =========================================================================

    public static parse(
        fileName: string
    ): ParsedMedia {

        const originalFileName =
            String(
                fileName || ""
            ).trim();

        const detection =
            MediaTypeDetector.detect(
                originalFileName
            );

        const extension =
            detection.extension;

        const year =
            this.detectYear(
                originalFileName
            );

        const title =
            this.extractTitle(
                originalFileName
            );

        const quality =
            this.detectQuality(
                originalFileName
            );

        const resolution =
            this.detectResolution(
                originalFileName
            );

        const source =
            this.detectSource(
                originalFileName
            );

        const audio =
            this.detectAudio(
                originalFileName
            );

        const audioCodec =
            this.detectAudioCodec(
                originalFileName
            );

        const audioChannels =
            this.detectAudioChannels(
                originalFileName
            );

        const videoCodec =
            this.detectVideoCodec(
                originalFileName
            );

        const hdr =
            this.detectHDR(
                originalFileName
            );

        return {

            originalFileName,

            title,

            year,

            type:
                detection.type,

            season:
                detection.season,

            episode:
                detection.episode,

            quality,

            resolution,

            source,

            audio,

            audioCodec,

            audioChannels,

            videoCodec,

            hdr,

            extension
        };
    }

    // =========================================================================
    // EXTRACT TITLE
    // =========================================================================

    public static extractTitle(
        fileName: string
    ): string {

        let title =
            String(
                fileName || ""
            ).trim();

        // ---------------------------------------------------------------------
        // REMOVE EXTENSION
        // ---------------------------------------------------------------------

        title =
            title.replace(
                /\.[a-zA-Z0-9]+$/,
                ""
            );

        // ---------------------------------------------------------------------
        // REMOVE SERIES INFORMATION
        // ---------------------------------------------------------------------

        title =
            title.replace(
                /\bS\d{1,3}E\d{1,4}\b/gi,
                " "
            );

        title =
            title.replace(
                /\bSeason\s*\d{1,3}\s*Episode\s*\d{1,4}\b/gi,
                " "
            );

        title =
            title.replace(
                /\bStaffel\s*\d{1,3}\s*(?:Folge|Episode)\s*\d{1,4}\b/gi,
                " "
            );

        title =
            title.replace(
                /\bSeason\s*\d{1,3}\b/gi,
                " "
            );

        title =
            title.replace(
                /\bStaffel\s*\d{1,3}\b/gi,
                " "
            );

        // ---------------------------------------------------------------------
        // REMOVE QUALITY
        // ---------------------------------------------------------------------

        for (
            const item of
            this.QUALITY_PATTERNS
        ) {

            title =
                title.replace(
                    item.pattern,
                    " "
                );
        }

        // ---------------------------------------------------------------------
        // REMOVE RESOLUTION
        // ---------------------------------------------------------------------

        for (
            const pattern of
            this.RESOLUTION_PATTERNS
        ) {

            title =
                title.replace(
                    pattern,
                    " "
                );
        }

        // ---------------------------------------------------------------------
        // REMOVE SOURCE
        // ---------------------------------------------------------------------

        for (
            const item of
            this.SOURCE_PATTERNS
        ) {

            title =
                title.replace(
                    item.pattern,
                    " "
                );
        }

        // ---------------------------------------------------------------------
        // REMOVE CODECS
        // ---------------------------------------------------------------------

        for (
            const item of
            this.VIDEO_CODEC_PATTERNS
        ) {

            title =
                title.replace(
                    item.pattern,
                    " "
                );
        }

        for (
            const item of
            this.AUDIO_CODEC_PATTERNS
        ) {

            title =
                title.replace(
                    item.pattern,
                    " "
                );
        }

        // ---------------------------------------------------------------------
        // REMOVE HDR
        // ---------------------------------------------------------------------

        for (
            const item of
            this.HDR_PATTERNS
        ) {

            title =
                title.replace(
                    item.pattern,
                    " "
                );
        }

        // ---------------------------------------------------------------------
        // REMOVE AUDIO CHANNELS
        // ---------------------------------------------------------------------

        for (
            const item of
            this.AUDIO_CHANNEL_PATTERNS
        ) {

            title =
                title.replace(
                    item.pattern,
                    " "
                );
        }

        // ---------------------------------------------------------------------
        // REMOVE LANGUAGE TAGS
        // ---------------------------------------------------------------------

        for (
            const item of
            this.AUDIO_PATTERNS
        ) {

            title =
                title.replace(
                    item.pattern,
                    " "
                );
        }

        // ---------------------------------------------------------------------
        // REMOVE YEAR
        // ---------------------------------------------------------------------

        title =
            title.replace(
                /\b(19|20)\d{2}\b/g,
                " "
            );

        // ---------------------------------------------------------------------
        // CLEAN SEPARATORS
        // ---------------------------------------------------------------------

        title =
            title.replace(
                /[_]+/g,
                " "
            );

        title =
            title.replace(
                /\.+/g,
                " "
            );

        title =
            title.replace(
                /\s*\|\s*/g,
                " "
            );

        title =
            title.replace(
                /\s*-\s*$/g,
                ""
            );

        title =
            title.replace(
                /\s+/g,
                " "
            );

        return title.trim();
    }

    // =========================================================================
    // YEAR
    // =========================================================================

    public static detectYear(
        fileName: string
    ): number | undefined {

        const matches =
            String(
                fileName || ""
            ).match(
                /\b(19|20)\d{2}\b/g
            );

        if (
            !matches ||
            matches.length === 0
        ) {

            return undefined;
        }

        const years =
            matches
                .map(
                    value =>
                        Number(value)
                )
                .filter(
                    year =>
                        year >= 1900 &&
                        year <= 2100
                );

        return years[0];
    }

    // =========================================================================
    // QUALITY
    // =========================================================================

    public static detectQuality(
        fileName: string
    ): string | undefined {

        for (
            const item of
            this.QUALITY_PATTERNS
        ) {

            if (
                item.pattern.test(
                    fileName
                )
            ) {

                return item.value;
            }
        }

        return undefined;
    }

    // =========================================================================
    // RESOLUTION
    // =========================================================================

    public static detectResolution(
        fileName: string
    ): string | undefined {

        for (
            const pattern of
            this.RESOLUTION_PATTERNS
        ) {

            const match =
                fileName.match(
                    pattern
                );

            if (
                match
            ) {

                return match[0];
            }
        }

        return undefined;
    }

    // =========================================================================
    // SOURCE
    // =========================================================================

    public static detectSource(
        fileName: string
    ): string | undefined {

        for (
            const item of
            this.SOURCE_PATTERNS
        ) {

            if (
                item.pattern.test(
                    fileName
                )
            ) {

                return item.value;
            }
        }

        return undefined;
    }

    // =========================================================================
    // AUDIO
    // =========================================================================

    public static detectAudio(
        fileName: string
    ): string | undefined {

        const languages: string[] = [];

        for (
            const item of
            this.AUDIO_PATTERNS
        ) {

            if (
                item.pattern.test(
                    fileName
                ) &&
                !languages.includes(
                    item.value
                )
            ) {

                languages.push(
                    item.value
                );
            }
        }

        if (
            languages.length === 0
        ) {

            return undefined;
        }

        return languages.join(
            " / "
        );
    }

    // =========================================================================
    // AUDIO CODEC
    // =========================================================================

    public static detectAudioCodec(
        fileName: string
    ): string | undefined {

        for (
            const item of
            this.AUDIO_CODEC_PATTERNS
        ) {

            if (
                item.pattern.test(
                    fileName
                )
            ) {

                return item.value;
            }
        }

        return undefined;
    }

    // =========================================================================
    // AUDIO CHANNELS
    // =========================================================================

    public static detectAudioChannels(
        fileName: string
    ): string | undefined {

        for (
            const item of
            this.AUDIO_CHANNEL_PATTERNS
        ) {

            if (
                item.pattern.test(
                    fileName
                )
            ) {

                return item.value;
            }
        }

        return undefined;
    }

    // =========================================================================
    // VIDEO CODEC
    // =========================================================================

    public static detectVideoCodec(
        fileName: string
    ): string | undefined {

        for (
            const item of
            this.VIDEO_CODEC_PATTERNS
        ) {

            if (
                item.pattern.test(
                    fileName
                )
            ) {

                return item.value;
            }
        }

        return undefined;
    }

    // =========================================================================
    // HDR
    // =========================================================================

    public static detectHDR(
        fileName: string
    ): string | undefined {

        for (
            const item of
            this.HDR_PATTERNS
        ) {

            if (
                item.pattern.test(
                    fileName
                )
            ) {

                return item.value;
            }
        }

        return undefined;
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        fileName: string
    ): string {

        const parsed =
            this.parse(
                fileName
            );

        return [

            "=================================================",

            "🧠 FILENAME PARSER",

            "=================================================",

            `📄 Datei: ${
                parsed.originalFileName
            }`,

            `🎬 Titel: ${
                parsed.title
            }`,

            `📅 Jahr: ${
                parsed.year ??
                "—"
            }`,

            `🎞️ Typ: ${
                parsed.type
            }`,

            `📚 Staffel: ${
                parsed.season ??
                "—"
            }`,

            `🎬 Episode: ${
                parsed.episode ??
                "—"
            }`,

            `🔥 Qualität: ${
                parsed.quality ??
                "—"
            }`,

            `📺 Auflösung: ${
                parsed.resolution ??
                "—"
            }`,

            `💿 Quelle: ${
                parsed.source ??
                "—"
            }`,

            `🔊 Audio: ${
                parsed.audio ??
                "—"
            }`,

            `🎧 Audio-Codec: ${
                parsed.audioCodec ??
                "—"
            }`,

            `🔈 Kanäle: ${
                parsed.audioChannels ??
                "—"
            }`,

            `🎥 Video-Codec: ${
                parsed.videoCodec ??
                "—"
            }`,

            `🌈 HDR: ${
                parsed.hdr ??
                "—"
            }`,

            `📦 Extension: ${
                parsed.extension ??
                "—"
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}