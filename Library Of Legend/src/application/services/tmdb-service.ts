/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TMDB Service

Architecture Layer..: Application

Module..............: Service

File................: tmdb-service.ts

===============================================================================
*/

export interface TMDBMovie {
    title: string;
    overview?: string;
    rating?: number;
    genres?: string[];
}

export class TMDBService {

    private apiKey =
        process.env.TMDB_KEY;

    private baseUrl =
        "https://api.themoviedb.org/3";

    // =========================================================================
    // SEARCH MOVIE
    // =========================================================================

    public async searchMovie(
        title: string,
        year?: number
    ): Promise<TMDBMovie | null> {

        if (!this.apiKey) {
            console.log("❌ Kein TMDB Key gesetzt");
            return null;
        }

        try {

            const url =
                `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ""}`;

            const res =
                await fetch(url);

            const data =
                await res.json();

            if (!data.results || data.results.length === 0) {
                return null;
            }

            const movie =
                data.results[0];

            // Genres holen
            const detailRes =
                await fetch(
                    `${this.baseUrl}/movie/${movie.id}?api_key=${this.apiKey}`
                );

            const detail =
                await detailRes.json();

            return {
                title: movie.title,
                overview: movie.overview,
                rating: movie.vote_average,
                genres: detail.genres?.map((g: any) => g.name) || []
            };

        } catch (error) {

            console.error("❌ TMDB Fehler:", error);
            return null;
        }
    }
}