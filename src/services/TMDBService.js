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

module.exports = TMDBService;