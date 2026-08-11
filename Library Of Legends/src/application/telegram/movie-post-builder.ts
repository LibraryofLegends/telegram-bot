/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MoviePostBuilder

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-POST-0001

LOL-ID..............: LOL-TG-POST-MOV-0001

File................: movie-post-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 6.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Netflix-style Telegram movie post builder.

Fixes:
- Added buildFull() for compatibility with TelegramBot
- Improved fallback UI (no empty fields)
- Stabilized Netflix-style output

===============================================================================
*/

import {
    MovieCatalogEntry
} from "../../domain/catalog/movie-catalog";

import {
    TMDBMetadata
} from "../../infrastructure/tmdb/tmdb-client";

export interface MoviePost {
    caption: string;
    buttons: any[][];
    posterUrl?: string;
    backdropUrl?: string;
    parseMode: "HTML";
}

export class MoviePostBuilder {

    // =========================================================================
    // MAIN BUILD (COMPATIBILITY FIX)
    // =========================================================================

    public static buildFull(
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): MoviePost {

        return this.build(movie, tmdb);
    }

    // =========================================================================
    // ORIGINAL BUILD
    // =========================================================================

    public static build(
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): MoviePost {

        const caption =
            this.buildNetflixStyle(
                movie,
                tmdb
            );

        return {
            caption,
            buttons: this.buildButtons(movie, tmdb),
            posterUrl: tmdb?.posterUrl,
            backdropUrl: tmdb?.backdropUrl,
            parseMode: "HTML"
        };
    }

    // =========================================================================
    // NETFLIX STYLE POST
    // =========================================================================

    private static buildNetflixStyle(
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const title =
            tmdb?.title ||
            movie.title;

        const year =
            tmdb?.year ||
            movie.year ||
            "—";

        const rating =
            tmdb?.rating
                ? `⭐ ${tmdb.rating.toFixed(1)}/10`
                : "⭐ —";

        const fsk =
            (movie as any).fsk
                ? `🔞 FSK ${(movie as any).fsk}`
                : "🔞 —";

        const cast =
            tmdb?.cast?.length
                ? tmdb.cast
                      .slice(0, 3)
                      .map(c =>
                          `#${c.name.replace(/\s+/g, "")}`
                      )
                      .join(" • ")
                : "—";

        const overview =
            tmdb?.overview
                ? this.limitText(
                      tmdb.overview,
                      300
                  )
                : "Keine Beschreibung verfügbar.";

        const tech =
            [
                movie.quality,
                this.formatFileSize(
                    Number(movie.fileSize)
                ),
                movie.audio
            ]
                .filter(Boolean)
                .join(" · ") || "—";

        const archiveId =
            (movie as any).archiveId ||
            "—";

        const category =
            (movie as any).category ||
            "Allgemein";

        return `
🎬 <b>${this.escapeHtml(title)} (${year})</b>

━━━━━━━━━━━━━━━━━━

${rating} ${fsk}
👥 ${this.escapeHtml(cast)}

━━━━━━━━━━━━━━━━━━

📖 <b>Handlung:</b>
${this.escapeHtml(overview)}

━━━━━━━━━━━━━━━━━━

📦 ${this.escapeHtml(tech)}

━━━━━━━━━━━━━━━━━━

📁 Archiv: <code>${this.escapeHtml(archiveId)}</code> #${category.replace(/\s+/g, "")}

🎬 <b>Library Of Legends</b>
        `.trim();
    }

    // =========================================================================
    // BUTTONS
    // =========================================================================

    private static buildButtons(
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ) {

        const archiveId =
            (movie as any).archiveId || "";

        const rows: any[][] = [];

        if (archiveId) {
            rows.push([
                {
                    text: "⭐ Favorit",
                    callbackData: `fav_${archiveId}`
                }
            ]);
        }

        if (tmdb) {
            rows.push([
                {
                    text: "🎞️ TMDB",
                    url: `https://www.themoviedb.org/movie/${tmdb.id}`
                }
            ]);
        }

        return rows;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private static escapeHtml(value: string): string {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    private static limitText(
        value: string,
        maxLength: number
    ): string {

        const text =
            String(value || "").trim();

        if (text.length <= maxLength) {
            return text;
        }

        return (
            text
                .slice(0, maxLength - 1)
                .trim() + "…"
        );
    }

    private static formatFileSize(
        bytes: number
    ): string {

        if (!Number.isFinite(bytes) || bytes <= 0) {
            return "";
        }

        const units =
            ["B", "KB", "MB", "GB", "TB"];

        let value = bytes;
        let index = 0;

        while (
            value >= 1024 &&
            index < units.length - 1
        ) {
            value /= 1024;
            index++;
        }

        return `${value.toFixed(2)} ${units[index]}`;
    }
}