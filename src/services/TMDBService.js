'use strict';

const BASE_URL = 'https://api.themoviedb.org/3';

class TMDBService {

    constructor(options = {}) {

        this.apiKey =
            options.apiKey ??
            process.env.TMDB_API_KEY;

        this.language =
            options.language ??
            process.env.TMDB_LANGUAGE ??
            'de-DE';

        this.imageBase =
            options.imageBase ??
            'https://image.tmdb.org/t/p/original';

    }

    /**
     * HTTP Request
     */
    async request(endpoint, params = {}) {

        if (!this.apiKey) {

            throw new Error(
                'TMDB_API_KEY fehlt.'
            );

        }

        const url = new URL(
            BASE_URL + endpoint
        );

        url.searchParams.set(
            'api_key',
            this.apiKey
        );

        url.searchParams.set(
            'language',
            this.language
        );

        for (const [key, value] of Object.entries(params)) {

            if (

                value !== undefined &&
                value !== null

            ) {

                url.searchParams.set(
                    key,
                    value
                );

            }

        }

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(

                `TMDB Error ${response.status}`

            );

        }

        return await response.json();

    }

    /**
     * Filmsuche
     */
    async searchMovie(title, year = null) {

        const result =
            await this.request(

                '/search/movie',

                {

                    query: title,

                    year

                }

            );

        return result.results?.[0] ?? null;

    }

    /**
     * Serien-Suche
     */
    async searchSeries(title, year = null) {

        const result =
            await this.request(

                '/search/tv',

                {

                    query: title,

                    first_air_date_year: year

                }

            );

        return result.results?.[0] ?? null;

    }

    /**
     * Filmdetails
     */
    async getMovie(id) {

        return await this.request(

            `/movie/${id}`

        );

    }

    /**
     * Seriendetails
     */
    async getSeries(id) {

        return await this.request(

            `/tv/${id}`

        );

    }

    /**
     * Bilder
     */
    getImage(path) {

        if (!path) {

            return null;

        }

        return this.imageBase + path;

    }

}

    /**
     * Film inklusive Credits.
     */
    async getMovieDetails(id) {

        return await this.request(

            `/movie/${id}`,

            {

                append_to_response:
                    "credits,images,videos,keywords,release_dates,watch/providers"

            }

        );

    }

    /**
     * Serie inklusive Credits.
     */
    async getSeriesDetails(id) {

        return await this.request(

            `/tv/${id}`,

            {

                append_to_response:
                    "credits,images,videos,keywords,content_ratings,watch/providers"

            }

        );

    }

    /**
     * Staffelinformationen.
     */
    async getSeason(

        seriesId,

        seasonNumber

    ) {

        return await this.request(

            `/tv/${seriesId}/season/${seasonNumber}`

        );

    }

    /**
     * Episodeninformationen.
     */
    async getEpisode(

        seriesId,

        season,

        episode

    ) {

        return await this.request(

            `/tv/${seriesId}/season/${season}/episode/${episode}`

        );

    }

    /**
     * Collection laden.
     */
    async getCollection(id) {

        return await this.request(

            `/collection/${id}`

        );

    }

    /**
     * Person laden.
     */
    async getPerson(id) {

        return await this.request(

            `/person/${id}`

        );

    }

    /**
     * Schauspieler eines Films.
     */
    async getCast(movieId) {

        const movie =
            await this.getMovieDetails(movieId);

        return movie.credits?.cast ?? [];

    }

    /**
     * Crew eines Films.
     */
    async getCrew(movieId) {

        const movie =
            await this.getMovieDetails(movieId);

        return movie.credits?.crew ?? [];

    }

    /**
     * Trailer.
     */
    async getTrailers(id, type = "movie") {

        const data =
            await this.request(

                `/${type}/${id}/videos`

            );

        return data.results ?? [];

    }

    /**
     * Bilder.
     */
    async getImages(id, type = "movie") {

        return await this.request(

            `/${type}/${id}/images`

        );

    }

    /**
     * Schlüsselwörter.
     */
    async getKeywords(id, type = "movie") {

        return await this.request(

            `/${type}/${id}/keywords`

        );

    }

    /**
     * Empfehlungen.
     */
    async getRecommendations(

        id,

        type = "movie"

    ) {

        return await this.request(

            `/${type}/${id}/recommendations`

        );

    }

    /**
     * Ähnliche Medien.
     */
    async getSimilar(

        id,

        type = "movie"

    ) {

        return await this.request(

            `/${type}/${id}/similar`

        );

    }
    
        /**
     * Trending Filme.
     */
    async getTrendingMovies(time = "week") {

        return await this.request(

            `/trending/movie/${time}`

        );

    }

    /**
     * Trending Serien.
     */
    async getTrendingSeries(time = "week") {

        return await this.request(

            `/trending/tv/${time}`

        );

    }

    /**
     * Beliebte Filme.
     */
    async getPopularMovies(page = 1) {

        return await this.request(

            "/movie/popular",

            {

                page

            }

        );

    }

    /**
     * Beliebte Serien.
     */
    async getPopularSeries(page = 1) {

        return await this.request(

            "/tv/popular",

            {

                page

            }

        );

    }

    /**
     * Top Rated Filme.
     */
    async getTopRatedMovies(page = 1) {

        return await this.request(

            "/movie/top_rated",

            {

                page

            }

        );

    }

    /**
     * Top Rated Serien.
     */
    async getTopRatedSeries(page = 1) {

        return await this.request(

            "/tv/top_rated",

            {

                page

            }

        );

    }

    /**
     * Aktuelle Kinofilme.
     */
    async getNowPlaying(page = 1) {

        return await this.request(

            "/movie/now_playing",

            {

                page

            }

        );

    }

    /**
     * Kommende Filme.
     */
    async getUpcoming(page = 1) {

        return await this.request(

            "/movie/upcoming",

            {

                page

            }

        );

    }

    /**
     * Heute ausgestrahlte Serien.
     */
    async getAiringToday(page = 1) {

        return await this.request(

            "/tv/airing_today",

            {

                page

            }

        );

    }

    /**
     * Serien auf Sendung.
     */
    async getOnTheAir(page = 1) {

        return await this.request(

            "/tv/on_the_air",

            {

                page

            }

        );

    }

    /**
     * Filmgenres.
     */
    async getMovieGenres() {

        return await this.request(

            "/genre/movie/list"

        );

    }

    /**
     * Seriengenres.
     */
    async getSeriesGenres() {

        return await this.request(

            "/genre/tv/list"

        );

    }

    /**
     * Übersetzungen eines Films.
     */
    async getMovieTranslations(id) {

        return await this.request(

            `/movie/${id}/translations`

        );

    }

    /**
     * Übersetzungen einer Serie.
     */
    async getSeriesTranslations(id) {

        return await this.request(

            `/tv/${id}/translations`

        );

    }

    /**
     * Watch Provider.
     */
    async getWatchProviders(

        id,

        type = "movie"

    ) {

        return await this.request(

            `/${type}/${id}/watch/providers`

        );

    }

    /**
     * Externe IDs.
     */
    async getExternalIds(

        id,

        type = "movie"

    ) {

        return await this.request(

            `/${type}/${id}/external_ids`

        );

    }

    /**
     * Bilder in URLs umwandeln.
     */
    mapImages(images = []) {

        return images.map(image => ({

            ...image,

            url: this.getImage(

                image.file_path

            )

        }));

    }
    
    this.cache = new Map();

