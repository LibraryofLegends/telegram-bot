/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ArchiveIdGenerator

Architecture Layer..: Domain

Module..............: Archive

Module ID...........: LOL-MOD-ARCH-0001

LOL-ID..............: LOL-ARCH-ID-0001

File................: archive-id-generator.ts

Location............
Library Of Legends/src/domain/archive/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central archive ID generator for Library Of Legends.

Responsibilities:

- Generate unique archive IDs
- Generate genre-based archive IDs
- Generate movie archive IDs
- Generate series archive IDs
- Generate episode archive IDs
- Normalize genre codes
- Normalize numeric IDs
- Prevent malformed IDs
- Provide readable archive references
- Provide validation helpers

Examples:

LL-ACT-0001
LL-HOR-0002
LL-SCF-0015
LL-DRM-0042
LL-KRM-0100
LL-ANI-0021

Series:

LL-SER-0001

Episodes:

LL-SER-0001-S01E01

===============================================================================
*/

/**
 * Supported archive content types.
 */
export type ArchiveContentType =
    | "MOVIE"
    | "SERIES"
    | "EPISODE";

/**
 * Archive ID information.
 */
export interface ArchiveId {

    /**
     * Complete archive ID.
     */
    id: string;

    /**
     * Content type.
     */
    type: ArchiveContentType;

    /**
     * Genre code.
     */
    genreCode: string;

    /**
     * Numeric sequence.
     */
    number: number;

    /**
     * Optional series archive ID.
     */
    seriesId?: string;

    /**
     * Optional season.
     */
    season?: number;

    /**
     * Optional episode.
     */
    episode?: number;
}

/**
 * Archive ID Generator.
 */
export class ArchiveIdGenerator {

    // =========================================================================
    // PREFIX
    // =========================================================================

    private static readonly PREFIX =
        "LL";

    // =========================================================================
    // DEFAULT WIDTH
    // =========================================================================

    private static readonly DEFAULT_WIDTH =
        4;

    // =========================================================================
    // SERIES PREFIX
    // =========================================================================

    private static readonly SERIES_PREFIX =
        "SER";

    // =========================================================================
    // UNKNOWN GENRE
    // =========================================================================

    private static readonly UNKNOWN_GENRE =
        "GEN";

    // =========================================================================
    // GENERATE MOVIE ID
    // =========================================================================

    public static generateMovieId(
        genreCode: string,
        number: number
    ): string {

        const code =
            this.normalizeGenreCode(
                genreCode
            );

        const sequence =
            this.formatNumber(
                number
            );

        return `${this.PREFIX}-${code}-${sequence}`;
    }

    // =========================================================================
    // GENERATE SERIES ID
    // =========================================================================

    public static generateSeriesId(
        number: number
    ): string {

        const sequence =
            this.formatNumber(
                number
            );

        return `${this.PREFIX}-${this.SERIES_PREFIX}-${sequence}`;
    }

    // =========================================================================
    // GENERATE EPISODE ID
    // =========================================================================

    public static generateEpisodeId(
        seriesId: string,
        season: number,
        episode: number
    ): string {

        const normalizedSeriesId =
            this.normalizeSeriesId(
                seriesId
            );

        const normalizedSeason =
            this.formatSeason(
                season
            );

        const normalizedEpisode =
            this.formatEpisode(
                episode
            );

        return `${normalizedSeriesId}-S${normalizedSeason}E${normalizedEpisode}`;
    }

    // =========================================================================
    // GENERATE
    // =========================================================================

    public static generate(
        type: ArchiveContentType,
        number: number,
        genreCode?: string,
        season?: number,
        episode?: number,
        seriesId?: string
    ): string {

        switch (
            type
        ) {

            case "MOVIE":

                return this.generateMovieId(
                    genreCode ||
                    this.UNKNOWN_GENRE,
                    number
                );

            case "SERIES":

                return this.generateSeriesId(
                    number
                );

            case "EPISODE":

                if (
                    !seriesId
                ) {

                    throw new Error(
                        "Für eine Episode wird eine Series-ID benötigt."
                    );
                }

                if (
                    season === undefined ||
                    episode === undefined
                ) {

                    throw new Error(
                        "Für eine Episode werden Staffel und Episode benötigt."
                    );
                }

                return this.generateEpisodeId(
                    seriesId,
                    season,
                    episode
                );

            default:

                throw new Error(
                    `Unbekannter ArchiveContentType: ${String(type)}`
                );
        }
    }

