'use strict';

const BASE_URL = 'https://www.omdbapi.com/';

class OMDBService {

    constructor(options = {}) {

        this.apiKey =
            options.apiKey ??
            process.env.OMDB_API_KEY;

        this.cache = new Map();

        this.cacheTTL =
            options.cacheTTL ??
            1000 * 60 * 60;

    }

    /**
     * HTTP Request.
     */
    async request(params = {}) {

        if (!this.apiKey) {

            throw new Error(
                'OMDB_API_KEY fehlt.'
            );

        }

        const url = new URL(BASE_URL);

        url.searchParams.set(
            "apikey",
            this.apiKey
        );

        for (

            const [key, value]

            of

            Object.entries(params)

        ) {

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

        const response =

            await fetch(url);

        if (!response.ok) {

            throw new Error(

                `OMDb Error ${response.status}`

            );

        }

        const json =

            await response.json();

        if (

            json.Response === "False"

        ) {

            return null;

        }

        return json;

    }

    /**
     * Nach IMDb-ID suchen.
     */
    async byIMDb(imdbId) {

        return await this.request({

            i: imdbId

        });

    }

    /**
     * Nach Titel suchen.
     */
    async byTitle(

        title,

        year = null

    ) {

        return await this.request({

            t: title,

            y: year

        });

    }

    /**
     * Cache-Key.
     */
    cacheKey(params) {

        return JSON.stringify(params);

    }

    /**
     * Cached Request.
     */
    async cached(params) {

        const key =

            this.cacheKey(params);

        const cached =

            this.cache.get(key);

        if (

            cached &&

            cached.expires >

            Date.now()

        ) {

            return cached.data;

        }

        const result =

            await this.request(params);

        this.cache.set(

            key,

            {

                data: result,

                expires:

                    Date.now()

                    +

                    this.cacheTTL

            }

        );

        return result;

    }

    /**
     * IMDb Bewertung.
     */
    getIMDbRating(movie) {

        return parseFloat(

            movie?.imdbRating ??

            0

        );

    }

    /**
     * IMDb Votes.
     */
    getVotes(movie) {

        return parseInt(

            movie?.imdbVotes

                ?.replace(/,/g, "")

            ??

            0

        );

    }

    /**
     * Metascore.
     */
    getMetascore(movie) {

        return parseInt(

            movie?.Metascore ??

            0

        );

    }

    /**
     * Rotten Tomatoes.
     */
    getRottenTomatoes(movie) {

        if (

            !movie?.Ratings

        ) {

            return null;

        }

        const rating =

            movie.Ratings.find(

                r =>

                    r.Source ===

                    "Rotten Tomatoes"

            );

        return rating

            ? rating.Value

            : null;

    }

    /**
     * Awards.
     */
    getAwards(movie) {

        return movie?.Awards;

    }

    /**
     * Box Office.
     */
    getBoxOffice(movie) {

        return movie?.BoxOffice;

    }

    /**
     * DVD Release.
     */
    getDVD(movie) {

        return movie?.DVD;

    }

    /**
     * Produktionsfirma.
     */
    getProduction(movie) {

        return movie?.Production;

    }

    /**
     * Website.
     */
    getWebsite(movie) {

        return movie?.Website;

    }

}

module.exports = OMDBService;