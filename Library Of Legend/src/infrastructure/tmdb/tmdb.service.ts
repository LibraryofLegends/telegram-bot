/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TmdbService

Architecture Layer..: Infrastructure

Module..............: External API

Module ID...........: LOL-MOD-INFRA-TMDB-0001

LOL-ID..............: LOL-TMDB-CORE-0001

File................: tmdb.service.ts

Location............
Library Of Legend/src/infrastructure/tmdb/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central TMDB integration service for Library Of Legends.

Responsibilities:

- Search movies
- Match movie titles
- Support release year matching
- Support TMDB API v3 API keys
- Support TMDB API Read Access Tokens
- Retrieve detailed movie metadata
- Retrieve ratings
- Retrieve genres
- Retrieve descriptions
- Retrieve poster URLs
- Retrieve backdrop URLs
- Use German metadata where available
- Retry a movie search without year
- Never crash the Telegram application because TMDB is unavailable

Authentication:

Supported environment variable:

TMDB_KEY

TMDB_KEY may contain either:

1. TMDB API v3 key
2. TMDB API Read Access Token

The service automatically selects the correct authentication method.

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface TmdbMovieResult {

    id:
        number;

    title:
        string;

    originalTitle:
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

interface TmdbSearchResponse {

    page?:
        number;

    results?:
        TmdbSearchItem[];

    total_pages?:
        number;

    total_results?:
        number;
}

interface TmdbSearchItem {

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

interface TmdbGenreItem {

    id?:
        number;

    name?:
        string;
}

interface TmdbMovieDetails {

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
        TmdbGenreItem[];

    poster_path?:
        string | null;

    backdrop_path?:
        string | null;
}

// =============================================================================
// TMDB SERVICE
// =============================================================================

export class TmdbService {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    private readonly apiKey:
        string;

    private readonly baseUrl =
        "https://api.themoviedb.org/3";

    private readonly imageBase =
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
            )
                .trim();

        if (
            !key
        ) {

            throw new Error(
                "❌ TMDB_KEY fehlt in ENV!"
            );
        }

        this.apiKey =
            key;

        console.log(
            "🎬 TMDB Service initialisiert."
        );

        console.log(
            `🔐 TMDB Authentifizierung: ${
                this.detectAuthType()
            }`
        );
    }

    // =========================================================================
    // AUTH TYPE
    // =========================================================================

    private detectAuthType():
        "API_KEY" |
        "ACCESS_TOKEN" {

        /*
         * TMDB API v3 keys are commonly short alphanumeric values.
         *
         * Read Access Tokens are much longer and are sent as
         * Authorization: Bearer <token>.
         *
         * We intentionally support both.
         */

        if (
            this.apiKey.length >
            80
        ) {

            return "ACCESS_TOKEN";
        }

        return "API_KEY";
    }

    // =========================================================================
    // REQUEST
    // =========================================================================

    private async request<T>(
        endpoint: string,
        parameters:
            Record<
                string,
                string |
                number |
                boolean |
                undefined
            > = {}
    ): Promise<T | null> {

        try {

            const url =
                new URL(
                    `${this.baseUrl}${endpoint}`
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
                    parameters
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

            const headers:
                Record<
                    string,
                    string
                > = {

                Accept:
                    "application/json"
            };

            // =================================================================
            // ACCESS TOKEN
            // =================================================================

            if (
                this.detectAuthType() ===
                "ACCESS_TOKEN"
            ) {

                headers.Authorization =
                    `Bearer ${this.apiKey}`;

            } else {

                // =============================================================
                // V3 API KEY
                // =============================================================

                url.searchParams.set(
                    "api_key",
                    this.apiKey
                );
            }

            const response =
                await fetch(
                    url.toString(),
                    {
                        method:
                            "GET",

                        headers
                    }
                );

            if (
                !response.ok
            ) {

                const body =
                    await response
                        .text();

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

            const data =
                await response.json() as T;

            return data;

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
    // SEARCH MOVIE
    // =========================================================================

    public async searchMovie(
        title: string,
        year?: number
    ): Promise<TmdbMovieResult | null> {

        const cleanTitle =
            this.cleanTitle(
                title
            );

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

        // =====================================================================
        // FIRST SEARCH
        // =====================================================================

        const firstResponse =
            await this.request<TmdbSearchResponse>(
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

        const firstResults =
            firstResponse?.results ||
            [];

        let bestMatch =
            this.findBestMatch(
                firstResults,
                cleanTitle,
                year
            );

        // =====================================================================
        // FALLBACK WITHOUT YEAR
        // =====================================================================

        if (
            !bestMatch &&
            year !==
                undefined
        ) {

            console.log(
                "🔄 Kein exakter Treffer mit Jahr – zweite TMDB-Suche ohne Jahr."
            );

            const fallbackResponse =
                await this.request<TmdbSearchResponse>(
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

            const fallbackResults =
                fallbackResponse?.results ||
                [];

            bestMatch =
                this.findBestMatch(
                    fallbackResults,
                    cleanTitle,
                    year
                );
        }

        if (
            !bestMatch
        ) {

            console.log(
                `⚠️ Kein TMDB Treffer für: ${cleanTitle}`
            );

            return null;
        }

        console.log(
            `✅ TMDB Treffer: ${
                bestMatch.title ||
                bestMatch.original_title ||
                cleanTitle
            } (#${bestMatch.id})`
        );

        return this.getMovieDetails(
            bestMatch.id
        );
    }

    // =========================================================================
    // FIND BEST MATCH
    // =========================================================================

    private findBestMatch(
        results: TmdbSearchItem[],
        title: string,
        year?: number
    ): TmdbSearchItem | undefined {

        if (
            results.length ===
            0
        ) {

            return undefined;
        }

        const normalizedTitle =
            this.normalizeForComparison(
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
                    item => {

                        const itemTitle =
                            this.normalizeForComparison(
                                item.title ||
                                item.original_title ||
                                ""
                            );

                        const itemYear =
                            this.extractYear(
                                item.release_date
                            );

                        return (
                            itemTitle ===
                                normalizedTitle &&
                            itemYear ===
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
                item => {

                    const itemTitle =
                        this.normalizeForComparison(
                            item.title ||
                            item.original_title ||
                            ""
                        );

                    return (
                        itemTitle ===
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
                    item =>
                        this.extractYear(
                            item.release_date
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
    // GET MOVIE DETAILS
    // =========================================================================

    private async getMovieDetails(
        id: number
    ): Promise<TmdbMovieResult | null> {

        const movie =
            await this.request<TmdbMovieDetails>(
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
                String(
                    movie.original_title ||
                    movie.title ||
                    "Unbekannter Titel"
                ),

            year:
                this.extractYear(
                    movie.release_date
                ),

            overview:
                movie.overview ||
                undefined,

            rating:
                this.toNumber(
                    movie.vote_average
                ),

            genres:
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
                    : [],

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
    // BUILD IMAGE URL
    // =========================================================================

    private buildImageUrl(
        path: string,
        size: string
    ): string {

        return `${this.imageBase}/${size}${path}`;
    }

    // =========================================================================
    // CLEAN TITLE
    // =========================================================================

    private cleanTitle(
        title: string
    ): string {

        return String(
            title ||
            ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    // =========================================================================
    // NORMALIZE TITLE FOR COMPARISON
    // =========================================================================

    private normalizeForComparison(
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
            );
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

    // =========================================================================
    // STATUS
    // =========================================================================

    public getStatus():
        string {

        return [
            "TMDB Service",
            `Auth: ${this.detectAuthType()}`,
            `Language: ${this.language}`,
            "API: v3"
        ].join(
            " | "
        );
    }
}