/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TMDBService

Architecture Layer..: Infrastructure

Module..............: TMDB

Module ID...........: LOL-MOD-INF-TMDB-0001

LOL-ID..............: LOL-TMDB-SERVICE-0001

File................: tmdb.service.ts

Location............
Library Of Legend/src/infrastructure/tmdb/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central TMDB integration service.

Responsibilities:

- Fetch movie data from TMDB
- Normalize TMDB response
- Provide clean TMDBMovie objects
- Cache results to reduce API calls
- Improve performance & response time

Caching:

- In-memory cache (Map)
- 24h TTL
- Key based on title + year

Important:

- This service is the ONLY place where TMDB is accessed
- All external API data must be normalized here
- Application layer must NEVER access raw TMDB data

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface TMDBMovie {

    title:
        string;

    year?:
        number;

    rating?:
        number;

    genres:
        string[];

    overview?:
        string;

    posterUrl?:
        string;

    collection?:
        string | null;
}

// =============================================================================
// CACHE SYSTEM
// =============================================================================

type CacheEntry<T> = {
    data: T;
    expires: number;
};

const CACHE_TTL =
    1000 * 60 * 60 * 24; // 24 Stunden

const movieCache =
    new Map<string, CacheEntry<TMDBMovie | null>>();

// =============================================================================
// HELPERS
// =============================================================================

function buildKey(
    title: string,
    year?: number
): string {

    return `${String(title).toLowerCase()}_${year || "any"}`;
}

// =============================================================================
// SERVICE
// =============================================================================

export class TMDBService {

    // =========================================================================
    // PUBLIC SEARCH
    // =========================================================================

    public static async searchMovie(
        title: string,
        year?: number
    ): Promise<TMDBMovie | null> {

        const key =
            buildKey(title, year);

        const cached =
            movieCache.get(key);

        if (
            cached &&
            cached.expires > Date.now()
        ) {

            console.log(
                "⚡ TMDB CACHE HIT:",
                title
            );

            return cached.data;
        }

        console.log(
            "🌐 TMDB API CALL:",
            title
        );

        const result =
            await this.fetchFromTMDB(
                title,
                year
            );

        movieCache.set(
            key,
            {
                data: result,
                expires:
                    Date.now() +
                    CACHE_TTL
            }
        );

        return result;
    }

    // =========================================================================
    // FETCH FROM TMDB
    // =========================================================================

    private static async fetchFromTMDB(
        title: string,
        year?: number
    ): Promise<TMDBMovie | null> {

        try {

            const apiKey =
                process.env.TMDB_API_KEY;

            if (!apiKey) {

                console.error(
                    "❌ TMDB API KEY fehlt."
                );

                return null;
            }

            const query =
                encodeURIComponent(title);

            const url =
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`;

            const response =
                await fetch(url);

            const data =
                await response.json();

            if (
                !data.results ||
                !data.results.length
            ) {

                return null;
            }

            // =========================================================================
            // BEST MATCH
            // =========================================================================

            const match =
                data.results[0];

            // =========================================================================
            // COLLECTION (optional second call)
            // =========================================================================

            let collection:
                string |
                null =
                    null;

            if (
                match.id
            ) {

                try {

                    const detailUrl =
                        `https://api.themoviedb.org/3/movie/${match.id}?api_key=${apiKey}`;

                    const detailRes =
                        await fetch(detailUrl);

                    const detailData =
                        await detailRes.json();

                    collection =
                        detailData
                            ?.belongs_to_collection
                            ?.name ||
                        null;

                } catch {
                    // ignore collection errors
                }
            }

            // =========================================================================
            // NORMALIZED RESULT
            // =========================================================================

            const movie:
                TMDBMovie = {

                title:
                    match.title,

                year:
                    match.release_date
                        ? Number(
                              match.release_date.substring(
                                  0,
                                  4
                              )
                          )
                        : undefined,

                rating:
                    match.vote_average,

                genres:
                    (match.genre_ids || []).map(
                        (id: number) =>
                            String(id)
                    ),

                overview:
                    match.overview,

                posterUrl:
                    match.poster_path
                        ? `https://image.tmdb.org/t/p/w500${match.poster_path}`
                        : undefined,

                collection
            };

            return movie;

        } catch (
            error
        ) {

            console.error(
                "❌ TMDB Fehler:",
                error
            );

            return null;
        }
    }
}