this.cacheTTL =
    options.cacheTTL ??
    1000 * 60 * 60;

this.rateLimitDelay =
    options.rateLimitDelay ??
    250;

this.lastRequest = 0;

this.requestCount = 0;

this.cacheHits = 0;

    /**
     * Wartet bei Bedarf zwischen zwei Requests.
     */
    async waitForRateLimit() {

        const elapsed =
            Date.now() - this.lastRequest;

        if (

            elapsed < this.rateLimitDelay

        ) {

            await new Promise(resolve =>

                setTimeout(

                    resolve,

                    this.rateLimitDelay - elapsed

                )

            );

        }

        this.lastRequest = Date.now();

    }

    /**
     * Cache-Key erzeugen.
     */
    createCacheKey(

        endpoint,

        params

    ) {

        return JSON.stringify({

            endpoint,

            params

        });

    }

    /**
     * Cache lesen.
     */
    getCache(key) {

        const cached =

            this.cache.get(key);

        if (!cached) {

            return null;

        }

        if (

            Date.now()

            >

            cached.expires

        ) {

            this.cache.delete(key);

            return null;

        }

        this.cacheHits++;

        return cached.data;

    }

    /**
     * Cache speichern.
     */
    saveCache(

        key,

        data

    ) {

        this.cache.set(

            key,

            {

                data,

                expires:

                    Date.now()

                    +

                    this.cacheTTL

            }

        );

    }

    /**
     * Cache löschen.
     */
    clearCache() {

        this.cache.clear();

    }

    /**
     * Request mit Retry.
     */
    async requestWithRetry(

        endpoint,

        params = {},

        retries = 3

    ) {

        const cacheKey =

            this.createCacheKey(

                endpoint,

                params

            );

        const cached =

            this.getCache(

                cacheKey

            );

        if (cached) {

            return cached;

        }

        for (

            let attempt = 1;

            attempt <= retries;

            attempt++

        ) {

            try {

                await this.waitForRateLimit();

                this.requestCount++;

                const result =

                    await this.request(

                        endpoint,

                        params

                    );

                this.saveCache(

                    cacheKey,

                    result

                );

                return result;

            }

            catch (err) {

                if (

                    attempt === retries

                ) {

                    throw err;

                }

                await new Promise(resolve =>

                    setTimeout(

                        resolve,

                        attempt * 1000

                    )

                );

            }

        }

    }

    /**
     * Statistik.
     */
    getStats() {

        return {

            requests:

                this.requestCount,

            cacheEntries:

                this.cache.size,

            cacheHits:

                this.cacheHits,

            cacheTTL:

                this.cacheTTL,

            rateLimit:

                this.rateLimitDelay

        };

    }

module.exports = TMDBService;