/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SearchService

Architecture Layer..: Application

Module..............: Search

Module ID...........: LOL-MOD-APP-SEARCH-0001

LOL-ID..............: LOL-SEARCH-SERVICE-0003

File................: search-service.ts

Location............
Library Of Legends/src/application/search/

Version.............: 1.2.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central search service for Library Of Legends.

Responsibilities:

- Search archived movies by title
- Search archived movies by collection
- Perform case-insensitive searches
- Return normalized search results
- Preserve Archive IDs
- Format results for Telegram
- Use the existing MovieRepository API

Important:

- MovieRepository.getAll() is the canonical database read method.
- SearchService.search() is the canonical search method used by TelegramBot.
- No duplicate database layer is created here.
- No undefined archive ID is returned.

===============================================================================
*/

// =============================================================================
// IMPORTS
// =============================================================================

import {
    MovieRepository,
    MovieRecord
} from "../../infrastructure/database/database";

// =============================================================================
// TYPES
// =============================================================================

export interface SearchResult {

    title:
        string;

    year?:
        number;

    archiveId:
        string;

    collection?:
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

        const normalizedQuery =
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
            !normalizedQuery
        ) {

            return [];
        }

        // =====================================================================
        // LOAD DATABASE
        // =====================================================================

        const movies:
            MovieRecord[] =
                MovieRepository.getAll();

        // =====================================================================
        // FILTER
        // =====================================================================

        const filtered =
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
                            normalizedQuery
                        ) ||
                        collection.includes(
                            normalizedQuery
                        )
                    );
                }
            );

        // =====================================================================
        // SORT
        // =====================================================================

        filtered.sort(
            (
                first,
                second
            ) => {

                const firstTitle =
                    String(
                        first.title ||
                        ""
                    ).toLowerCase();

                const secondTitle =
                    String(
                        second.title ||
                        ""
                    ).toLowerCase();

                if (
                    firstTitle <
                    secondTitle
                ) {

                    return -1;
                }

                if (
                    firstTitle >
                    secondTitle
                ) {

                    return 1;
                }

                const firstYear =
                    first.year ||
                    0;

                const secondYear =
                    second.year ||
                    0;

                return (
                    firstYear -
                    secondYear
                );
            }
        );

        // =====================================================================
        // NORMALIZE RESULTS
        // =====================================================================

        return filtered.map(
            movie => {

                return {

                    title:
                        movie.title ||
                        "Unbekannt",

                    year:
                        movie.year,

                    archiveId:
                        movie.archiveId ||
                        "UNKNOWN",

                    collection:
                        movie.collection ||
                        undefined
                };
            }
        );
    }

    // =========================================================================
    // FORMAT RESULTS
    // =========================================================================

    public static format(
        results: SearchResult[]
    ): string {

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
                "🔥 <b>@LibraryOfLegends</b>"
            ].join(
                "\n"
            );
        }

        const lines:
            string[] = [

            "━━━━━━━━━━━━━━━━━━",

            "🔎 <b>Suchergebnisse</b>",

            "━━━━━━━━━━━━━━━━━━",

            ""
        ];

        for (
            const result of results
        ) {

            const yearText =
                result.year
                    ? ` (${result.year})`
                    : "";

            lines.push(
                `🎬 <b>${this.escapeHtml(
                    result.title
                )}</b>${yearText}`
            );

            lines.push(
                `🗂️ <code>${this.escapeHtml(
                    result.archiveId
                )}</code>`
            );

            if (
                result.collection
            ) {

                lines.push(
                    `🎞️ ${this.escapeHtml(
                        result.collection
                    )}`
                );
            }

            lines.push("");
        }

        lines.push(
            "━━━━━━━━━━━━━━━━━━"
        );

        lines.push(
            `📊 ${results.length} Treffer`
        );

        lines.push(
            "🔥 <b>@LibraryOfLegends</b>"
        );

        return lines.join(
            "\n"
        );
    }

    // =========================================================================
    // SEARCH MOVIES
    // =========================================================================
    //
    // Compatibility alias.
    //
    // Existing code can use searchMovies(), while the Telegram bot uses the
    // canonical search() method.
    //
    // =========================================================================

    public static searchMovies(
        query: string
    ): SearchResult[] {

        return this.search(
            query
        );
    }

    // =========================================================================
    // FORMAT RESULTS ALIAS
    // =========================================================================

    public static formatResults(
        results: SearchResult[]
    ): string {

        return this.format(
            results
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