/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TMDB Service

Architecture Layer..: Infrastructure

Module..............: External API

Module ID...........: LOL-MOD-INFRA-TMDB-0001

LOL-ID..............: LOL-TMDB-CORE-0001

File................: tmdb.service.ts

Location............
Library Of Legend/src/infrastructure/tmdb/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Handles all communication with The Movie Database (TMDB).

Responsibilities:

- Search movie by title + optional year
- Fetch detailed movie information
- Normalize TMDB response into internal structure
- Provide safe fallback if nothing found

Important:

- Uses native fetch (Node 18+)
- Requires TMDB_KEY from environment
- No Telegram logic here (strict separation)

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
// SERVICE
// =============================================================================

export class TmdbService {

    // =========================================================================
    // CONFIG
    // =========================================================================

    private readonly apiKey:
        string;

    private readonly baseUrl =
        "https://api.themoviedb.org/3";

    private readonly imageBase =
        "https://image.tmdb.org/t/p";

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    public constructor() {

        const key =
            process.env.TMDB_KEY;

        if (!key) {

            throw new Error(
                "❌ TMDB_KEY fehlt in ENV!"
            );
        }

        this.apiKey = key;

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
    ): Promise<TmdbMovieResult | null> {

        try {

            const url =
                `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ""}`;

            const response =
                await fetch(url);

            if (!response.ok) {

                throw new Error(
                    `TMDB Fehler: ${response.status}`
                );
            }

            const data =
                await response.json();

            if (
                !data.results ||
                data.results.length === 0
            ) {

                console.log(
                    `⚠️ Kein TMDB Treffer für: ${title}`
                );

                return null;
            }

            // =================================================================
            // BEST MATCH
            // =================================================================

            const movie =
                data.results[0];

            // =================================================================
            // DETAILS NACHLADEN
            // =================================================================

            return await this.getMovieDetails(
                movie.id
            );

        } catch (error) {

            console.error(
                "❌ TMDB Search Fehler:",
                error
            );

            return null;
        }
    }

    // =========================================================================
    // GET DETAILS
    // =========================================================================

    private async getMovieDetails(
        id: number
    ): Promise<TmdbMovieResult | null> {

        try {

            const url =
                `${this.baseUrl}/movie/${id}?api_key=${this.apiKey}&language=de-DE`;

            const response =
                await fetch(url);

            if (!response.ok) {

                throw new Error(
                    `TMDB Detail Fehler: ${response.status}`
                );
            }

            const movie =
                await response.json();

            // =================================================================
            // NORMALIZE
            // =================================================================

            return {

                id:
                    movie.id,

                title:
                    movie.title,

                originalTitle:
                    movie.original_title,

                year:
                    movie.release_date
                        ? Number(
                            movie.release_date.split("-")[0]
                        )
                        : undefined,

                overview:
                    movie.overview,

                rating:
                    movie.vote_average,

                genres:
                    Array.isArray(movie.genres)
                        ? movie.genres.map(
                            (g: any) => g.name
                        )
                        : [],

                posterUrl:
                    movie.poster_path
                        ? `${this.imageBase}/w500${movie.poster_path}`
                        : undefined,

                backdropUrl:
                    movie.backdrop_path
                        ? `${this.imageBase}/w780${movie.backdrop_path}`
                        : undefined
            };

        } catch (error) {

            console.error(
                "❌ TMDB Detail Fehler:",
                error
            );

            return null;
        }
    }
}