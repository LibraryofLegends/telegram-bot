/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TMDBClient

Architecture Layer..: Infrastructure

Module..............: TMDB

Module ID...........: LOL-MOD-TMDB-0001

LOL-ID..............: LOL-TMDB-0001

File................: tmdb-client.ts

Location............
Library Of Legends/src/infrastructure/tmdb/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

The official TMDB integration layer for Library Of Legends.

Responsibilities:

- Search movies
- Search TV series
- Retrieve movie details
- Retrieve TV series details
- Retrieve movie credits
- Retrieve TV credits
- Retrieve poster URLs
- Retrieve backdrop URLs
- Retrieve genres
- Retrieve ratings
- Retrieve release dates
- Retrieve descriptions
- Support German metadata
- Support English fallback metadata
- Never crash the Telegram bot when TMDB is unavailable
- Provide clean normalized metadata
- Use TMDB API v3

Environment:

TMDB_API_KEY

Optional:

TMDB_LANGUAGE
TMDB_IMAGE_LANGUAGE

===============================================================================
*/

import https from "https";

/**
 * TMDB image base URL.
 */
const TMDB_IMAGE_BASE =
    "https://image.tmdb.org/t/p";

/**
 * Supported TMDB media types.
 */
export type TMDBMediaType =
    | "movie"
    | "tv";

/**
 * TMDB genre.
 */
export interface TMDBGenre {

    id: number;

    name: string;
}

/**
 * TMDB search result.
 */
export interface TMDBSearchResult {

    id: number;

    mediaType:
        TMDBMediaType;

    title: string;

    originalTitle?: string;

    overview?: string;

    releaseDate?: string;

    year?: number;

    posterPath?: string;

    backdropPath?: string;

    rating?: number;

    voteCount?: number;

    popularity?: number;

    genres?: TMDBGenre[];
}

/**
 * TMDB cast member.
 */
export interface TMDBCastMember {

    id: number;

    name: string;

    character?: string;

    profilePath?: string;
}

/**
 * TMDB crew member.
 */
export interface TMDBCrewMember {

    id: number;

    name: string;

    job?: string;

    department?: string;
}

/**
 * TMDB complete metadata.
 */
export interface TMDBMetadata {

    id: number;

    mediaType:
        TMDBMediaType;

    title: string;

    originalTitle?: string;

    overview?: string;

    tagline?: string;

    year?: number;

    releaseDate?: string;

    runtime?: number;

    posterPath?: string;

    posterUrl?: string;

    backdropPath?: string;

    backdropUrl?: string;

    rating?: number;

    voteCount?: number;

    popularity?: number;

    genres: TMDBGenre[];

    cast: TMDBCastMember[];

    crew: TMDBCrewMember[];

    director?: string;

    numberOfSeasons?: number;

    numberOfEpisodes?: number;

    status?: string;

    originalLanguage?: string;

    countries?: string[];
}

/**
 * TMDB API response wrapper.
 */
interface TMDBResponse<T> {

    results?: T[];

    page?: number;

    totalPages?: number;

    totalResults?: number;
}

/**
 * TMDB API client.
 */
export class TMDBClient {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    private static readonly API_BASE =
        "https://api.themoviedb.org/3";

    private static readonly API_KEY =
        process.env.TMDB_API_KEY || "";

    private static readonly LANGUAGE =
        process.env.TMDB_LANGUAGE ||
        "de-DE";

    private static readonly IMAGE_LANGUAGE =
        process.env.TMDB_IMAGE_LANGUAGE ||
        "de";

    // =========================================================================
    // REQUEST
    // =========================================================================

