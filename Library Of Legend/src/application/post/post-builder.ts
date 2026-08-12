/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: PostBuilder

Architecture Layer..: Application

Module..............: Post

Module ID...........: LOL-MOD-APP-POST-0001

LOL-ID..............: LOL-POST-BUILDER-0004

File................: post-builder.ts

Location............
Library Of Legends/src/application/post/

Version.............: 2.2.0

Status..............: Core

Lifecycle...........: Production

Description.........

Builds the final movie metadata post for Library Of Legends.

Responsibilities:

- Format movie title
- Format rating
- Format genres
- Format synopsis
- Generate genre hashtags
- Generate title hashtags
- Detect movie collections
- Calculate collection progress
- Generate archive ID
- Format technical information
- Keep Telegram presentation centralized
- Keep collection blocks type-safe
- Keep synopsis at a clean sentence boundary

===============================================================================
*/

// =============================================================================
// IMPORTS
// =============================================================================

import {
    HashtagBuilder
} from "../hashtag/hashtag-builder";

import {
    ArchiveId
} from "../archive/archive-id";

import {
    CollectionService
} from "../collection/collection-service";

import {
    CollectionProgressService
} from "../collection/collection-progress";

// =============================================================================
// TYPES
// =============================================================================

export interface MoviePostInput {

    title:
        string;

    year?:
        number;

    rating?:
        number;

    genres:
        string[];

    overview?:
        string;

    fileName?:
        string;

    fileSize?:
        number;

    quality?:
        string;

    size?:
        string;

    audio?:
        string;

    source?:
        string;

    collection?:
        string | null;

    archiveId?:
        string;
}

// =============================================================================
// BUILDER
// =============================================================================

