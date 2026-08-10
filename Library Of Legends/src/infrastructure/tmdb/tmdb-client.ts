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

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

TMDB integration for Library Of Legends.

Responsibilities:

- Search movies
- Search TV series
- Retrieve movie details
- Retrieve TV series details
- Retrieve episode details
- Retrieve ratings
- Retrieve overview
- Retrieve release information
- Retrieve country information
- Retrieve runtime
- Retrieve genres
- Retrieve directors
- Retrieve cast
- Work safely without a TMDB API key
- Never crash the Telegram bot because TMDB is unavailable
- Provide normalized metadata to the Catalog layer

Environment variable:

TMDB_API_KEY

===============================================================================
*/

import https from "https";

/**
 * Generic TMDB response.
 */
interface TMDBResponse<T> {

    page?: number;

    results?: T[];

    total_pages?: number;

    total_results?: number;
}

/**
 * TMDB movie result.
 */
export interface TMDBMovieResult {

    id: number;

    title?: string;

    original_title?: string;

    overview?: string;

    release_date?: string;

    vote_average?: number;

    vote_count?: number;

    genre_ids?: number[];

    original_language?: string;

    popularity?: number;

    poster_path?: string | null;

    backdrop_path?: string | null;
}

/**
 * TMDB series result.
 */
export interface TMDBSeriesResult {

    id: number;

    name?: string;

    original_name?: string;

    overview?: string;

    first_air_date?: string;

    vote_average?: number;

    vote_count?: number;

    genre_ids?: number[];

    original_language?: string;

    popularity?: number;

    poster_path?: string | null;

    backdrop_path?: string | null;
}

/**
 * TMDB movie details.
 */
export interface TMDBMovieDetails
    extends TMDBMovieResult {

    runtime?: number | null;

    genres?: TMDBGenre[];

    production_countries?: TMDBCountry[];

    credits?: TMDBCredits;
}

/**
 * TMDB series details.
 */
export interface TMDBSeriesDetails
    extends TMDBSeriesResult {

    episode_run_time?: number[];

    genres?: TMDBGenre[];

    origin_country?: string[];

    number_of_seasons?: number;

    number_of_episodes?: number;

    credits?: TMDBCredits;
}

/**
 * TMDB episode details.
 */
export interface TMDBEpisodeDetails {

    id: number;

    name?: string;

    overview?: string;

    air_date?: string;

    episode_number?: number;

    season_number?: number;

    vote_average?: number;

    still_path?: string | null;

    runtime?: number | null;

    crew?: TMDBCrewMember[];

    guest_stars?: TMDBCastMember[];
}

/**
 * TMDB genre.
 */
export interface TMDBGenre {

    id: number;

    name: string;
}

/**
 * TMDB country.
 */
export interface TMDBCountry {

    iso_3166_1?: string;

    name?: string;
}

/**
 * TMDB cast member.
 */
export interface TMDBCastMember {

    id: number;

    name?: string;

    character?: string;

    order?: number;
}

/**
 * TMDB crew member.
 */
export interface TMDBCrewMember {

    id: number;

    name?: string;

    job?: string;

    department?: string;
}

/**
 * TMDB credits.
 */
export interface TMDBCredits {

    cast?: TMDBCastMember[];

    crew?: TMDBCrewMember[];
}

/**
 * Normalized metadata used by Library Of Legends.
 */
export interface TMDBMetadata {

    id?: number;

    title?: string;

    originalTitle?: string;

    overview?: string;

    year?: number;

    rating?: number;

    originalLanguage?: string;

    genres?: string[];

    country?: string;

    runtime?: number;

    director?: string;

    cast?: string;

    posterUrl?: string;

    backdropUrl?: string;
}

/**
 * TMDB Client
 */
export class TMDBClient {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    private static readonly API_KEY =
        process.env.TMDB_API_KEY || "";

    private static readonly BASE_URL =
        "https://api.themoviedb.org/3";

    private static readonly IMAGE_BASE_URL =
        "https://image.tmdb.org/t/p/original";

    // =========================================================================
    // LANGUAGE
    // =========================================================================

    private static readonly LANGUAGE =
        "de-DE";

    // =========================================================================
    // SEARCH MOVIE
    // =========================================================================

    public static async searchMovie(
        title: string,
        year?: number
    ): Promise<TMDBMovieResult[]> {

        if (
            !this.isAvailable()
        ) {

            console.log(
                "⚠️ TMDB API-Key nicht vorhanden."
            );

            return [];
        }

        const params =
            new URLSearchParams({

                api_key:
                    this.API_KEY,

                language:
                    this.LANGUAGE,

                query:
                    title,

                include_adult:
                    "false"

            });

        if (
            year
        ) {

            params.set(
                "year",
                String(year)
            );
        }

        try {

            const response =
                await this.request<
                    TMDBResponse<TMDBMovieResult>
                >(
                    `/search/movie?${params.toString()}`
                );

            return response.results || [];

        } catch (error) {

            console.error(
                "❌ TMDB Movie Search Fehler:",
                error
            );

            return [];
        }
    }

