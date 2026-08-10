/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesPostBuilder

Architecture Layer..: Application

Module..............: Post Builder

Module ID...........: LOL-MOD-POST-0002

LOL-ID..............: LOL-POST-SER-0001

File................: series-post-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Builds the standardized Library Of Legends series archive post.

Combines:

- Series catalog information
- TMDB metadata
- Season and episode information
- Archive ID
- Genres
- Technical media information

The resulting text is designed for direct publication
inside the Library Of Legends Telegram series archive.

===============================================================================
*/

import {
    SeriesCatalogItem
} from "../../domain/catalog/series-catalog";

import {
    TMDBSeriesResult,
    TMDBClient
} from "../../infrastructure/api/tmdb/tmdb-client";

export interface SeriesPostOptions {

    archiveId?: string;

    fileSize?: string;

    fsk?: string;

    cast?: string[];

    country?: string;

    episodeTitle?: string;

    runtime?: number;

    telegramChannel?: string;
}

export class SeriesPostBuilder {

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        series: SeriesCatalogItem,
        tmdb?: TMDBSeriesResult | null,
        options: SeriesPostOptions = {}
    ): string {

        const title =
            tmdb?.name ||
            series.title;

        const year =
            this.getYear(
                series,
                tmdb
            );

        const rating =
            this.formatRating(
                tmdb?.rating
            );

        const episode =
            this.formatEpisode(
                series.season,
                series.episode,
                options.episodeTitle
            );

        const genres =
            this.formatGenres(
                series
            );

        const technical =
            this.formatTechnicalData(
                series,
                options
            );

        const overview =
            this.formatOverview(
                tmdb?.overview
            );

        const cast =
            this.formatCast(
                options.cast
            );

        const country =
            options.country
                ? `🌍 ${options.country}`
                : "";

        const runtime =
            options.runtime
                ? `⏱ ${options.runtime} Min.`
                : "";

        const archive =
            options.archiveId
                ? `🗂 Archiv: ${options.archiveId}`
                : "";

        return [
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `📺 ${title}${year ? ` (${year})` : ""}`,
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            episode,
            "",
            rating,
            country,
            runtime,
            cast,
            "",
            overview,
            "",
            technical,
            "",
            genres,
            archive,
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "📚 Library Of Legends",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ]
            .filter(
                line => line !== ""
            )
            .join("\n");
    }

    // =========================================================================
    // YEAR
    // =========================================================================

    private static getYear(
        series: SeriesCatalogItem,
        tmdb?: TMDBSeriesResult | null
    ): number | undefined {

        if (
            series.year
        ) {

            return series.year;
        }

        if (
            tmdb?.firstAirDate
        ) {

            const year =
                Number(
                    tmdb.firstAirDate.substring(
                        0,
                        4
                    )
                );

            if (
                Number.isFinite(year)
            ) {

                return year;
            }
        }

        return undefined;
    }

    // =========================================================================
    // EPISODE
    // =========================================================================

    private static formatEpisode(
        season?: number,
        episode?: number,
        episodeTitle?: string
    ): string {

        if (
            season === undefined &&
            episode === undefined
        ) {

            return "📺 Episode: —";
        }

        const seasonText =
            season !== undefined
                ? `S${String(season).padStart(2, "0")}`
                : "";

        const episodeText =
            episode !== undefined
                ? `E${String(episode).padStart(2, "0")}`
                : "";

        const number =
            `${seasonText}${episodeText}`;

        if (
            episodeTitle
        ) {

            return (
                `🎬 ${number} — ${episodeTitle}`
            );
        }

        return (
            `🎬 ${number}`
        );
    }

    // =========================================================================
    // RATING
    // =========================================================================

    private static formatRating(
        rating?: number
    ): string {

        if (
            rating === undefined ||
            !Number.isFinite(rating)
        ) {

            return "⭐ Bewertung: —";
        }

        return (
            `⭐ Bewertung: ${rating.toFixed(1)}/10`
        );
    }

    // =========================================================================
    // GENRES
    // =========================================================================

    private static formatGenres(
        series: SeriesCatalogItem
    ): string {

        if (
            !series.genres.length
        ) {

            return "#Unbekannt";
        }

        return series.genres
            .map(
                genre =>
                    `#${this.normalizeHashtag(genre)}`
            )
            .join(" ");
    }

    // =========================================================================
    // TECHNICAL DATA
    // =========================================================================

    private static formatTechnicalData(
        series: SeriesCatalogItem,
        options: SeriesPostOptions
    ): string {

        const lines: string[] = [];

        if (
            series.quality
        ) {

            lines.push(
                `📺 Qualität: ${series.quality}`
            );
        }

        if (
            series.resolution
        ) {

            lines.push(
                `📐 Auflösung: ${series.resolution}`
            );
        }

        if (
            series.source
        ) {

            lines.push(
                `📦 Quelle: ${series.source}`
            );
        }

        if (
            series.videoCodec
        ) {

            lines.push(
                `🎥 Codec: ${series.videoCodec}`
            );
        }

        if (
            series.audio
        ) {

            lines.push(
                `🔊 Audio: ${series.audio}`
            );
        }

        if (
            options.fileSize
        ) {

            lines.push(
                `💾 Größe: ${options.fileSize}`
            );
        }

        if (
            options.fsk
        ) {

            lines.push(
                `🔞 FSK: ${options.fsk}`
            );
        }

        if (
            series.extension
        ) {

            lines.push(
                `📄 Format: ${series.extension.toUpperCase()}`
            );
        }

        if (
            lines.length === 0
        ) {

            return "📦 Technische Daten: —";
        }

        return lines.join("\n");
    }

    // =========================================================================
    // OVERVIEW
    // =========================================================================

    private static formatOverview(
        overview?: string
    ): string {

        if (
            !overview
        ) {

            return "📝 Handlung: Keine Beschreibung verfügbar.";
        }

        const cleaned =
            overview
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        const maxLength =
            700;

        const text =
            cleaned.length > maxLength
                ? `${cleaned.substring(0, maxLength)}...`
                : cleaned;

        return [
            "📝 Handlung:",
            "",
            text
        ].join("\n");
    }

    // =========================================================================
    // CAST
    // =========================================================================

    private static formatCast(
        cast?: string[]
    ): string {

        if (
            !cast ||
            cast.length === 0
        ) {

            return "";
        }

        const names =
            cast
                .slice(0, 8)
                .map(
                    name =>
                        `#${this.normalizeHashtag(name)}`
                )
                .join(" ");

        return `👥 ${names}`;
    }

    // =========================================================================
    // HASHTAG NORMALIZATION
    // =========================================================================

    private static normalizeHashtag(
        value: string
    ): string {

        return value
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-zA-Z0-9äöüÄÖÜß]/g,
                ""
            );
    }

    // =========================================================================
    // POSTER URL
    // =========================================================================

    public static getPosterUrl(
        tmdb?: TMDBSeriesResult | null
    ): string | null {

        if (
            !tmdb?.posterPath
        ) {

            return null;
        }

        return TMDBClient.getPosterUrl(
            tmdb.posterPath,
            "w500"
        );
    }
}