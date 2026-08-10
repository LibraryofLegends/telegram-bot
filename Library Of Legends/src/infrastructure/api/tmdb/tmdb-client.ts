/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TMDBClient

Architecture Layer..: Infrastructure

Module..............: API

Module ID...........: LOL-MOD-TMDB-0001

LOL-ID..............: LOL-TMDB-0001

File................: tmdb-client.ts

Location............
Library Of Legends/src/infrastructure/api/tmdb/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Handles communication with The Movie Database (TMDB) API.
Provides search functionality for movies and TV shows.

===============================================================================
*/

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * TMDB Search Result
 */
export interface TMDBResult {
    title: string;
    overview: string;
    posterPath: string | null;
    releaseDate?: string;
}

/**
 * TMDB Client
 */
export class TMDBClient {

    private static get apiKey(): string {
        const key = process.env.TMDB_KEY;

        if (!key) {
            throw new Error("❌ TMDB_KEY fehlt in ENV");
        }

        return key;
    }

    // =========================================================================
    // MOVIE SEARCH
    // =========================================================================

    public static async searchMovie(query: string): Promise<TMDBResult | null> {

        const url = `${TMDB_BASE_URL}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            return null;
        }

        const movie = data.results[0];

        return {
            title: movie.title,
            overview: movie.overview,
            posterPath: movie.poster_path,
            releaseDate: movie.release_date
        };

    }

    // =========================================================================
    // TV SEARCH
    // =========================================================================

    public static async searchSeries(query: string): Promise<TMDBResult | null> {

        const url = `${TMDB_BASE_URL}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            return null;
        }

        const show = data.results[0];

        return {
            title: show.name,
            overview: show.overview,
            posterPath: show.poster_path,
            releaseDate: show.first_air_date
        };

    }

}