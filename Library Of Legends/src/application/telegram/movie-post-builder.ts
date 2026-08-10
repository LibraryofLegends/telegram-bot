/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MoviePostBuilder

Architecture Layer..: Application

Module..............: Post Builder

Module ID...........: LOL-MOD-POST-0001

LOL-ID..............: LOL-POST-MOV-0001

File................: movie-post-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Builds the standardized Library Of Legends movie archive post.

Combines:

- Movie catalog information
- TMDB metadata
- Archive ID
- Genres
- Technical media information

The resulting text is designed for direct publication
inside the Library Of Legends Telegram archive.

===============================================================================
*/

import {
    MovieCatalogItem
} from "../../domain/catalog/movie-catalog";

import {
    TMDBMovieResult,
    TMDBClient
} from "../../infrastructure/api/tmdb/tmdb-client";

export interface MoviePostOptions {

    archiveId?: string;

    fileSize?: string;

    fsk?: string;

    director?: string;

    cast?: string[];

    country?: string;

    runtime?: number;

    telegramChannel?: string;
}

export class MoviePostBuilder {

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        movie: MovieCatalogItem,
        tmdb?: TMDBMovieResult | null,
        options: MoviePostOptions = {}
    ): string {

        const title =
            tmdb?.title ||
            movie.title;

        const year =
            this.getYear(
                movie,
                tmdb
            );

        const rating =
            this.formatRating(
                tmdb?.rating
            );

        const genres =
            this.formatGenres(
                movie
            );

        const technical =
            this.formatTechnicalData(
                movie,
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

        const archive =
            options.archiveId
                ? `\n🗂 Archiv: ${options.archiveId}`
                : "";

        const country =
            options.country
                ? `\n🌍 ${options.country}`
                : "";

        const runtime =
            options.runtime
                ? `\n⏱ ${options.runtime} Min.`
                : "";

        const director =
            options.director
                ? `\n🎬 Regie: ${options.director}`
                : "";

        return [
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `🎬 ${title}${year ? ` (${year})` : ""}`,
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            rating,
            country,
            runtime,
            director,
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
        movie: MovieCatalogItem,
        tmdb?: TMDBMovieResult | null
    ): number | undefined {

        if (movie.year) {
            return movie.year;
        }

        if (
            tmdb?.releaseDate
        ) {

            const year =
                Number(
                    tmdb.releaseDate.substring(
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
        movie: MovieCatalogItem
    ): string {

        if (
            !movie.genres.length
        ) {

            return "#Unbekannt";
        }

        return movie.genres
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
        movie: MovieCatalogItem,
        options: MoviePostOptions
    ): string {

        const lines: string[] = [];

        if (
            movie.quality
        ) {

            lines.push(
                `📺 Qualität: ${movie.quality}`
            );
        }

        if (
            movie.resolution
        ) {

            lines.push(
                `📐 Auflösung: ${movie.resolution}`
            );
        }

        if (
            movie.source
        ) {

            lines.push(
                `📦 Quelle: ${movie.source}`
            );
        }

        if (
            movie.videoCodec
        ) {

            lines.push(
                `🎥 Codec: ${movie.videoCodec}`
            );
        }

        if (
            movie.audio
        ) {

            lines.push(
                `🔊 Audio: ${movie.audio}`
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
            movie.extension
        ) {

            lines.push(
                `📄 Format: ${movie.extension.toUpperCase()}`
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
        tmdb?: TMDBMovieResult | null
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