/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SearchService

Architecture Layer..: Application

Module..............: Search

Module ID...........: LOL-MOD-APP-SRC-0001

LOL-ID..............: LOL-SRC-SERVICE-0001

File................: search-service.ts

Location............
Library Of Legend/src/application/search/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Search system for Library Of Legends.

Responsibilities:

- Search movies from database
- Return formatted search results
- Ensure type safety (no undefined issues)
- Prepare data for Telegram output

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

    // =========================================================================
    // SEARCH MOVIES
    // =========================================================================

    public static searchMovies(query: string): SearchResult[] {

        if (!query || query.trim().length === 0) {
            return [];
        }

        const normalizedQuery = query
            .toLowerCase()
            .trim();

        const movies = MovieRepository.getAllMovies();

        const results = movies
            .filter((movie: any) => {

                if (!movie.title) return false;

                return movie.title
                    .toLowerCase()
                    .includes(normalizedQuery);

            })
            .map((movie: any): SearchResult => {

                return {
                    title: movie.title || "Unbekannt",
                    year: movie.year,
                    archiveId: movie.archiveId ?? "UNKNOWN"
                };

            })
            .sort((a: SearchResult, b: SearchResult) => {

                const titleA = a.title.toLowerCase();
                const titleB = b.title.toLowerCase();

                if (titleA < titleB) return -1;
                if (titleA > titleB) return 1;

                return 0;
            });

        return results;
    }

    // =========================================================================
    // FORMAT FOR TELEGRAM
    // =========================================================================

    public static formatResults(results: SearchResult[]): string {

        if (!results || results.length === 0) {
            return "❌ Keine Ergebnisse gefunden.";
        }

        const lines: string[] = [];

        lines.push("🔎 <b>Suchergebnisse</b>");
        lines.push("");
        lines.push("━━━━━━━━━━━━━━━━━━");

        for (const result of results) {

            lines.push("");
            lines.push(
                `🎬 <b>${this.escapeHtml(result.title)}</b>` +
                (result.year ? ` (${result.year})` : "")
            );

            lines.push(
                `🗂 <code>${this.escapeHtml(result.archiveId)}</code>`
            );
        }

        lines.push("");
        lines.push("━━━━━━━━━━━━━━━━━━");

        return lines.join("\n");
    }

    // =========================================================================
    // HTML ESCAPE
    // =========================================================================

    private static escapeHtml(value: string): string {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
}