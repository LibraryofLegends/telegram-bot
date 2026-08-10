/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MovieCatalog

Architecture Layer..: Application

Module..............: Catalog

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-MOV-0001

File................: movie-catalog.ts

Location............
Library Of Legends/src/application/catalog/

Version.............: 3.0.0

Status..............: STABLE

Lifecycle...........: Production Ready

Description.........

FIXED version compatible with MoviePostBuilder v4

===============================================================================
*/

import {
    GenreDetector,
    LibraryGenre
} from "../../domain/detection/genre-detector";

import {
    GenreRouter,
    GenreRoute
} from "../routing/genre-router";

import {
    ArchiveIdGenerator
} from "../archive/archive-id-generator";

import {
    MoviePostBuilder
} from "../post-builder/movie-post-builder";

// ============================================================================
// INPUT
// ============================================================================

export interface MovieCatalogInput {
    title: string;
    year?: number;
    fileName?: string;
    fileId?: string;

    quality?: string;
    resolution?: string;
    source?: string;

    audio?: string;
    audioCodec?: string;
    audioChannels?: string;
    videoCodec?: string;
    hdr?: string;

    fileSize?: number | string;

    country?: string;
    runtime?: number | string;
    fsk?: string | number;

    director?: string;
    cast?: string;
    overview?: string;

    originalLanguage?: string;

    tmdbId?: string | number;
    tmdbRating?: string | number;
}

// ============================================================================
// OUTPUT
// ============================================================================

export interface MovieCatalogEntry extends MovieCatalogInput {
    genres: LibraryGenre[];
    primaryGenre: LibraryGenre;

    category: string;
    categoryId: string;

    archiveId: string;

    post: string; // ✅ IMPORTANT FIX
}

// ============================================================================
// CLASS
// ============================================================================

export class MovieCatalog {

    // =========================================================================
    // CREATE
    // =========================================================================

    public static create(
        input: MovieCatalogInput
    ): MovieCatalogEntry {

        const title =
            this.clean(input.title) || "Unbekannter Film";

        // ============================================================
        // GENRES
        // ============================================================

        const genres = GenreDetector.detect(title);
        const primaryGenre = GenreDetector.detectPrimary(title);

        // ============================================================
        // ROUTING
        // ============================================================

        const route: GenreRoute =
            GenreRouter.route(genres);

        // ============================================================
        // ARCHIVE ID
        // ============================================================

        const archiveId =
            ArchiveIdGenerator.generate(primaryGenre);

        // ============================================================
        // BUILD POST (FIX)
        // ============================================================

        const movieEntry: any = {
            ...input,
            title,
            genres,
            primaryGenre,
            category: route.categoryTitle,
            categoryId: route.category,
            archiveId
        };

        const post =
            MoviePostBuilder.buildFull(movieEntry).caption;

        // ============================================================
        // RETURN
        // ============================================================

        return {
            ...input,
            title,
            genres,
            primaryGenre,
            category: route.categoryTitle,
            categoryId: route.category,
            archiveId,
            post
        };
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private static clean(value: unknown): string {
        return String(value ?? "").trim();
    }

    public static normalizeTitle(title: string): string {
        return this.clean(title)
            .replace(/\.(mp4|mkv|avi|mov|webm)$/i, "")
            .replace(/\s+/g, " ")
            .trim();
    }
}