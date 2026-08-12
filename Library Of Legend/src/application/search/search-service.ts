/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SearchService

Architecture Layer..: Application

Module..............: Search

Module ID...........: LOL-MOD-APP-SEARCH-0001

LOL-ID..............: LOL-SEARCH-SERVICE-0001

File................: search-service.ts

Location............
Library Of Legend/src/application/search/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Search movies inside the local database.

Features:

- Title search
- Collection search
- Case-insensitive matching
- Clean result formatting

===============================================================================
*/

import { MovieRepository } from "../../infrastructure/database/database";

// =============================================================================
// TYPES
// =============================================================================

export interface SearchResult {
    title: string;
    year?: number;
    archiveId: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class SearchService {

    public static search(query: string): SearchResult[] {

        const cleanQuery =
            query
                .toLowerCase()
                .trim();

        const movies =
            MovieRepository.getAll();

        const results =
            movies.filter(movie => {

                const titleMatch =
                    movie.title
                        .toLowerCase()
                        .includes(cleanQuery);

                const collectionMatch =
                    movie.collection &&
                    movie.collection
                        .toLowerCase()
                        .includes(cleanQuery);

                return titleMatch || collectionMatch;
            });

        // Sort by year DESC
        results.sort((a, b) =>
            (b.year || 0) - (a.year || 0)
        );

        return results.map(movie => ({
            title: movie.title,
            year: movie.year,
            archiveId: movie.archiveId
        }));
    }

    // =============================================================================
    // FORMAT TELEGRAM OUTPUT
    // =============================================================================

    public static format(results: SearchResult[]): string {

        if (results.length === 0) {
            return "❌ Keine Ergebnisse gefunden.";
        }

        const lines =
            results.map(movie =>
                `🎬 ${movie.title}${movie.year ? ` (${movie.year})` : ""}`
            );

        return [
            "━━━━━━━━━━━━━━━━━━",
            "🔎 Suchergebnisse",
            "━━━━━━━━━━━━━━━━━━",
            ...lines,
            "━━━━━━━━━━━━━━━━━━",
            `📊 ${results.length} Treffer`,
            "🔥 Library Of Legends"
        ].join("\n");
    }
}