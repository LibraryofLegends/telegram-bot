/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TMDBClient

Architecture Layer..: Infrastructure

Module..............: External API

Module ID...........: LOL-MOD-TMDB-0001

LOL-ID..............: LOL-TMDB-0001

File................: tmdb-client.ts

Location............
Library Of Legends/src/infrastructure/api/tmdb/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Provides the Library Of Legends integration with The Movie Database
(TMDB).

Responsibilities:

- Movie search
- Series search
- Movie metadata retrieval
- Series metadata retrieval
- Poster information
- Overview / description
- Rating
- Release date
- Genres
- Original language
- TMDB identifier

The component communicates exclusively with the TMDB REST API
and does not contain Telegram or database logic.

===============================================================================
*/

export interface TMDBGenre {

    id: number;

    name: string;
}

export interface TMDBMovieResult {

    id: number;

    title: string;

    originalTitle?: string;

    overview?: string;

    releaseDate?: string;

    rating?: number;

    posterPath?: string;

    backdropPath?: string;

    originalLanguage?: string;

    genres?: TMDBGenre[];
}

export interface TMDBSeriesResult {

    id: number;

    name: string;

    originalName?: string;

    overview?: string;

    firstAirDate?: string;

    rating?: number;

    posterPath?: string;

    backdropPath?: string;

    originalLanguage?: string;

    genres?: TMDBGenre[];
}

interface TMDBApiResult {

    id: number;

    title?: string;

    name?: string;

    original_title?: string;

    original_name?: string;

    overview?: string;

    release_date?: string;

    first_air_date?: string;

    vote_average?: number;

    poster_path?: string | null;

    backdrop_path?: string | null;

    original_language?: string;

    genre_ids?: number[];
}

interface TMDBSearchResponse {

    results: TMDBApiResult[];
}

export class TMDBClient {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    private static readonly API_BASE_URL =
        "https://api.themoviedb.org/3";

    private static readonly IMAGE_BASE_URL =
        "https://image.tmdb.org/t/p/";

    private static readonly API_KEY =
        process.env.TMDB_API_KEY ||
        process.env.TMDB_KEY ||
        "";

    // =========================================================================
    // MOVIE SEARCH
    // =========================================================================

    public static async searchMovie(
        title: string
    ): Promise<TMDBMovieResult | null> {

        if (!this.API_KEY) {

            console.warn(
                "⚠️ TMDB_API_KEY ist nicht gesetzt."
            );

            return null;
        }

        const response =
            await this.request<TMDBSearchResponse>(
                "/search/movie",
                {
                    query: title
                }
            );

        const result =
            response.results?.[0];

        if (!result) {
            return null;
        }

        return this.mapMovie(
            result
        );
    }

    // =========================================================================
    // SERIES SEARCH
    // =========================================================================

    public static async searchSeries(
        title: string
    ): Promise<TMDBSeriesResult | null> {

        if (!this.API_KEY) {

            console.warn(
                "⚠️ TMDB_API_KEY ist nicht gesetzt."
            );

            return null;
        }

        const response =
            await this.request<TMDBSearchResponse>(
                "/search/tv",
                {
                    query: title
                }
            );

        const result =
            response.results?.[0];

        if (!result) {
            return null;
        }

        return this.mapSeries(
            result
        );
    }

    // =========================================================================
    // MOVIE DETAILS
    // =========================================================================

    public static async getMovie(
        id: number
    ): Promise<TMDBMovieResult | null> {

        if (!this.API_KEY) {
            return null;
        }

        const result =
            await this.request<TMDBApiResult>(
                `/movie/${id}`
            );

        return this.mapMovie(
            result
        );
    }

    // =========================================================================
    // SERIES DETAILS
    // =========================================================================

    public static async getSeries(
        id: number
    ): Promise<TMDBSeriesResult | null> {

        if (!this.API_KEY) {
            return null;
        }

        const result =
            await this.request<TMDBApiResult>(
                `/tv/${id}`
            );

        return this.mapSeries(
            result
        );
    }

    // =========================================================================
    // POSTER URL
    // =========================================================================

    public static getPosterUrl(
        posterPath?: string,
        size: string = "w500"
    ): string | null {

        if (!posterPath) {
            return null;
        }

        return (
            `${this.IMAGE_BASE_URL}` +
            `${size}` +
            `${posterPath}`
        );
    }

    // =========================================================================
    // BACKDROP URL
    // =========================================================================

    public static getBackdropUrl(
        backdropPath?: string,
        size: string = "w1280"
    ): string | null {

        if (!backdropPath) {
            return null;
        }

        return (
            `${this.IMAGE_BASE_URL}` +
            `${size}` +
            `${backdropPath}`
        );
    }

    // =========================================================================
    // HTTP REQUEST
    // =========================================================================

    private static async request<T>(
        endpoint: string,
        params: Record<string, string> = {}
    ): Promise<T> {

        const url =
            new URL(
                `${this.API_BASE_URL}${endpoint}`
            );

        url.searchParams.set(
            "api_key",
            this.API_KEY
        );

        url.searchParams.set(
            "language",
            "de-DE"
        );

        for (
            const [key, value]
            of Object.entries(params)
        ) {

            url.searchParams.set(
                key,
                value
            );
        }

        const response =
            await fetch(
                url.toString()
            );

        if (!response.ok) {

            throw new Error(
                `TMDB API Fehler: ${response.status} ${response.statusText}`
            );
        }

        return response.json() as Promise<T>;
    }

    // =========================================================================
    // MAP MOVIE
    // =========================================================================

    private static mapMovie(
        result: TMDBApiResult
    ): TMDBMovieResult {

        return {

            id:
                result.id,

            title:
                result.title ||
                "",

            originalTitle:
                result.original_title,

            overview:
                result.overview,

            releaseDate:
                result.release_date,

            rating:
                result.vote_average,

            posterPath:
                result.poster_path ||
                undefined,

            backdropPath:
                result.backdrop_path ||
                undefined,

            originalLanguage:
                result.original_language
        };
    }

    // =========================================================================
    // MAP SERIES
    // =========================================================================

    private static mapSeries(
        result: TMDBApiResult
    ): TMDBSeriesResult {

        return {

            id:
                result.id,

            name:
                result.name ||
                "",

            originalName:
                result.original_name,

            overview:
                result.overview,

            firstAirDate:
                result.first_air_date,

            rating:
                result.vote_average,

            posterPath:
                result.poster_path ||
                undefined,

            backdropPath:
                result.backdrop_path ||
                undefined,

            originalLanguage:
                result.original_language
        };
    }
}