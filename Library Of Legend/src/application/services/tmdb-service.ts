/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TMDBService

Architecture Layer..: Application

Module..............: Services

Module ID...........: LOL-MOD-APP-TMDB-0001

LOL-ID..............: LOL-TMDB-SERVICE-0001

File................: tmdb-service.ts

Location............
Library Of Legend/src/application/services/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Application-level TMDB service used by the Telegram media pipeline.

Responsibilities:

- Search movies
- Match title and year
- Retrieve movie details
- Retrieve rating
- Retrieve genres
- Retrieve overview
- Retrieve poster URL
- Retrieve backdrop URL
- Use TMDB_KEY
- Return normalized movie metadata
- Fail safely when TMDB is unavailable

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface TMDBMovie {

    id:
        number;

    title:
        string;

    originalTitle?:
        string;

    year?:
        number;

    overview?:
        string;

    rating?:
        number;

    genres:
        string[];

    posterUrl?:
        string;

    backdropUrl?:
        string;
}

// =============================================================================
// RAW TMDB TYPES
// =============================================================================

interface TMDBSearchResponse {

    results?:
        TMDBSearchMovie[];
}

interface TMDBSearchMovie {

    id:
        number;

    title?:
        string;

    original_title?:
        string;

    release_date?:
        string;

    overview?:
        string;

    vote_average?:
        number;

    poster_path?:
        string | null;

    backdrop_path?:
        string | null;
}

interface TMDBMovieDetails {

    id:
        number;

    title?:
        string;

    original_title?:
        string;

    release_date?:
        string;

    overview?:
        string;

    vote_average?:
        number;

    genres?:
        TMDBGenre[];

    poster_path?:
        string | null;

    backdrop_path?:
        string | null;
}

interface TMDBGenre {

    id?:
        number;

