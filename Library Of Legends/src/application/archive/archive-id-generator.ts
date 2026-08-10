/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ArchiveIdGenerator

Architecture Layer..: Application

Module..............: Archive

Module ID...........: LOL-MOD-ARC-0001

LOL-ID..............: LOL-ARC-ID-0001

File................: archive-id-generator.ts

Location............
Library Of Legends/src/application/archive/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Automatic Archive-ID generation for Library Of Legends.

Responsibilities:

- Generate unique archive identifiers
- Generate genre-based archive identifiers
- Support movies
- Support series
- Support configurable prefixes
- Keep archive numbering consistent
- Provide readable Library Of Legends IDs

Examples:

#LIB-ACT-0001
#LIB-HOR-0001
#LIB-SCF-0001
#LIB-FAN-0001
#LIB-DRM-0001
#LIB-COM-0001
#LIB-KRM-0001
#LIB-ANI-0001
#LIB-DOC-0001
#LIB-GEN-0001

===============================================================================
*/

/**
 * Supported archive categories.
 */
export type ArchiveCategory =
    | "ACT"
    | "HOR"
    | "SCF"
    | "FAN"
    | "DRM"
    | "COM"
    | "KRM"
    | "ANI"
    | "DOC"
    | "GEN";

/**
 * Archive ID Generator
 */
export class ArchiveIdGenerator {

    // =========================================================================
    // INTERNAL COUNTERS
    // =========================================================================

    private static readonly counters =
        new Map<ArchiveCategory, number>();

    // =========================================================================
    // PREFIX
    // =========================================================================

    private static readonly PREFIX =
        "LIB";

    // =========================================================================
    // DEFAULT START NUMBER
    // =========================================================================

    private static readonly DEFAULT_START =
        1;

    // =========================================================================
    // CATEGORY NORMALIZATION
    // =========================================================================

    public static normalizeCategory(
        category?: string
    ): ArchiveCategory {

        const value =
            String(
                category || ""
            )
                .trim()
                .toUpperCase();

        switch (value) {

            case "ACTION":
            case "ADVENTURE":
            case "ACTION & ABENTEUER":
            case "ACT":
                return "ACT";

            case "HORROR":
            case "THRILLER":
            case "HOR":
                return "HOR";

            case "SCI-FI":
            case "SCI FI":
            case "SCIENCE FICTION":
            case "SCIFI":
            case "SCF":
                return "SCF";

            case "FANTASY":
            case "FAN":
                return "FAN";

            case "DRAMA":
            case "ROMANCE":
            case "ROMANTIK":
            case "DRM":
                return "DRM";

            case "COMEDY":
            case "KOMÖDIE":
            case "KOMÖDIE & FAMILIE":
            case "FAMILIE":
            case "COM":
                return "COM";

            case "KRIMI":
            case "CRIME":
            case "MYSTERY":
            case "KRM":
                return "KRM";

            case "ANIMATION":
            case "ANIME":
            case "ZEICHENTRICK":
            case "ANI":
                return "ANI";

            case "DOCUMENTARY":
            case "DOKUMENTATION":
            case "BIOGRAPHY":
            case "BIOGRAFIE":
            case "DOC":
                return "DOC";

            default:
                return "GEN";
        }
    }

    // =========================================================================
    // GENERATE
    // =========================================================================

    public static generate(
        category?: string
    ): string {

        const normalizedCategory =
            this.normalizeCategory(
                category
            );

        const nextNumber =
            this.getNextNumber(
                normalizedCategory
            );

        return this.format(
            normalizedCategory,
            nextNumber
        );
    }

    // =========================================================================
    // GET NEXT NUMBER
    // =========================================================================

    private static getNextNumber(
        category: ArchiveCategory
    ): number {

        const current =
            this.counters.get(
                category
            );

        if (
            current === undefined
        ) {

            this.counters.set(
                category,
                this.DEFAULT_START + 1
            );

            return this.DEFAULT_START;
        }

        const next =
            current;

        this.counters.set(
            category,
            current + 1
        );

        return next;
    }

    // =========================================================================
    // FORMAT
    // =========================================================================

    public static format(
        category: ArchiveCategory,
        number: number
    ): string {

        const safeNumber =
            Math.max(
                1,
                Math.floor(
                    number
                )
            );

        const padded =
            String(
                safeNumber
            ).padStart(
                4,
                "0"
            );

        return `#${this.PREFIX}-${category}-${padded}`;
    }

