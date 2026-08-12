/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SearchService

Architecture Layer..: Application

Module..............: Search

Module ID...........: LOL-MOD-APP-SEARCH-0001

LOL-ID..............: LOL-SEARCH-SERVICE-0002

File................: search-service.ts

Location............
Library Of Legends/src/application/search/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Search service for the Library Of Legends archive.

Responsibilities:

- Search archived movies by title
- Search archived movies by collection
- Perform case-insensitive matching
- Return normalized search results
- Safely handle missing Archive IDs
- Format search results for Telegram

===============================================================================
*/

import {
    MovieRepository
} from "../../infrastructure/database/database";

// =============================================================================
// TYPES
// =============================================================================

export interface SearchResult {

    title:
        string;

    year?:
        number;

    archiveId?:
        string;
}

// =============================================================================
// SEARCH SERVICE
// =============================================================================

export class SearchService {

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static search(
        query: string
    ): SearchResult[] {

        const cleanQuery =
            String(
                query ||
                ""
            )
                .trim()
                .toLowerCase();

        // =====================================================================
        // EMPTY QUERY
        // =====================================================================

        if (
            !cleanQuery
        ) {

            return [];
        }

        // =====================================================================
        // LOAD MOVIES
        // =====================================================================

        const movies =
            MovieRepository.getAll();

        // =====================================================================
        // FILTER
        // =====================================================================

        const results =
            movies.filter(
                movie => {

                    const title =
                        String(
                            movie.title ||
                            ""
                        )
                            .toLowerCase();

                    const collection =
                        String(
                            movie.collection ||
                            ""
                        )
                            .toLowerCase();

                    return (
                        title.includes(
                            cleanQuery
                        ) ||
                        collection.includes(
                            cleanQuery
                        )
                    );
                }
            );

        // =====================================================================
        // SORT
        // =====================================================================

        results.sort(
            (
                first,
                second
            ) => {

                const firstYear =
                    first.year ||
                    0;

                const secondYear =
                    second.year ||
                    0;

                return (
                    secondYear -
                    firstYear
                );
            }
        );

        // =====================================================================
        // NORMALIZE RESULTS
        // =====================================================================

        return results.map(
            movie => ({

                title:
                    movie.title,

                year:
                    movie.year,

                archiveId:
                    movie.archiveId
            })
        );
    }

    // =========================================================================
    // FORMAT RESULTS
    // =========================================================================

    public static format(
        results: SearchResult[]
    ): string {

        // =====================================================================
        // NO RESULTS
        // =====================================================================

        if (
            results.length ===
            0
        ) {

            return [
                "━━━━━━━━━━━━━━━━━━",
                "🔎 <b>Suchergebnisse</b>",
                "━━━━━━━━━━━━━━━━━━",
                "",
                "❌ Keine Ergebnisse gefunden.",
                "",
                "🔥 <b>Library Of Legends</b>"
            ].join(
                "\n"
            );
        }

        // =====================================================================
        // RESULT LINES
        // =====================================================================

        const lines:
            string[] = [];

        for (
            const result of results
        ) {

            const yearText =
                result.year
                    ? ` (${result.year})`
                    : "";

            const archiveText =
                result.archiveId
                    ? `\n   🗂️ <code>${this.escapeHtml(
                        result.archiveId
                    )}</code>`
                    : "";

            lines.push(
                `🎬 <b>${this.escapeHtml(
                    result.title
                )}</b>${yearText}${archiveText}`
            );

            lines.push("");
        }

        // =====================================================================
        // FINAL RESULT
        // =====================================================================

        return [
            "━━━━━━━━━━━━━━━━━━",
            "🔎 <b>Suchergebnisse</b>",
            "━━━━━━━━━━━━━━━━━━",
            "",
            ...lines,
            "━━━━━━━━━━━━━━━━━━",
            `📊 ${results.length} Treffer`,
            "🔥 <b>Library Of Legends</b>"
        ].join(
            "\n"
        );
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