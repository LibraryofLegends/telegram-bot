/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TelegramPostService

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-SERVICE-0001

LOL-ID..............: LOL-TG-SERVICE-CORE-0001

File................: telegram-post-service.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

CENTRAL ORCHESTRATION LAYER

This is the brain of your Telegram system.

Responsibilities:

- Detect content type (movie / series)
- Fetch TMDB metadata
- Build Telegram posts
- Route to correct builder
- Return ready-to-send Telegram payload

===============================================================================
*/

import { MovieCatalogEntry } from "../../domain/catalog/movie-catalog";
import { SeriesCatalogEntry } from "../../domain/catalog/series-catalog";

import { TMDBClient } from "../../infrastructure/tmdb/tmdb-client";

import { MoviePostBuilder, MoviePost } from "./movie-post-builder";
import { SeriesPostBuilder, SeriesPost } from "./series-post-builder";

/**
 * Unified Telegram Post Response
 */
export type TelegramPost =
    | MoviePost
    | SeriesPost;

/**
 * Telegram Post Service (CORE)
 */
export class TelegramPostService {

    // =========================================================================
    // MOVIE PIPELINE 🎬
    // =========================================================================

    public static async buildMoviePost(
        movie: MovieCatalogEntry
    ): Promise<MoviePost> {

        let tmdb;

        try {
            tmdb = await TMDBClient.findMovie(
                movie.title,
                movie.year
            );
        } catch (err) {
            console.warn("⚠️ TMDB Movie fehlgeschlagen");
        }

        return MoviePostBuilder.buildFull(
            movie,
            tmdb
        );
    }

    // =========================================================================
    // SERIES PIPELINE 📺
    // =========================================================================

    public static async buildSeriesPost(
        series: SeriesCatalogEntry
    ): Promise<SeriesPost> {

        let tmdb;

        try {
            tmdb = await TMDBClient.findSeries(
                series.title
            );
        } catch (err) {
            console.warn("⚠️ TMDB Series fehlgeschlagen");
        }

        return SeriesPostBuilder.buildFull(
            series,
            tmdb
        );
    }

    // =========================================================================
    // AUTO DETECT (MASTER ENTRY) 🧠
    // =========================================================================

    public static async build(
        entry:
            | MovieCatalogEntry
            | SeriesCatalogEntry
    ): Promise<TelegramPost> {

        // 🔍 SIMPLE DETECTION LOGIC
        if (this.isSeries(entry)) {
            return this.buildSeriesPost(
                entry as SeriesCatalogEntry
            );
        }

        return this.buildMoviePost(
            entry as MovieCatalogEntry
        );
    }

    // =========================================================================
    // DETECTION LOGIC
    // =========================================================================

    private static isSeries(
        entry: any
    ): boolean {

        return (
            entry.season !== undefined ||
            entry.episode !== undefined
        );
    }

    // =========================================================================
    // DEBUG OUTPUT 🧪
    // =========================================================================

    public static async describe(
        entry:
            | MovieCatalogEntry
            | SeriesCatalogEntry
    ): Promise<string> {

        const post =
            await this.build(entry);

        return [

            "=================================================",
            "🧠 TELEGRAM POST SERVICE",
            "=================================================",
            "",
            post.caption,
            "",
            "=================================================",
            `🔘 Buttons: ${post.buttons.length}`,
            `🖼 Poster: ${post.posterUrl || "—"}`,
            `🌄 Backdrop: ${post.backdropUrl || "—"}`,
            "================================================="

        ].join("\n");
    }
}