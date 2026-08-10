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

Version.............: 2.1.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central movie catalog service for Library Of Legends.

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
    MoviePostBuilder,
    MoviePost
} from "../telegram/movie-post-builder";

/**
 * Input data for a movie.
 */
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
}

/**
 * Normalized movie catalog entry.
 */
export interface MovieCatalogEntry
    extends MovieCatalogInput {

    genres: LibraryGenre[];

    primaryGenre: LibraryGenre;

    category: string;

    categoryId: string;

    archiveId: string;

    post: MoviePost;
}

/**
 * Movie Catalog
 */
export class MovieCatalog {

    public static create(
        input: MovieCatalogInput
    ): MovieCatalogEntry {

        const title =
            this.clean(input.title) ||
            "Unbekannter Film";

        // GENRES
        const genres =
            GenreDetector.detect(title);

        const primaryGenre =
            GenreDetector.detectPrimary(title);

        // ROUTING
        const route: GenreRoute =
            GenreRouter.route(genres);

        // ARCHIVE ID
        const archiveId =
            ArchiveIdGenerator.generate(primaryGenre);

        // BUILD POST (WICHTIG 🔥)
        const post =
            MoviePostBuilder.build({
                title,
                year: input.year,
                genres,
                quality: input.quality,
                resolution: input.resolution,
                source: input.source,
                audio: input.audio,
                audioCodec: input.audioCodec,
                audioChannels: input.audioChannels,
                videoCodec: input.videoCodec,
                hdr: input.hdr,
                fileSize: input.fileSize,
                originalFileName: input.fileName,
                archiveId,
                category: route.categoryTitle
            } as any); // optional später sauber typisieren

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

    public static buildPost(
        input: MovieCatalogInput
    ): MoviePost {

        return this.create(input).post;
    }

    private static clean(
        value: unknown
    ): string {

        return String(value ?? "").trim();
    }
}