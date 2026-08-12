/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TMDBService

Architecture Layer..: Application

Module..............: Services

Module ID...........: LOL-MOD-APP-TMDB-0001

LOL-ID..............: LOL-TMDB-0001

File................: tmdb-service.ts

Location............
Library Of Legend/src/application/services/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Handles all TMDB API communication.

Responsibilities:

- Search movies by title
- Optional year filtering
- Map TMDB response into clean structure
- Handle API errors

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface TMDBMovie {
    id: number;
    title: string;
    year?: number;
    overview?: string;
    rating?: number;
    genres?: string[];
    posterUrl?: string;
    backdropUrl?: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class TMDBService {

    private static BASE_URL =
        "https://api.themoviedb.org/3";

    private static IMAGE_URL =
        "https://image.tmdb.org/t/p/w500";

    private static API_KEY =
        process.env.TMDB_API_KEY;

    // =========================================================================
    // SEARCH MOVIE
    // =========================================================================

    public static async searchMovie(
        title: string,
        year?: number
    ): Promise<TMDBMovie | null> {

        if (!this.API_KEY) {
            console.error("❌ TMDB API KEY fehlt!");
            return null;
        }

        try {

            const query =
                encodeURIComponent(title);

            const url =
                `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${query}`;

            const response =
                await fetch(url);

            const data =
                await response.json();

            if (!data.results || data.results.length === 0) {
                console.warn("⚠️ Kein TMDB Treffer für:", title);
                return null;
            }

            let movie =
                data.results[0];

            // =============================================================
            // YEAR FILTER (optional)
            // =============================================================

            if (year) {

                const match =
                    data.results.find((m: any) =>
                        m.release_date?.startsWith(String(year))
                    );

                if (match) {
                    movie = match;
                }
            }

            // =============================================================
            // DETAILS (GENRES etc.)
            // =============================================================

            const detailsRes =
                await fetch(
                    `${this.BASE_URL}/movie/${movie.id}?api_key=${this.API_KEY}&language=de-DE`
                );

            const details =
                await detailsRes.json();

            // =============================================================
            // MAP RESULT
            // =============================================================

            return {
                id: movie.id,
                title: movie.title,
                year: movie.release_date
                    ? Number(movie.release_date.slice(0, 4))
                    : undefined,
                overview: details.overview,
                rating: movie.vote_average,
                genres: details.genres?.map((g: any) => g.name),
                posterUrl: movie.poster_path
                    ? `${this.IMAGE_URL}${movie.poster_path}`
                    : undefined,
                backdropUrl: movie.backdrop_path
                    ? `${this.IMAGE_URL}${movie.backdrop_path}`
                    : undefined
            };

        } catch (error) {

            console.error("❌ TMDB Fehler:", error);

            return null;
        }
    }
}