    // =========================================================================
    // FORMAT FROM GENRE
    // =========================================================================

    public static fromGenre(
        genre?: string
    ): string {

        return this.generate(
            genre
        );
    }

    // =========================================================================
    // CURRENT NUMBER
    // =========================================================================

    public static getCurrentNumber(
        category?: string
    ): number {

        const normalizedCategory =
            this.normalizeCategory(
                category
            );

        return (
            this.counters.get(
                normalizedCategory
            ) ||
            0
        );
    }

    // =========================================================================
    // SET NUMBER
    // =========================================================================

    public static setCurrentNumber(
        category: string,
        number: number
    ): void {

        const normalizedCategory =
            this.normalizeCategory(
                category
            );

        const safeNumber =
            Math.max(
                1,
                Math.floor(
                    number
                )
            );

        this.counters.set(
            normalizedCategory,
            safeNumber
        );
    }

    // =========================================================================
    // SYNC FROM EXISTING ARCHIVE ID
    // =========================================================================

    public static syncFromArchiveId(
        archiveId: string
    ): void {

        const value =
            String(
                archiveId || ""
            ).trim();

        const match =
            value.match(
                /^#?LIB-([A-Z]{3})-(\d{4,})$/i
            );

        if (
            !match
        ) {

            return;
        }

        const category =
            this.normalizeCategory(
                match[1]
            );

        const number =
            Number(
                match[2]
            );

        if (
            !Number.isFinite(
                number
            )
        ) {

            return;
        }

        const current =
            this.getCurrentNumber(
                category
            );

        /*
         * The next generated number must always be
         * higher than an already existing archive ID.
         */

        if (
            number >= current
        ) {

            this.setCurrentNumber(
                category,
                number + 1
            );
        }
    }

    // =========================================================================
    // VALIDATE
    // =========================================================================

    public static isValid(
        archiveId: string
    ): boolean {

        return /^#LIB-[A-Z]{3}-\d{4,}$/i.test(
            String(
                archiveId || ""
            ).trim()
        );
    }

    // =========================================================================
    // GET CATEGORY FROM ID
    // =========================================================================

    public static getCategory(
        archiveId: string
    ): ArchiveCategory {

        const value =
            String(
                archiveId || ""
            ).trim();

        const match =
            value.match(
                /^#?LIB-([A-Z]{3})-\d{4,}$/i
            );

        if (
            !match
        ) {

            return "GEN";
        }

        return this.normalizeCategory(
            match[1]
        );
    }

    // =========================================================================
    // GET NUMBER FROM ID
    // =========================================================================

    public static getNumber(
        archiveId: string
    ): number {

        const value =
            String(
                archiveId || ""
            ).trim();

        const match =
            value.match(
                /^#?LIB-[A-Z]{3}-(\d{4,})$/i
            );

        if (
            !match
        ) {

            return 0;
        }

        return Number(
            match[1]
        );
    }

    // =========================================================================
    // RESET
    // =========================================================================

    public static reset(): void {

        this.counters.clear();

        console.log(
            "🗃️ Archive-ID Zähler zurückgesetzt."
        );
    }

    // =========================================================================
    // RESET CATEGORY
    // =========================================================================

    public static resetCategory(
        category?: string
    ): void {

        const normalizedCategory =
            this.normalizeCategory(
                category
            );

        this.counters.delete(
            normalizedCategory
        );

        console.log(
            `🗃️ Archive-ID Zähler zurückgesetzt: ${normalizedCategory}`
        );
    }

    // =========================================================================
    // DESCRIBE
    // =========================================================================

    public static describe(
        archiveId: string
    ): string {

        if (
            !this.isValid(
                archiveId
            )
        ) {

            return [
                "🗃️ Archive-ID",

                `ID: ${archiveId}`,

                "❌ Ungültige Archive-ID"
            ].join(
                "\n"
            );
        }

        const category =
            this.getCategory(
                archiveId
            );

        const number =
            this.getNumber(
                archiveId
            );

        return [
            "🗃️ Archive-ID",

            `🆔 ${archiveId}`,

            `🏷️ Kategorie: ${category}`,

            `🔢 Nummer: ${number}`
        ].join(
            "\n"
        );
    }
}