    // =========================================================================
    // SEARCH SERIES
    // =========================================================================

    public static async searchSeries(
        title: string,
        year?: number
    ): Promise<TMDBSeriesResult[]> {

        if (
            !this.isAvailable()
        ) {

            console.log(
                "⚠️ TMDB API-Key nicht vorhanden."
            );

            return [];
        }

        const params =
            new URLSearchParams({

                api_key:
                    this.API_KEY,

                language:
                    this.LANGUAGE,

                query:
                    title,

                include_adult:
                    "false"

            });

        if (
            year
        ) {

            params.set(
                "first_air_date_year",
                String(year)
            );
        }

        try {

            const response =
                await this.request<
                    TMDBResponse<TMDBSeriesResult>
                >(
                    `/search/tv?${params.toString()}`
                );

            return response.results || [];

        } catch (error) {

            console.error(
                "❌ TMDB Series Search Fehler:",
                error
            );

            return [];
        }
    }

    // =========================================================================
    // GET MOVIE
    // =========================================================================

    public static async getMovie(
        id: number
    ): Promise<TMDBMovieDetails | null> {

        if (
            !this.isAvailable()
        ) {

            return null;
        }

        const params =
            new URLSearchParams({

                api_key:
                    this.API_KEY,

                language:
                    this.LANGUAGE,

                append_to_response:
                    "credits"

            });

        try {

            return await this.request<TMDBMovieDetails>(
                `/movie/${id}?${params.toString()}`
            );

        } catch (error) {

            console.error(
                `❌ TMDB Movie ${id} Fehler:`,
                error
            );

            return null;
        }
    }

    // =========================================================================
    // GET SERIES
    // =========================================================================

    public static async getSeries(
        id: number
    ): Promise<TMDBSeriesDetails | null> {

        if (
            !this.isAvailable()
        ) {

            return null;
        }

        const params =
            new URLSearchParams({

                api_key:
                    this.API_KEY,

                language:
                    this.LANGUAGE,

                append_to_response:
                    "credits"

            });

        try {

            return await this.request<TMDBSeriesDetails>(
                `/tv/${id}?${params.toString()}`
            );

        } catch (error) {

            console.error(
                `❌ TMDB Series ${id} Fehler:`,
                error
            );

            return null;
        }
    }

    // =========================================================================
    // GET EPISODE
    // =========================================================================

    public static async getEpisode(
        seriesId: number,
        season: number,
        episode: number
    ): Promise<TMDBEpisodeDetails | null> {

        if (
            !this.isAvailable()
        ) {

            return null;
        }

        const params =
            new URLSearchParams({

                api_key:
                    this.API_KEY,

                language:
                    this.LANGUAGE

            });

        try {

            return await this.request<TMDBEpisodeDetails>(
                `/tv/${seriesId}/season/${season}/episode/${episode}?${params.toString()}`
            );

        } catch (error) {

            console.error(
                "❌ TMDB Episode Fehler:",
                error
            );

            return null;
        }
    }

    // =========================================================================
    // FIND BEST MOVIE
    // =========================================================================

    public static async findBestMovie(
        title: string,
        year?: number
    ): Promise<TMDBMovieDetails | null> {

        const results =
            await this.searchMovie(
                title,
                year
            );

        if (
            results.length === 0
        ) {

            return null;
        }

        /*
         * Prefer exact title matches.
         */

        const normalizedTitle =
            this.normalizeTitle(
                title
            );

        const exact =
            results.find(
                result =>
                    this.normalizeTitle(
                        result.title ||
                        ""
                    ) === normalizedTitle
            );

        const selected =
            exact ||
            results[0];

        return this.getMovie(
            selected.id
        );
    }

    // =========================================================================
    // FIND BEST SERIES
    // =========================================================================

    public static async findBestSeries(
        title: string,
        year?: number
    ): Promise<TMDBSeriesDetails | null> {

        const results =
            await this.searchSeries(
                title,
                year
            );

        if (
            results.length === 0
        ) {

            return null;
        }

        const normalizedTitle =
            this.normalizeTitle(
                title
            );

        const exact =
            results.find(
                result =>
                    this.normalizeTitle(
                        result.name ||
                        ""
                    ) === normalizedTitle
            );

        const selected =
            exact ||
            results[0];

        return this.getSeries(
            selected.id
        );
    }

    // =========================================================================
    // GET MOVIE METADATA
    // =========================================================================

    public static async getMovieMetadata(
        title: string,
        year?: number
    ): Promise<TMDBMetadata | null> {

        const movie =
            await this.findBestMovie(
                title,
                year
            );

        if (
            !movie
        ) {

            return null;
        }

        return this.normalizeMovie(
            movie
        );
    }

    // =========================================================================
    // GET SERIES METADATA
    // =========================================================================

    public static async getSeriesMetadata(
        title: string,
        year?: number
    ): Promise<TMDBMetadata | null> {

        const series =
            await this.findBestSeries(
                title,
                year
            );

        if (
            !series
        ) {

            return null;
        }

        return this.normalizeSeries(
            series
        );
    }

    // =========================================================================
    // NORMALIZE MOVIE
    // =========================================================================