export class PostBuilder {

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        input: MoviePostInput
    ): string {

        // =====================================================================
        // BASIC DATA
        // =====================================================================

        const title =
            String(
                input.title ||
                "Unbekannt"
            ).trim();

        const yearText =
            input.year !==
                undefined
                ? ` (${input.year})`
                : "";

        const ratingText =
            input.rating !==
                undefined
                ? `${input.rating.toFixed(1)}/10`
                : "—";

        const genres =
            Array.isArray(
                input.genres
            ) &&
            input.genres.length > 0
                ? input.genres
                : [];

        const genreText =
            genres.length > 0
                ? genres.join(
                    ", "
                )
                : "—";

        // =====================================================================
        // OVERVIEW
        // =====================================================================

        const overview =
            this.formatOverview(
                input.overview
            );

        // =====================================================================
        // TECHNICAL DATA
        // =====================================================================

        const quality =
            input.quality ||
            "—";

        const size =
            input.size ||
            this.formatSize(
                input.fileSize
            );

        const audio =
            input.audio ||
            "—";

        const source =
            input.source ||
            "";

        const technicalParts:
            string[] = [
                quality,
                size,
                audio
            ];

        if (
            source
        ) {

            technicalParts.push(
                source
            );
        }

        // =====================================================================
        // HASHTAGS
        // =====================================================================

        const generatedHashtags =
            HashtagBuilder.build({

                title,

                genres
            });

        const hashtagText =
            generatedHashtags
                .join(
                    " "
                );

        // =====================================================================
        // ARCHIVE ID
        // =====================================================================

        const archiveId =
            input.archiveId ||
            ArchiveId.generate(
                {
                    genres
                }
            );

        // =====================================================================
        // COLLECTION
        // =====================================================================

        const detectedCollection =
            input.collection ||
            CollectionService.detect(
                title
            );

        /*
         * IMPORTANT:
         *
         * collectionBlock is an ARRAY because individual lines
         * are added with push() below.
         *
         * It is converted to a string only after construction.
         */

        const collectionLines:
            string[] = [];

        if (
            detectedCollection
        ) {

            collectionLines.push(
                `🎞️ Reihe: ${this.escapeHtml(
                    detectedCollection
                )}`
            );

            // =================================================================
            // COLLECTION PROGRESS
            // =================================================================

            try {

                const progress =
                    CollectionProgressService.get(
                        detectedCollection
                    );

                if (
                    progress.complete
                ) {

                    collectionLines.push(
                        `✅ vollständig ${progress.formatted}`
                    );

                } else {

                    collectionLines.push(
                        `⚠️ ${progress.formatted} vorhanden`
                    );
                }

            } catch (
                error
            ) {

                console.error(
                    "⚠️ Collection Progress Fehler:",
                    error
                );
            }
        }

        const collectionBlock =
            collectionLines.join(
                "\n"
            );

        // =====================================================================
        // ARCHIVE SECTION
        // =====================================================================

        const archiveParts:
            string[] = [];

        archiveParts.push(
            this.escapeHtml(
                archiveId
            )
        );

        if (
            hashtagText
        ) {

            archiveParts.push(
                hashtagText
            );
        }

        const archiveLine =
            archiveParts.join(
                " "
            );

        // =====================================================================
        // FINAL LAYOUT
        // =====================================================================

        const sections:
            string[] = [

            "━━━━━━━━━━━━━━━━━━",

            `🎬 <b>${this.escapeHtml(
                title
            )}${yearText}</b>`,

            "━━━━━━━━━━━━━━━━━━",

            `⭐ Bewertung: ${ratingText}`,

            `🎭 Genres: ${this.escapeHtml(
                genreText
            )}`,

            "━━━━━━━━━━━━━━━━━━",

            "",

            "📝 <b>Handlung:</b>",

            this.escapeHtml(
                overview
            ),

            "━━━━━━━━━━━━━━━━━━",

            "",

            `📦 ${technicalParts
                .map(
                    value =>
                        this.escapeHtml(
                            value
                        )
                )
                .join(
                    " · "
                )}`,

            "━━━━━━━━━━━━━━━━━━"
        ];

        // =====================================================================
        // COLLECTION BLOCK
        // =====================================================================

        if (
            collectionBlock
        ) {

            sections.push(
                collectionBlock
            );

            sections.push(
                "━━━━━━━━━━━━━━━━━━"
            );
        }

        // =====================================================================
        // ARCHIVE
        // =====================================================================

        sections.push(
            `🗂️ Archiv: ${archiveLine}`
        );

        // =====================================================================
        // FOOTER
        // =====================================================================

        sections.push(
            "🔥 <b>@LibraryOfLegends</b>"
        );

        // =====================================================================
        // FINAL RESULT
        // =====================================================================

        return sections
            .join(
                "\n"
            )
            .trim();
    }

    // =========================================================================
    // OVERVIEW
    // =========================================================================

    private static formatOverview(
        text?: string
    ): string {

        const fallback =
            "Keine Beschreibung verfügbar.";

        const clean =
            String(
                text ||
                fallback
            )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (
            clean.length <=
            420
        ) {

            return this.ensureFinalPeriod(
                clean
            );
        }

        // =====================================================================
        // FIND COMPLETE SENTENCE
        // =====================================================================

        const shortened =
            clean.slice(
                0,
                420
            );

        const matches =
            shortened.match(
                /[^.!?]*[.!?](?=\s|$)/g
            );

        if (
            matches &&
            matches.length > 0
        ) {

            const complete =
                matches
                    .join(
                        ""
                    )
                    .trim();

            if (
                complete.length >=
                120
            ) {

                return this.ensureFinalPeriod(
                    complete
                );
            }
        }

        // =====================================================================
        // EXTENDED SENTENCE SEARCH
        // =====================================================================

        const extended =
            clean.slice(
                0,
                560
            );

        const extendedMatches =
            extended.match(
                /[^.!?]*[.!?](?=\s|$)/g
            );

        if (
            extendedMatches &&
            extendedMatches.length > 0
        ) {

            const complete =
                extendedMatches
                    .join(
                        ""
                    )
                    .trim();

            return this.ensureFinalPeriod(
                complete
            );
        }

        // =====================================================================
        // FALLBACK
        // =====================================================================

        const lastSpace =
            shortened.lastIndexOf(
                " "
            );

        const fallbackText =
            lastSpace > 0
                ? shortened.slice(
                    0,
                    lastSpace
                )
                : shortened;

        return this.ensureFinalPeriod(
            fallbackText
        );
    }

    // =========================================================================
    // ENSURE PERIOD
    // =========================================================================

    private static ensureFinalPeriod(
        value: string
    ): string {

        const text =
            String(
                value ||
                ""
            ).trim();

        if (
            !text
        ) {

            return "Keine Beschreibung verfügbar.";
        }

        /*
         * Remove dangling ellipsis and duplicate periods.
         */

        const clean =
            text
                .replace(
                    /\.{2,}$/g,
                    ""
                )
                .replace(
                    /…+$/g,
                    ""
                )
                .trim();

        if (
            /[.!?]$/.test(
                clean
            )
        ) {

            return clean;
        }

        return `${clean}.`;
    }

    // =========================================================================
    // FILE SIZE
    // =========================================================================

    private static formatSize(
        bytes?: number
    ): string {

        if (
            !bytes ||
            !Number.isFinite(
                bytes
            ) ||
            bytes <=
                0
        ) {

            return "—";
        }

        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        let value =
            bytes;

        let index =
            0;

        while (
            value >=
                1024 &&
            index <
                units.length - 1
        ) {

            value /=
                1024;

            index++;
        }

        return `${value.toFixed(
            index === 0
                ? 0
                : 2
        )} ${units[index]}`;
    }

    // =========================================================================
    // HTML ESCAPE
    // =========================================================================

    private static escapeHtml(
        value: string
    ): string {

        return String(
            value ||
            ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#39;"
            );
    }
}