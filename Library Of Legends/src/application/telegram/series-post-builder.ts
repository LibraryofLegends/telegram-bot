/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesPostBuilder

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-POST-0002

LOL-ID..............: LOL-TG-POST-SER-0001

File................: series-post-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 5.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Netflix-style Series & Episode Post Builder for Telegram.

- Clean UI
- Stable fallback values
- TMDB integration
- Episode + Series support
- Inline button support

===============================================================================
*/

import { SeriesCatalogEntry } from "../../domain/catalog/series-catalog";
import { TMDBMetadata } from "../../infrastructure/tmdb/tmdb-client";

export interface SeriesPost {
    caption: string;
    buttons: any[][];
    posterUrl?: string;
    backdropUrl?: string;
    parseMode: "HTML";
}

export class SeriesPostBuilder {

    // =========================================================================
    // ENTRY POINT (WICHTIG für dein System)
    // =========================================================================

    public static buildFull(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): SeriesPost {
        return this.build(series, tmdb);
    }

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): SeriesPost {

        return {
            caption: this.buildLayout(series, tmdb),
            buttons: this.buildButtons(series, tmdb),
            posterUrl: tmdb?.posterUrl,
            backdropUrl: tmdb?.backdropUrl,
            parseMode: "HTML"
        };
    }

    // =========================================================================
    // MAIN LAYOUT (NETFLIX STYLE)
    // =========================================================================

    private static buildLayout(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const title = tmdb?.title || series.title || "Unbekannt";
        const year = tmdb?.year || "—";

        const episodeCode = this.formatEpisode(series.season, series.episode);

        const episodeTitle =
            (series as any).episodeTitle ||
            "";

        const rating =
            tmdb?.rating
                ? `⭐ ${tmdb.rating.toFixed(1)}/10`
                : "⭐ —";

        const genres =
            tmdb?.genres?.length
                ? tmdb.genres.map(g => g.name).join(" • ")
                : (series.genres || []).join(" • ") || "—";

        const overview =
            tmdb?.overview
                ? this.limitText(tmdb.overview, 500)
                : "Keine Beschreibung verfügbar.";

        const quality = series.quality || "—";

        const size =
            this.formatFileSize(
                Number(series.fileSize)
            ) || "—";

        const audio = series.audio || "—";

        const archiveId =
            (series as any).episodeArchiveId ||
            (series as any).seriesId ||
            "—";

        const category =
            (series as any).category ||
            "Serie";

        return `
📺 <b>${this.escape(title)} (${year})</b>

━━━━━━━━━━━━━━━━━━

🎬 <b>${episodeCode || "—"}</b>
${episodeTitle ? `🎞️ ${this.escape(episodeTitle)}` : ""}

━━━━━━━━━━━━━━━━━━

${rating}
🏷️ ${this.escape(genres)}

━━━━━━━━━━━━━━━━━━

📦 ${quality} · ${size} · ${audio}

━━━━━━━━━━━━━━━━━━

📝 <b>Story:</b>
${this.escape(overview)}

━━━━━━━━━━━━━━━━━━

📁 <code>${archiveId}</code> #${category.replace(/\s+/g, "")}

📺 <b>Library Of Legends</b>
        `.trim();
    }

    // =========================================================================
    // BUTTONS
    // =========================================================================

    private static buildButtons(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ) {

        const rows: any[][] = [];

        const id =
            (series as any).episodeArchiveId ||
            (series as any).seriesId;

        if (id) {
            rows.push([
                {
                    text: "⭐ Favorit",
                    callback_data: `fav_${id}`
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

    private static formatEpisode(
        season?: number,
        episode?: number
    ): string {

        if (!season && !episode) {
            return "";
        }

        return `S${String(season || 0).padStart(2, "0")}E${String(episode || 0).padStart(2, "0")}`;
    }

    private static escape(value: string): string {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    private static limitText(
        text: string,
        max: number
    ): string {

        if (!text || text.length <= max) {
            return text;
        }

        return text
            .slice(0, max - 1)
            .trim() + "…";
    }

    private static formatFileSize(
        bytes: number
    ): string {

        if (!Number.isFinite(bytes) || bytes <= 0) {
            return "—";
        }

        const units = ["B", "KB", "MB", "GB"];

        let i = 0;

        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }

        return `${bytes.toFixed(2)} ${units[i]}`;
    }
}