    private static async request<T>(
        endpoint: string,
        params:
            Record<string, string | number | undefined> = {}
    ): Promise<T | undefined> {

        if (
            !this.API_KEY
        ) {

            console.warn(
                "⚠️ TMDB_API_KEY nicht gesetzt."
            );

            return undefined;
        }

        const query =
            new URLSearchParams();

        query.set(
            "api_key",
            this.API_KEY
        );

        query.set(
            "language",
            this.LANGUAGE
        );

        for (
            const [
                key,
                value
            ] of Object.entries(
                params
            )
        ) {

            if (
                value === undefined
            ) {

                continue;
            }

            query.set(
                key,
                String(
                    value
                )
            );
        }

        const url =
            `${this.API_BASE}${endpoint}?${query.toString()}`;

        try {

            return await new Promise<T | undefined>(
                (
                    resolve
                ) => {

                    const request =
                        https.get(
                            url,
                            {
                                headers: {
                                    Accept:
                                        "application/json"
                                }
                            },
                            (
                                response
                            ) => {

                                let data =
                                    "";

                                response.on(
                                    "data",
                                    (
                                        chunk
                                    ) => {

                                        data +=
                                            chunk;
                                    }
                                );

                                response.on(
                                    "end",
                                    () => {

                                        const status =
                                            response.statusCode ||
                                            0;

                                        if (
                                            status < 200 ||
                                            status >= 300
                                        ) {

                                            console.error(
                                                `❌ TMDB HTTP ${status}`
                                            );

                                            resolve(
                                                undefined
                                            );

                                            return;
                                        }

                                        try {

                                            const parsed =
                                                JSON.parse(
                                                    data
                                                ) as T;

                                            resolve(
                                                parsed
                                            );

                                        } catch (
                                            error
                                        ) {

                                            console.error(
                                                "❌ TMDB JSON Fehler:",
                                                error
                                            );

                                            resolve(
                                                undefined
                                            );
                                        }
                                    }
                                );
                            }
                        );

                    request.setTimeout(
                        15000,
                        () => {

                            request.destroy();

                            console.error(
                                "❌ TMDB Timeout."
                            );

                            resolve(
                                undefined
                            );
                        }
                    );

                    request.on(
                        "error",
                        (
                            error
                        ) => {

                            console.error(
                                "❌ TMDB Request Fehler:",
                                error
                            );

                            resolve(
                                undefined
                            );
                        }
                    );
                }
            );

        } catch (
            error
        ) {

            console.error(
                "❌ TMDB Fehler:",
                error
            );

            return undefined;
        }
    }

    // =========================================================================
    // SEARCH MOVIES
    // =========================================================================

    public static async searchMovies(
        query: string,
        year?: number
    ): Promise<TMDBSearchResult[]> {

        const cleanQuery =
            String(
                query || ""
            ).trim();

        if (
            !cleanQuery
        ) {

            return [];
        }

        const response =
            await this.request<
                TMDBResponse<any>
            >(
                "/search/movie",
                {
                    query:
                        cleanQuery,

                    year
                }
            );

        if (
            !response ||
            !response.results
        ) {

            return [];
        }

        return response.results.map(
            item =>
                this.normalizeSearchResult(
                    item,
                    "movie"
                )
        );
    }

    // =========================================================================
    // SEARCH SERIES
    // =========================================================================

