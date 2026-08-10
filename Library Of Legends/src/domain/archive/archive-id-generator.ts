/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ArchiveIdGenerator

Architecture Layer..: Domain

Module..............: Archive

Module ID...........: LOL-MOD-ARC-0001

LOL-ID..............: LOL-ARC-ID-0001

File................: archive-id-generator.ts

Location............
Library Of Legends/src/domain/archive/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Generates unique Library Of Legends archive IDs.

Archive IDs are based on the detected primary genre and a
sequential number.

Examples:

- #LIB-ACT-0001
- #LIB-HOR-0001
- #LIB-SCF-0001
- #LIB-FAN-0001
- #LIB-DRM-0001

The generator itself does not access Telegram or the database.
Persistence of the generated counter is handled by the
infrastructure layer.

===============================================================================
*/

export type ArchiveGenreCode =
    | "ACT"
    | "ADV"
    | "THR"
    | "HOR"
    | "SCF"
    | "FAN"
    | "DRM"
    | "ROM"
    | "COM"
    | "FAM"
    | "ANI"
    | "ANM"
    | "MYS"
    | "CRI"
    | "DOC"
    | "BIO"
    | "WES"
    | "MUS"
    | "KID"
    | "GEN";

export class ArchiveIdGenerator {

    // =========================================================================
    // GENRE CODE MAP
    // =========================================================================

    private static readonly GENRE_CODES: Record<
        string,
        ArchiveGenreCode
    > = {

        Action: "ACT",

        Abenteuer: "ADV",

        Thriller: "THR",

        Horror: "HOR",

        "Sci-Fi": "SCF",

        Fantasy: "FAN",

        Drama: "DRM",

        Romantik: "ROM",

        Komödie: "COM",

        Familie: "FAM",

        Animation: "ANI",

        Anime: "ANM",

        Mystery: "MYS",

        Krimi: "CRI",

        Dokumentation: "DOC",

        Biografie: "BIO",

        Western: "WES",

        Musik: "MUS",

        Kinder: "KID",

        Unbekannt: "GEN"
    };

    // =========================================================================
    // DEFAULT START NUMBER
    // =========================================================================

    private static readonly DEFAULT_START =
        1;

    // =========================================================================
    // GENERATE
    // =========================================================================

    public static generate(
        genre: string,
        number: number
    ): string {

        const code =
            this.getGenreCode(genre);

        const normalizedNumber =
            this.normalizeNumber(number);

        return `#LIB-${code}-${normalizedNumber}`;
    }

    // =========================================================================
    // GENERATE FROM GENRE
    // =========================================================================

    public static generateForGenre(
        genre: string,
        number: number
    ): string {

        return this.generate(
            genre,
            number
        );
    }

    // =========================================================================
    // GENRE CODE
    // =========================================================================

    public static getGenreCode(
        genre: string
    ): ArchiveGenreCode {

        return (
            this.GENRE_CODES[genre] ??
            this.GENRE_CODES["Unbekannt"]
        );
    }

    // =========================================================================
    // NORMALIZE NUMBER
    // =========================================================================

    private static normalizeNumber(
        number: number
    ): string {

        const safeNumber =
            Number.isFinite(number) &&
            number >= this.DEFAULT_START
                ? Math.floor(number)
                : this.DEFAULT_START;

        return String(
            safeNumber
        ).padStart(
            4,
            "0"
        );
    }

    // =========================================================================
    // PARSE ARCHIVE ID
    // =========================================================================

    public static parse(
        archiveId: string
    ): {
        genreCode: ArchiveGenreCode;
        number: number;
    } | null {

        const match =
            archiveId.match(
                /^#?LIB-([A-Z]{3})-(\d{4})$/i
            );

        if (!match) {
            return null;
        }

        const genreCode =
            match[1].toUpperCase() as ArchiveGenreCode;

        const number =
            Number(match[2]);

        return {
            genreCode,
            number
        };
    }

    // =========================================================================
    // VALIDATE
    // =========================================================================

    public static isValid(
        archiveId: string
    ): boolean {

        return (
            this.parse(
                archiveId
            ) !== null
        );
    }

    // =========================================================================
    // FORMAT
    // =========================================================================

    public static format(
        genre: string,
        number: number
    ): string {

        return this.generate(
            genre,
            number
        );
    }
}