    // =========================================================================
    // CREATE ARCHIVE OBJECT
    // =========================================================================

    public static create(
        type: ArchiveContentType,
        number: number,
        genreCode?: string,
        season?: number,
        episode?: number,
        seriesId?: string
    ): ArchiveId {

        const id =
            this.generate(
                type,
                number,
                genreCode,
                season,
                episode,
                seriesId
            );

        return {

            id,

            type,

            genreCode:
                this.normalizeGenreCode(
                    genreCode ||
                    this.UNKNOWN_GENRE
                ),

            number,

            seriesId,

            season,

            episode
        };
    }

    // =========================================================================
    // NORMALIZE GENRE CODE
    // =========================================================================

    public static normalizeGenreCode(
        genreCode: string
    ): string {

        const value =
            String(
                genreCode ||
                this.UNKNOWN_GENRE
            )
                .trim()
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ""
                );

        if (
            !value
        ) {

            return this.UNKNOWN_GENRE;
        }

        return value.slice(
            0,
            6
        );
    }

    // =========================================================================
    // FORMAT NUMBER
    // =========================================================================

    public static formatNumber(
        number: number,
        width:
            number =
            this.DEFAULT_WIDTH
    ): string {

        const numeric =
            Number(
                number
            );

        if (
            !Number.isFinite(
                numeric
            )
        ) {

            throw new Error(
                "Archive-Nummer muss eine gültige Zahl sein."
            );
        }

        if (
            numeric < 0
        ) {

            throw new Error(
                "Archive-Nummer darf nicht negativ sein."
            );
        }

        return Math.floor(
            numeric
        )
            .toString()
            .padStart(
                width,
                "0"
            );
    }

    // =========================================================================
    // FORMAT SEASON
    // =========================================================================

    public static formatSeason(
        season: number
    ): string {

        const value =
            Number(
                season
            );

        if (
            !Number.isInteger(
                value
            ) ||
            value < 0
        ) {

            throw new Error(
                "Ungültige Staffelnummer."
            );
        }

        return value
            .toString()
            .padStart(
                2,
                "0"
            );
    }

    // =========================================================================
    // FORMAT EPISODE
    // =========================================================================

    public static formatEpisode(
        episode: number
    ): string {

        const value =
            Number(
                episode
            );

        if (
            !Number.isInteger(
                value
            ) ||
            value < 0
        ) {

            throw new Error(
                "Ungültige Episodennummer."
            );
        }

        return value
            .toString()
            .padStart(
                2,
                "0"
            );
    }

    // =========================================================================
    // NORMALIZE SERIES ID
    // =========================================================================

    public static normalizeSeriesId(
        seriesId: string
    ): string {

        const value =
            String(
                seriesId ||
                ""
            )
                .trim()
                .toUpperCase();

        if (
            !value
        ) {

            throw new Error(
                "Series-ID darf nicht leer sein."
            );
        }

        return value;
    }

    // =========================================================================
    // VALIDATE ARCHIVE ID
    // =========================================================================

    public static isValid(
        archiveId: string
    ): boolean {

        const value =
            String(
                archiveId ||
                ""
            )
                .trim()
                .toUpperCase();

        if (
            /^LL-[A-Z0-9]+-\d{4,}$/.test(
                value
            )
        ) {

            return true;
        }

        if (
            /^LL-SER-\d{4,}$/.test(
                value
            )
        ) {

            return true;
        }

        if (
            /^LL-SER-\d{4,}-S\d{2,}E\d{2,}$/.test(
                value
            )
        ) {

            return true;
        }

        return false;
    }

    // =========================================================================
    // IS MOVIE ID
    // =========================================================================

    public static isMovieId(
        archiveId: string
    ): boolean {

        const value =
            String(
                archiveId ||
                ""
            )
                .trim()
                .toUpperCase();

        return /^LL-[A-Z0-9]+-\d{4,}$/.test(
            value
        );
    }

    // =========================================================================
    // IS SERIES ID
    // =========================================================================

    public static isSeriesId(
        archiveId: string
    ): boolean {

        const value =
            String(
                archiveId ||
                ""
            )
                .trim()
                .toUpperCase();

        return /^LL-SER-\d{4,}$/.test(
            value
        );
    }

    // =========================================================================
    // IS EPISODE ID
    // =========================================================================

    public static isEpisodeId(
        archiveId: string
    ): boolean {

        const value =
            String(
                archiveId ||
                ""
            )
                .trim()
                .toUpperCase();

        return /^LL-SER-\d{4,}-S\d{2,}E\d{2,}$/.test(
            value
        );
    }

    // =========================================================================
    // EXTRACT NUMBER
    // =========================================================================

    public static extractNumber(
        archiveId: string
    ): number | undefined {

        const value =
            String(
                archiveId ||
                ""
            )
                .trim()
                .toUpperCase();

        const match =
            value.match(
                /-(\d{4,})(?:-|$)/
            );

        if (
            !match
        ) {

            return undefined;
        }

        return Number(
            match[1]
        );
    }

    // =========================================================================
    // EXTRACT GENRE CODE
    // =========================================================================

    public static extractGenreCode(
        archiveId: string
    ): string | undefined {

        const value =
            String(
                archiveId ||
                ""
            )
                .trim()
                .toUpperCase();

        const match =
            value.match(
                /^LL-([A-Z0-9]+)-\d{4,}$/
            );

        if (
            !match
        ) {

            return undefined;
        }

        if (
            match[1] ===
            this.SERIES_PREFIX
        ) {

            return undefined;
        }

        return match[1];
    }

    // =========================================================================
    // EXTRACT SEASON
    // =========================================================================

    public static extractSeason(
        archiveId: string
    ): number | undefined {

        const value =
            String(
                archiveId ||
                ""
            )
                .trim()
                .toUpperCase();

        const match =
            value.match(
                /-S(\d{2,})E\d{2,}$/
            );

        if (
            !match
        ) {

            return undefined;
        }

        return Number(
            match[1]
        );
    }

    // =========================================================================
    // EXTRACT EPISODE
    // =========================================================================

    public static extractEpisode(
        archiveId: string
    ): number | undefined {

        const value =
            String(
                archiveId ||
                ""
            )
                .trim()
                .toUpperCase();

        const match =
            value.match(
                /-S\d{2,}E(\d{2,})$/
            );

        if (
            !match
        ) {

            return undefined;
        }

        return Number(
            match[1]
        );
    }

    // =========================================================================
    // CREATE NEXT MOVIE ID
    // =========================================================================

    public static createNextMovieId(
        genreCode: string,
        currentHighestNumber: number
    ): string {

        const nextNumber =
            Math.max(
                0,
                Math.floor(
                    Number(
                        currentHighestNumber
                    )
                )
            ) + 1;

        return this.generateMovieId(
            genreCode,
            nextNumber
        );
    }

    // =========================================================================
    // CREATE NEXT SERIES ID
    // =========================================================================

    public static createNextSeriesId(
        currentHighestNumber: number
    ): string {

        const nextNumber =
            Math.max(
                0,
                Math.floor(
                    Number(
                        currentHighestNumber
                    )
                )
            ) + 1;

        return this.generateSeriesId(
            nextNumber
        );
    }

    // =========================================================================
    // DESCRIBE
    // =========================================================================

    public static describe(
        archiveId: string
    ): string {

        const valid =
            this.isValid(
                archiveId
            );

        const type =
            this.isEpisodeId(
                archiveId
            )
                ? "EPISODE"
                : this.isSeriesId(
                    archiveId
                )
                    ? "SERIES"
                    : this.isMovieId(
                        archiveId
                    )
                        ? "MOVIE"
                        : "UNKNOWN";

        return [

            "=================================================",

            "🗃️ ARCHIVE ID GENERATOR",

            "=================================================",

            `🆔 ID: ${
                archiveId
            }`,

            `✅ Gültig: ${
                valid
                    ? "JA"
                    : "NEIN"
            }`,

            `🎞️ Typ: ${
                type
            }`,

            `🔢 Nummer: ${
                this.extractNumber(
                    archiveId
                ) ??
                "—"
            }`,

            `🏷️ Genre-Code: ${
                this.extractGenreCode(
                    archiveId
                ) ??
                "—"
            }`,

            `📚 Staffel: ${
                this.extractSeason(
                    archiveId
                ) ??
                "—"
            }`,

            `🎬 Episode: ${
                this.extractEpisode(
                    archiveId
                ) ??
                "—"
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}