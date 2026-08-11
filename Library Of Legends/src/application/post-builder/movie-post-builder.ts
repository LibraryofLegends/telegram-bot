/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MoviePostBuilder

Architecture Layer..: Application

Module..............: Post System

Module ID...........: LOL-MOD-POST-0001

LOL-ID..............: LOL-POST-0001

File................: movie-post-builder.ts

Location............
Library Of Legends/src/application/post/

Version.............: 4.0.0

Status..............: Stable

Lifecycle...........: Production

Description.........

Final Telegram Post Builder for Library Of Legends.

Responsibilities:

- Build Netflix-style movie posts
- Build series-ready layouts
- Integrate TMDB metadata
- Render HTML-safe captions
- Generate inline buttons
- Support collections
- Support archive system
- Mobile optimized output

===============================================================================
*/

import { MovieCatalogEntry } from "../../domain/catalog/movie-catalog";
import { TMDBMetadata } from "../../infrastructure/tmdb/tmdb-client";

export interface MoviePost {
    caption: string;
    buttons: any[][];
    posterUrl?: string;
    backdropUrl?: string;
    parseMode: "HTML";
}

export class MoviePostBuilder {

    // =========================================================================
    // ENTRY
    // =========================================================================

    public static buildFull(
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): MoviePost {
        return this.build(movie, tmdb);
    }

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): MoviePost {

        return {
            caption: this.buildLayout(movie, tmdb),
            buttons: this.buildButtons(movie, tmdb),
            posterUrl: tmdb?.posterUrl,
            backdropUrl: tmdb?.backdropUrl,
            parseMode: "HTML"
        };
    }

    // =========================================================================
    // FINAL LAYOUT (CLEAN + NETFLIX STYLE)
    // =========================================================================

    private static buildLayout(
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const title = tmdb?.title || movie.title || "Unbekannt";
        const year = tmdb?.year || movie.year || "—";

        const rating = tmdb?.rating
            ? `${tmdb.rating.toFixed(1)}/10`
            : "—";

        const fsk = (movie as any).fsk
            ? `FSK ${(movie as any).fsk}`
            : "—";

        const cast = tmdb?.cast?.length
            ? tmdb.cast
                .slice(0, 3)
                .map(c => `#${c.name.replace(/\s+/g, "")}`)
                .join(" • ")
            : "—";

        const overview = tmdb?.overview
            ? this.limitText(tmdb.overview, 400)
            : "Keine Beschreibung verfügbar.";

        const quality = movie.quality || "—";
        const size = this.formatFileSize(Number(movie.fileSize)) || "—";
        const audio = movie.audio || "—";

        const archiveId = (movie as any).archiveId || "—";
        const category = (movie as any).category || "Allgemein";

        const collection = (movie as any).collection || null;
        const part = (movie as any).collectionPart || null;
        const total = (movie as any).collectionTotal || null;

        return `
🎬 <b>${this.escape(title)} (${year})</b>

━━━━━━━━━━━━━━━━━━

⭐ Bewertung: ${rating} | 🔞 ${fsk}
👥 ${this.escape(cast)}

━━━━━━━━━━━━━━━━━━

📖 <b>Handlung:</b>
${this.escape(overview)}

━━━━━━━━━━━━━━━━━━

📦 ${quality} · ${size} · ${audio}

${collection ? `
━━━━━━━━━━━━━━━━━━
🎞️ Reihe: ${this.escape(collection)} · ⚠️ ${part || "?"}/${total || "?"}
` : ""}

━━━━━━━━━━━━━━━━━━

📁 Archiv: <code>${archiveId}</code> #${category.replace(/\s+/g, "")}

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

        const archiveId = (movie as any).archiveId || "";
        const rows: any[][] = [];

        if (archiveId) {
            rows.push([
                {
                    text: "⭐ Favorit",
                    callback_data: `fav_${archiveId}`
                }
            ]);
        }

        if (tmdb?.id) {
            rows.push([
                {
                    text: "🎞️ TMDB",
                    url: `https://www.themoviedb.org/${tmdb.mediaType}/${tmdb.id}`
                }
            ]);
        }

        return rows;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private static escape(value: string): string {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    private static limitText(text: string, max: number): string {
        if (!text || text.length <= max) return text;
        return text.slice(0, max - 1).trim() + "…";
    }

    private static formatFileSize(bytes: number): string {
        if (!Number.isFinite(bytes) || bytes <= 0) return "";

        const units = ["B", "KB", "MB", "GB"];
        let i = 0;

        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }

        return `${bytes.toFixed(2)} ${units[i]}`;
    }
}