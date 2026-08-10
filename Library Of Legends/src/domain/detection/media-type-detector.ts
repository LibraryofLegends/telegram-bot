/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaTypeDetector

Architecture Layer..: Domain

Module..............: Detection

Module ID...........: LOL-MOD-DET-0001

LOL-ID..............: LOL-DET-MEDIA-0001

File................: media-type-detector.ts

Location............
Library Of Legends/src/domain/detection/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Automatic media type detection for Library Of Legends.

Responsibilities:

- Detect movies
- Detect series
- Detect episodes
- Detect season information
- Detect episode information
- Support S01E01 notation
- Support S1E1 notation
- Support Season 1 Episode 1
- Support Staffel 1 Folge 1
- Support German and English filenames
- Detect media extensions
- Never crash on malformed filenames
- Provide a normalized detection result

Detection priority:

1. Explicit season / episode pattern
2. Filename season notation
3. Episode notation
4. Movie fallback

===============================================================================
*/

/**
 * Supported media types.
 */
export type MediaType =
    | "MOVIE"
    | "SERIES"
    | "UNKNOWN";

/**
 * Result returned by the detector.
 */
export interface MediaTypeDetectionResult {

    /**
     * Detected media type.
     */
    type: MediaType;

    /**
     * Whether the filename contains
     * explicit series information.
     */
    isSeries: boolean;

    /**
     * Detected season number.
     */
    season?: number;

    /**
     * Detected episode number.
     */
    episode?: number;

    /**
     * Detected media extension.
     */
    extension?: string;

    /**
     * Original filename.
     */
    originalFileName: string;

    /**
     * Confidence score from 0 to 100.
     */
    confidence: number;

    /**
     * Detection reason.
     */
    reason: string;
}

/**
 * Media Type Detector
 */
export class MediaTypeDetector {

    // =========================================================================
    // SUPPORTED MEDIA EXTENSIONS
    // =========================================================================

    private static readonly MEDIA_EXTENSIONS = [

        "mp4",

        "mkv",

        "avi",

        "mov",

        "wmv",

        "webm",

        "m4v",

        "ts",

        "m2ts",

        "flv"

    ];

    // =========================================================================
    // SERIES PATTERNS
    // =========================================================================

    private static readonly SERIES_PATTERNS = [

        /*
         * S01E01
         *
         * S1E1
         */
        /\bS(\d{1,3})E(\d{1,4})\b/i,

        /*
         * S01 E01
         */
        /\bS(\d{1,3})\s*E(\d{1,4})\b/i,

        /*
         * Season 1 Episode 1
         */
        /\bSeason\s*(\d{1,3})\s*Episode\s*(\d{1,4})\b/i,

        /*
         * Staffel 1 Folge 1
         */
        /\bStaffel\s*(\d{1,3})\s*(?:Folge|Episode)\s*(\d{1,4})\b/i,

        /*
         * Staffel 1 Episode 1
         */
        /\bStaffel\s*(\d{1,3})\s*Episode\s*(\d{1,4})\b/i

    ];

    // =========================================================================
    // SEASON ONLY PATTERNS
    // =========================================================================

    private static readonly SEASON_PATTERNS = [

        /\bS(\d{1,3})\b/i,

        /\bSeason\s*(\d{1,3})\b/i,

        /\bStaffel\s*(\d{1,3})\b/i

    ];

    // =========================================================================
    // EPISODE ONLY PATTERNS
    // =========================================================================

    private static readonly EPISODE_PATTERNS = [

        /\bE(\d{1,4})\b/i,

        /\bEpisode\s*(\d{1,4})\b/i,

        /\bFolge\s*(\d{1,4})\b/i

    ];

    // =========================================================================
    // DETECT
    // =========================================================================