    name?:
        string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class TMDBService {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    private readonly apiKey:
        string;

    private readonly baseUrl =
        "https://api.themoviedb.org/3";

    private readonly imageBaseUrl =
        "https://image.tmdb.org/t/p";

    private readonly language =
        "de-DE";

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor() {

        const key =
            String(
                process.env.TMDB_KEY ||
                ""
            ).trim();

        if (
            !key
        ) {

            throw new Error(
                "❌ TMDB_KEY fehlt in ENV."
            );
        }

        this.apiKey =
            key;

        console.log(
            "🎬 TMDB Service initialisiert."
        );
    }

    // =========================================================================
    // SEARCH MOVIE
    // =========================================================================

    public async searchMovie(
        title: string,
        year?: number
    ): Promise<TMDBMovie | null> {

        const cleanTitle =
            String(
                title ||
                ""
            )
                .trim();

        if (
            !cleanTitle
        ) {

            return null;
        }

        console.log(
            `🔎 TMDB Suche: "${cleanTitle}"${
                year
                    ? ` (${year})`
                    : ""
            }`
        );

        try {

            // =================================================================
            // FIRST SEARCH
            // =================================================================

            const response =
                await this.request<TMDBSearchResponse>(
                    "/search/movie",
                    {
                        query:
                            cleanTitle,

                        year,

                        region:
                            "DE",

                        include_adult:
                            false
                    }
                );

            let results =
                response?.results ||
                [];

            // =================================================================
            // FALLBACK WITHOUT YEAR
            // =================================================================

            if (
                results.length ===
                    0 &&
                year !==
                    undefined
            ) {

                console.log(
                    "🔄 TMDB zweite Suche ohne Jahr."
                );

                const fallback =
                    await this.request<TMDBSearchResponse>(
                        "/search/movie",
                        {
                            query:
                                cleanTitle,

                            region:
                                "DE",

                            include_adult:
                                false
                        }
                    );

                results =
                    fallback?.results ||
                    [];
            }

            if (
                results.length ===
                0
            ) {

                console.log(
                    `⚠️ Kein TMDB Treffer für: ${cleanTitle}`
                );

                return null;
            }

            // =================================================================
            // BEST RESULT
            // =================================================================

            const best =
                this.findBestResult(
                    results,
                    cleanTitle,
                    year
                );

            if (
                !best
            ) {

                return null;
            }

            console.log(
                `✅ TMDB Treffer: ${
                    best.title ||
                    best.original_title ||
                    cleanTitle
                } (#${best.id})`
            );

            // =================================================================
            // DETAILS
            // =================================================================

            return await this.getMovieDetails(
                best.id
            );

        } catch (
            error
        ) {

            console.error(
                "❌ TMDB Movie Fehler:",
                error
            );

            return null;
        }
    }

    // =========================================================================
    // GET MOVIE DETAILS
    // =========================================================================

    private async getMovieDetails(
        id: number
    ): Promise<TMDBMovie | null> {

        const movie =
            await this.request<TMDBMovieDetails>(
                `/movie/${id}`,
                {
                    append_to_response:
                        "credits",

                    include_image_language:
                        "de,en,null"
                }
            );

        if (
            !movie
        ) {

            return null;
        }

        const year =
            this.extractYear(
                movie.release_date
            );

        const genres =
            Array.isArray(
                movie.genres
            )
                ? movie.genres
                    .map(
                        genre =>
                            String(
                                genre.name ||
                                ""
                            )
                    )
                    .filter(
                        Boolean
                    )
                : [];

        return {

            id:
                Number(
                    movie.id
                ),

            title:
                String(
                    movie.title ||
                    "Unbekannter Titel"
                ),

            originalTitle:
                movie.original_title ||
                undefined,

            year,

            overview:
                movie.overview ||
                undefined,

            rating:
                this.toNumber(
                    movie.vote_average
                ),

            genres,

            posterUrl:
                movie.poster_path
                    ? this.buildImageUrl(
                        movie.poster_path,
                        "w500"
                    )
                    : undefined,

            backdropUrl:
                movie.backdrop_path
                    ? this.buildImageUrl(
                        movie.backdrop_path,
                        "w1280"
                    )
                    : undefined
        };
    }

    // =========================================================================
    // FIND BEST RESULT
    // =========================================================================

    private findBestResult(
        results: TMDBSearchMovie[],
        title: string,
        year?: number
    ): TMDBSearchMovie | undefined {

        const normalizedTitle =
            this.normalizeTitle(
                title
            );

        // =====================================================================
        // EXACT TITLE + YEAR
        // =====================================================================

        if (
            year !==
            undefined
        ) {

            const exact =
                results.find(
                    result => {

                        const resultTitle =
                            this.normalizeTitle(
                                result.title ||
                                result.original_title ||
                                ""
                            );

                        const resultYear =
                            this.extractYear(
                                result.release_date
                            );

                        return (
                            resultTitle ===
                                normalizedTitle &&
                            resultYear ===
                                year
                        );
                    }
                );

            if (
                exact
            ) {

                return exact;
            }
        }

        // =====================================================================
        // EXACT TITLE
        // =====================================================================

        const exactTitle =
            results.find(
                result => {

                    const resultTitle =
                        this.normalizeTitle(
                            result.title ||
                            result.original_title ||
                            ""
                        );

                    return (
                        resultTitle ===
                        normalizedTitle
                    );
                }
            );

        if (
            exactTitle
        ) {

            return exactTitle;
        }

        // =====================================================================
        // YEAR MATCH
        // =====================================================================

        if (
            year !==
            undefined
        ) {

            const yearMatch =
                results.find(
                    result =>
                        this.extractYear(
                            result.release_date
                        ) ===
                        year
                );

            if (
                yearMatch
            ) {

                return yearMatch;
            }
        }

        // =====================================================================
        // FIRST RESULT
        // =====================================================================

        return results[0];
    }

    // =========================================================================
    // REQUEST
    // =========================================================================

    private async request<T>(
        endpoint: string,
        params:
            Record<
                string,
                string |
                number |
                boolean |
                undefined
            >
    ): Promise<T | null> {

        try {

            const url =
                new URL(
                    `${this.baseUrl}${endpoint}`
                );

            url.searchParams.set(
                "api_key",
                this.apiKey
            );

            url.searchParams.set(
                "language",
                this.language
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
                    value ===
                    undefined
                ) {

                    continue;
                }

                url.searchParams.set(
                    key,
                    String(
                        value
                    )
                );
            }

            const response =
                await fetch(
                    url.toString(),
                    {
                        method:
                            "GET",

                        headers: {
                            Accept:
                                "application/json"
                        }
                    }
                );

            if (
                !response.ok
            ) {

                const body =
                    await response.text();

                console.error(
                    `❌ TMDB HTTP ${response.status}`
                );

                console.error(
                    `❌ TMDB Antwort: ${body.slice(
                        0,
                        500
                    )}`
                );

                return null;
            }

            return await response.json() as T;

        } catch (
            error
        ) {

            console.error(
                "❌ TMDB Request Fehler:",
                error
            );

            return null;
        }
    }

    // =========================================================================
    // IMAGE URL
    // =========================================================================

    private buildImageUrl(
        path: string,
        size: string
    ): string {

        return (
            `${this.imageBaseUrl}/${size}${path}`
        );
    }

    // =========================================================================
    // NORMALIZE TITLE
    // =========================================================================

    private normalizeTitle(
        value: string
    ): string {

        return String(
            value ||
            ""
        )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                ""
            )
            .trim();
    }

    // =========================================================================
    // EXTRACT YEAR
    // =========================================================================

    private extractYear(
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

        return Number(
            match[0]
        );
    }

    // =========================================================================
    // NUMBER
    // =========================================================================

    private toNumber(
        value: unknown
    ): number | undefined {

        if (
            value ===
                undefined ||
            value ===
                null ||
            value ===
                ""
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
}