    public static async searchSeries(
        query: string,
        year?: number
    ): Promise<TMDBSearchResult[]> {

        const cleanQuery =
            String(
                query || ""
            ).trim();

        if (
            !cleanQuery
        ) {

            return [];
        }

        const response =
            await this.request<
                TMDBResponse<any>
            >(
                "/search/tv",
                {
                    query:
                        cleanQuery,

                    first_air_date_year:
                        year
                }
            );

        if (
            !response ||
            !response.results
        ) {

            return [];
        }

        return response.results.map(
            item =>
                this.normalizeSearchResult(
                    item,
                    "tv"
                )
        );
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static async search(
        query: string,
        type:
            TMDBMediaType = "movie",
        year?: number
    ): Promise<TMDBSearchResult[]> {

        if (
            type === "tv"
        ) {

            return this.searchSeries(
                query,
                year
            );
        }

        return this.searchMovies(
            query,
            year
        );
    }

    // =========================================================================
    // MOVIE DETAILS
    // =========================================================================

    public static async getMovie(
        id: number
    ): Promise<TMDBMetadata | undefined> {

        if (
            !Number.isInteger(
                id
            )
        ) {

            return undefined;
        }

        const response =
            await this.request<any>(
                `/movie/${id}`,
                {
                    append_to_response:
                        "credits"
                }
            );

        if (
            !response
        ) {

            return undefined;
        }

        return this.normalizeMetadata(
            response,
            "movie"
        );
    }

    // =========================================================================
    // SERIES DETAILS
    // =========================================================================

    public static async getSeries(
        id: number
    ): Promise<TMDBMetadata | undefined> {

        if (
            !Number.isInteger(
                id
            )
        ) {

            return undefined;
        }

        const response =
            await this.request<any>(
                `/tv/${id}`,
                {
                    append_to_response:
                        "credits"
                }
            );

        if (
            !response
        ) {

            return undefined;
        }

        return this.normalizeMetadata(
            response,
            "tv"
        );
    }

    // =========================================================================
    // GET DETAILS
    // =========================================================================

    public static async getDetails(
        id: number,
        type:
            TMDBMediaType
    ): Promise<TMDBMetadata | undefined> {

        if (
            type === "tv"
        ) {

            return this.getSeries(
                id
            );
        }

        return this.getMovie(
            id
        );
    }

    // =========================================================================
    // FIND BEST MOVIE MATCH
    // =========================================================================

    public static async findMovie(
        title: string,
        year?: number
    ): Promise<TMDBMetadata | undefined> {

        const results =
            await this.searchMovies(
                title,
                year
            );

        if (
            results.length === 0
        ) {

            return undefined;
        }

        /*
         * If a year was supplied, prefer a matching year.
         */

        if (
            year
        ) {

            const exactYear =
                results.find(
                    item =>
                        item.year ===
                        year
                );

            if (
                exactYear
            ) {

                return this.getMovie(
                    exactYear.id
                );
            }
        }

        return this.getMovie(
            results[0].id
        );
    }

    // =========================================================================
    // FIND BEST SERIES MATCH
    // =========================================================================

    public static async findSeries(
        title: string,
        year?: number
    ): Promise<TMDBMetadata | undefined> {

        const results =
            await this.searchSeries(
                title,
                year
            );

        if (
            results.length === 0
        ) {

            return undefined;
        }

        if (
            year
        ) {

            const exactYear =
                results.find(
                    item =>
                        item.year ===
                        year
                );

            if (
                exactYear
            ) {

                return this.getSeries(
                    exactYear.id
                );
            }
        }

        return this.getSeries(
            results[0].id
        );
    }

    // =========================================================================
    // FIND
    // =========================================================================

    public static async find(
        title: string,
        type:
            TMDBMediaType,
        year?: number
    ): Promise<TMDBMetadata | undefined> {

        if (
            type === "tv"
        ) {

            return this.findSeries(
                title,
                year
            );
        }

        return this.findMovie(
            title,
            year
        );
    }

    // =========================================================================
    // POSTER URL
    // =========================================================================

    public static getPosterUrl(
        path?: string,
        size:
            string = "w500"
    ): string | undefined {

        if (
            !path
        ) {

            return undefined;
        }

        return `${TMDB_IMAGE_BASE}/${size}${path}`;
    }

    // =========================================================================
    // BACKDROP URL
    // =========================================================================

    public static getBackdropUrl(
        path?: string,
        size:
            string = "w1280"
    ): string | undefined {

        if (
            !path
        ) {

            return undefined;
        }

        return `${TMDB_IMAGE_BASE}/${size}${path}`;
    }

    // =========================================================================
    // GET POSTER
    // =========================================================================

    public static async getPoster(
        id: number,
        type:
            TMDBMediaType
    ): Promise<string | undefined> {

        const metadata =
            await this.getDetails(
                id,
                type
            );

        return metadata?.posterUrl;
    }

    // =========================================================================
    // NORMALIZE SEARCH RESULT
    // =========================================================================

    private static normalizeSearchResult(
        item: any,
        mediaType:
            TMDBMediaType
    ): TMDBSearchResult {

        const title =
            item.title ||
            item.name ||
            item.original_title ||
            item.original_name ||
            "Unbekannter Titel";

        const originalTitle =
            item.original_title ||
            item.original_name;

        const releaseDate =
            item.release_date ||
            item.first_air_date;

        const year =
            this.extractYear(
                releaseDate
            );

        const posterPath =
            item.poster_path ||
            undefined;

        const backdropPath =
            item.backdrop_path ||
            undefined;

        return {

            id:
                Number(
                    item.id
                ),

            mediaType,

            title,

            originalTitle,

            overview:
                item.overview ||
                undefined,

            releaseDate,

            year,

            posterPath,

            backdropPath,

            rating:
                this.toNumber(
                    item.vote_average
                ),

            voteCount:
                this.toNumber(
                    item.vote_count
                ),

            popularity:
                this.toNumber(
                    item.popularity
                )
        };
    }

    // =========================================================================
    // NORMALIZE METADATA
    // =========================================================================

    private static normalizeMetadata(
        item: any,
        mediaType:
            TMDBMediaType
    ): TMDBMetadata {

        const title =
            item.title ||
            item.name ||
            item.original_title ||
            item.original_name ||
            "Unbekannter Titel";

        const originalTitle =
            item.original_title ||
            item.original_name;

        const releaseDate =
            item.release_date ||
            item.first_air_date;

        const genres:
            TMDBGenre[] =
            Array.isArray(
                item.genres
            )
                ? item.genres
                    .map(
                        (
                            genre: any
                        ) => ({

                            id:
                                Number(
                                    genre.id
                                ),

                            name:
                                String(
                                    genre.name ||
                                    ""
                                )
                        })
                    )
                    .filter(
                        genre =>
                            genre.name
                    )
                : [];

        const credits =
            item.credits ||
            {};

        const cast:
            TMDBCastMember[] =
            Array.isArray(
                credits.cast
            )
                ? credits.cast
                    .slice(
                        0,
                        20
                    )
                    .map(
                        (
                            person: any
                        ) => ({

                            id:
                                Number(
                                    person.id
                                ),

                            name:
                                String(
                                    person.name ||
                                    ""
                                ),

                            character:
                                person.character ||
                                undefined,

                            profilePath:
                                person.profile_path ||
                                undefined
                        })
                    )
                : [];

        const crew:
            TMDBCrewMember[] =
            Array.isArray(
                credits.crew
            )
                ? credits.crew
                    .map(
                        (
                            person: any
                        ) => ({

                            id:
                                Number(
                                    person.id
                                ),

                            name:
                                String(
                                    person.name ||
                                    ""
                                ),

                            job:
                                person.job ||
                                undefined,

                            department:
                                person.department ||
                                undefined
                        })
                    )
                : [];

        const director =
            crew.find(
                person =>
                    person.job ===
                    "Director"
            )?.name;

        const countries:
            string[] =
            Array.isArray(
                item.production_countries
            )
                ? item.production_countries
                    .map(
                        (
                            country: any
                        ) =>
                            String(
                                country.name ||
                                country.iso_3166_1 ||
                                ""
                            )
                    )
                    .filter(
                        Boolean
                    )
                : [];

        const posterPath =
            item.poster_path ||
            undefined;

        const backdropPath =
            item.backdrop_path ||
            undefined;

        return {

            id:
                Number(
                    item.id
                ),

            mediaType,

            title,

            originalTitle,

            overview:
                item.overview ||
                undefined,

            tagline:
                item.tagline ||
                undefined,

            year:
                this.extractYear(
                    releaseDate
                ),

            releaseDate,

            runtime:
                this.toNumber(
                    item.runtime
                ),

            posterPath,

            posterUrl:
                this.getPosterUrl(
                    posterPath
                ),

            backdropPath,

            backdropUrl:
                this.getBackdropUrl(
                    backdropPath
                ),

            rating:
                this.toNumber(
                    item.vote_average
                ),

            voteCount:
                this.toNumber(
                    item.vote_count
                ),

            popularity:
                this.toNumber(
                    item.popularity
                ),

            genres,

            cast,

            crew,

            director,

            numberOfSeasons:
                this.toNumber(
                    item.number_of_seasons
                ),

            numberOfEpisodes:
                this.toNumber(
                    item.number_of_episodes
                ),

            status:
                item.status ||
                undefined,

            originalLanguage:
                item.original_language ||
                undefined,

            countries
        };
    }

    // =========================================================================
    // EXTRACT YEAR
    // =========================================================================

    private static extractYear(
        date?: string
    ): number | undefined {

        if (
            !date
        ) {

            return undefined;
        }

        const match =
            String(
                date
            ).match(
                /^(19|20)\d{2}/
            );

        if (
            !match
        ) {

            return undefined;
        }

        const year =
            Number(
                match[0]
            );

        if (
            year < 1900 ||
            year > 2100
        ) {

            return undefined;
        }

        return year;
    }

    // =========================================================================
    // NUMBER
    // =========================================================================

    private static toNumber(
        value: unknown
    ): number | undefined {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return undefined;
        }

        const number =
            Number(
                value
            );

        if (
            !Number.isFinite(
                number
            )
        ) {

            return undefined;
        }

        return number;
    }