    public static detect(
        fileName: string
    ): MediaTypeDetectionResult {

        const originalFileName =
            String(
                fileName || ""
            ).trim();

        const normalized =
            this.normalize(
                originalFileName
            );

        const extension =
            this.getExtension(
                originalFileName
            );

        // =====================================================================
        // INVALID FILENAME
        // =====================================================================

        if (
            !originalFileName
        ) {

            return {

                type:
                    "UNKNOWN",

                isSeries:
                    false,

                extension,

                originalFileName,

                confidence:
                    0,

                reason:
                    "Kein Dateiname vorhanden."

            };
        }

        // =====================================================================
        // SERIES: S01E01
        // =====================================================================

        for (
            const pattern of
            this.SERIES_PATTERNS
        ) {

            const match =
                normalized.match(
                    pattern
                );

            if (
                match
            ) {

                const season =
                    Number(
                        match[1]
                    );

                const episode =
                    Number(
                        match[2]
                    );

                if (
                    this.isValidSeason(
                        season
                    ) &&
                    this.isValidEpisode(
                        episode
                    )
                ) {

                    return {

                        type:
                            "SERIES",

                        isSeries:
                            true,

                        season,

                        episode,

                        extension,

                        originalFileName,

                        confidence:
                            100,

                        reason:
                            "Staffel-/Episodenmuster erkannt."

                    };
                }
            }
        }

        // =====================================================================
        // SERIES: SEASON ONLY
        // =====================================================================

        for (
            const pattern of
            this.SEASON_PATTERNS
        ) {

            const match =
                normalized.match(
                    pattern
                );

            if (
                match
            ) {

                const season =
                    Number(
                        match[1]
                    );

                if (
                    this.isValidSeason(
                        season
                    )
                ) {

                    return {

                        type:
                            "SERIES",

                        isSeries:
                            true,

                        season,

                        extension,

                        originalFileName,

                        confidence:
                            90,

                        reason:
                            "Staffelnotation erkannt."

                    };
                }
            }
        }

        // =====================================================================
        // SERIES: EPISODE ONLY
        // =====================================================================

        for (
            const pattern of
            this.EPISODE_PATTERNS
        ) {

            const match =
                normalized.match(
                    pattern
                );

            if (
                match
            ) {

                const episode =
                    Number(
                        match[1]
                    );

                if (
                    this.isValidEpisode(
                        episode
                    )
                ) {

                    return {

                        type:
                            "SERIES",

                        isSeries:
                            true,

                        episode,

                        extension,

                        originalFileName,

                        confidence:
                            85,

                        reason:
                            "Episodennotation erkannt."

                    };
                }
            }
        }

        // =====================================================================
        // MEDIA FILE
        // =====================================================================

        if (
            extension &&
            this.isSupportedMediaExtension(
                extension
            )
        ) {

            return {

                type:
                    "MOVIE",

                isSeries:
                    false,

                extension,

                originalFileName,

                confidence:
                    70,

                reason:
                    "Keine Seriennotation gefunden; Mediendatei wird als Film behandelt."

            };
        }

        // =====================================================================
        // UNKNOWN
        // =====================================================================

        return {

            type:
                "UNKNOWN",

            isSeries:
                false,

            extension,

            originalFileName,

            confidence:
                10,

            reason:
                "Kein bekanntes Serienmuster und keine unterstützte Mediendatei."

        };
    }

    // =========================================================================
    // IS SERIES
    // =========================================================================

    public static isSeries(
        fileName: string
    ): boolean {

        return (
            this.detect(
                fileName
            ).type ===
            "SERIES"
        );
    }

    // =========================================================================
    // IS MOVIE
    // =========================================================================

    public static isMovie(
        fileName: string
    ): boolean {

        return (
            this.detect(
                fileName
            ).type ===
            "MOVIE"
        );
    }

    // =========================================================================
    // IS UNKNOWN
    // =========================================================================

    public static isUnknown(
        fileName: string
    ): boolean {

        return (
            this.detect(
                fileName
            ).type ===
            "UNKNOWN"
        );
    }

    // =========================================================================
    // GET SEASON
    // =========================================================================

    public static getSeason(
        fileName: string
    ): number | undefined {

        return this.detect(
            fileName
        ).season;
    }

    // =========================================================================
    // GET EPISODE
    // =========================================================================

    public static getEpisode(
        fileName: string
    ): number | undefined {

        return this.detect(
            fileName
        ).episode;
    }

    // =========================================================================
    // GET EXTENSION
    // =========================================================================

    public static getExtension(
        fileName: string
    ): string | undefined {

        const value =
            String(
                fileName || ""
            ).trim();

        const match =
            value.match(
                /\.([a-zA-Z0-9]+)$/
            );

        if (
            !match
        ) {

            return undefined;
        }

        return match[1]
            .toLowerCase();
    }

    // =========================================================================
    // IS SUPPORTED EXTENSION
    // =========================================================================

    public static isSupportedMediaExtension(
        extension?: string
    ): boolean {

        if (
            !extension
        ) {

            return false;
        }

        return this.MEDIA_EXTENSIONS.includes(
            extension.toLowerCase()
        );
    }

    // =========================================================================
    // GET MEDIA EXTENSIONS
    // =========================================================================

    public static getSupportedExtensions(): string[] {

        return [
            ...this.MEDIA_EXTENSIONS
        ];
    }

    // =========================================================================
    // NORMALIZE
    // =========================================================================

    private static normalize(
        fileName: string
    ): string {

        return String(
            fileName || ""
        )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .trim();
    }

    // =========================================================================
    // VALIDATE SEASON
    // =========================================================================

    private static isValidSeason(
        season: number
    ): boolean {

        return (
            Number.isInteger(
                season
            ) &&
            season >= 0 &&
            season <= 100
        );
    }

    // =========================================================================
    // VALIDATE EPISODE
    // =========================================================================

    private static isValidEpisode(
        episode: number
    ): boolean {

        return (
            Number.isInteger(
                episode
            ) &&
            episode >= 0 &&
            episode <= 9999
        );
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        fileName: string
    ): string {

        const result =
            this.detect(
                fileName
            );

        return [

            "=================================================",

            "🧠 MEDIA TYPE DETECTOR",

            "=================================================",

            `📄 Datei: ${
                result.originalFileName
            }`,

            `🎞️ Typ: ${
                result.type
            }`,

            `📺 Serie: ${
                result.isSeries
                    ? "JA"
                    : "NEIN"
            }`,

            `📚 Staffel: ${
                result.season ??
                "—"
            }`,

            `🎬 Episode: ${
                result.episode ??
                "—"
            }`,

            `📦 Extension: ${
                result.extension ??
                "—"
            }`,

            `🎯 Confidence: ${
                result.confidence
            }%`,

            `💡 Grund: ${
                result.reason
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}