    public static normalizeMovie(
        movie: TMDBMovieDetails
    ): TMDBMetadata {

        const director =
            movie.credits?.crew
                ?.find(
                    person =>
                        String(
                            person.job ||
                            ""
                        ).toLowerCase() ===
                        "director"
                )
                ?.name;

        const cast =
            movie.credits?.cast
                ?.slice(
                    0,
                    10
                )
                .map(
                    person =>
                        person.name
                )
                .filter(
                    Boolean
                )
                .join(
                    ", "
                );

        return {

            id:
                movie.id,

            title:
                movie.title,

            originalTitle:
                movie.original_title,

            overview:
                movie.overview,

            year:
                this.extractYear(
                    movie.release_date
                ),

            rating:
                movie.vote_average,

            originalLanguage:
                movie.original_language,

            genres:
                movie.genres
                    ?.map(
                        genre =>
                            genre.name
                    ),

            country:
                movie.production_countries
                    ?.map(
                        country =>
                            country.name
                    )
                    .filter(
                        Boolean
                    )
                    .join(
                        ", "
                    ),

            runtime:
                movie.runtime ||
                undefined,

            director,

            cast,

            posterUrl:
                this.buildImageUrl(
                    movie.poster_path
                ),

            backdropUrl:
                this.buildImageUrl(
                    movie.backdrop_path
                )
        };
    }

    // =========================================================================
    // NORMALIZE SERIES
    // =========================================================================

    public static normalizeSeries(
        series: TMDBSeriesDetails
    ): TMDBMetadata {

        const director =
            series.credits?.crew
                ?.find(
                    person =>
                        String(
                            person.job ||
                            ""
                        ).toLowerCase() ===
                        "director"
                )
                ?.name;

        const cast =
            series.credits?.cast
                ?.slice(
                    0,
                    10
                )
                .map(
                    person =>
                        person.name
                )
                .filter(
                    Boolean
                )
                .join(
                    ", "
                );

        return {

            id:
                series.id,

            title:
                series.name,

            originalTitle:
                series.original_name,

            overview:
                series.overview,

            year:
                this.extractYear(
                    series.first_air_date
                ),

            rating:
                series.vote_average,

            originalLanguage:
                series.original_language,

            genres:
                series.genres
                    ?.map(
                        genre =>
                            genre.name
                    ),

            country:
                series.origin_country
                    ?.join(
                        ", "
                    ),

            runtime:
                series.episode_run_time
                    ?.at(0),

            director,

            cast,

            posterUrl:
                this.buildImageUrl(
                    series.poster_path
                ),

            backdropUrl:
                this.buildImageUrl(
                    series.backdrop_path
                )
        };
    }

    // =========================================================================
    // IMAGE URL
    // =========================================================================

    public static buildImageUrl(
        path?: string | null
    ): string | undefined {

        if (
            !path
        ) {

            return undefined;
        }

        return `${this.IMAGE_BASE_URL}${path}`;
    }

    // =========================================================================
    // EXTRACT YEAR
    // =========================================================================

    public static extractYear(
        date?: string
    ): number | undefined {

        if (
            !date
        ) {

            return undefined;
        }

        const match =
            date.match(
                /^(\d{4})/
            );

        if (
            !match
        ) {

            return undefined;
        }

        const year =
            Number(
                match[1]
            );

        return Number.isFinite(
            year
        )
            ? year
            : undefined;
    }

    // =========================================================================
    // NORMALIZE TITLE
    // =========================================================================

    private static normalizeTitle(
        title: string
    ): string {

        return String(
            title || ""
        )
            .toLowerCase()
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-z0-9]+/g,
                " "
            )
            .trim();
    }

    // =========================================================================
    // API AVAILABLE
    // =========================================================================

    public static isAvailable(): boolean {

        return (
            this.API_KEY.length > 0
        );
    }

    // =========================================================================
    // RAW REQUEST
    // =========================================================================

    private static request<T>(
        path: string
    ): Promise<T> {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const request =
                    https.get(
                        `${this.BASE_URL}${path}`,

                        {
                            headers: {
                                Accept:
                                    "application/json"
                            }
                        },

                        response => {

                            let data =
                                "";

                            response.on(
                                "data",
                                chunk => {

                                    data +=
                                        chunk;
                                }
                            );

                            response.on(
                                "end",
                                () => {

                                    const status =
                                        response.statusCode ||
                                        500;

                                    if (
                                        status < 200 ||
                                        status >= 300
                                    ) {

                                        reject(
                                            new Error(
                                                `TMDB HTTP ${status}: ${data.slice(0, 300)}`
                                            )
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

                                        reject(
                                            new Error(
                                                "TMDB lieferte ungültiges JSON."
                                            )
                                        );
                                    }
                                }
                            );
                        }
                    );

                request.on(
                    "error",
                    error => {

                        reject(
                            error
                        );
                    }
                );

                request.setTimeout(
                    15000,
                    () => {

                        request.destroy();

                        reject(
                            new Error(
                                "TMDB Anfrage Timeout."
                            )
                        );
                    }
                );
            }
        );
    }
}