    // =========================================================================
    // IS CONFIGURED
    // =========================================================================

    public static isConfigured():
        boolean {

        return Boolean(
            this.API_KEY
        );
    }

    // =========================================================================
    // STATUS
    // =========================================================================

    public static getStatus():
        string {

        if (
            this.isConfigured()
        ) {

            return "TMDB API aktiv";
        }

        return "TMDB API Key fehlt";
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static async describe(
        title: string,
        type:
            TMDBMediaType = "movie",
        year?: number
    ): Promise<string> {

        const metadata =
            await this.find(
                title,
                type,
                year
            );

        if (
            !metadata
        ) {

            return [

                "=================================================",

                "🎞️ TMDB CLIENT",

                "=================================================",

                `🔎 Suche: ${title}`,

                `🎬 Typ: ${type}`,

                `📅 Jahr: ${
                    year ??
                    "—"
                }`,

                "❌ Kein TMDB-Ergebnis gefunden.",

                `⚙️ Status: ${
                    this.getStatus()
                }`,

                "================================================="

            ].join(
                "\n"
            );
        }

        return [

            "=================================================",

            "🎞️ TMDB CLIENT",

            "=================================================",

            `🆔 TMDB-ID: ${
                metadata.id
            }`,

            `🎬 Titel: ${
                metadata.title
            }`,

            `📅 Jahr: ${
                metadata.year ??
                "—"
            }`,

            `⭐ Bewertung: ${
                metadata.rating ??
                "—"
            }`,

            `🎭 Genres: ${
                metadata.genres
                    .map(
                        genre =>
                            genre.name
                    )
                    .join(
                        ", "
                    ) ||
                "—"
            }`,

            `🎬 Regie: ${
                metadata.director ??
                "—"
            }`,

            `⏱ Laufzeit: ${
                metadata.runtime
                    ? `${metadata.runtime} Min.`
                    : "—"
            }`,

            `🖼 Poster: ${
                metadata.posterUrl ??
                "—"
            }`,

            `🌍 Länder: ${
                metadata.countries?.join(
                    ", "
                ) ||
                "—"
            }`,

            `⚙️ Status: ${
                this.getStatus()
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}