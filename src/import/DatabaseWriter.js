'use strict';

class DatabaseWriter {

    constructor(container) {

        this.container = container;

        this.db =
            container?.resolve?.('Database');

    }

    /**
     * Speichert ein Medium.
     *
     * @param {Object} media
     * @returns {Promise<Object>}
     */
    async save(media) {

        if (!this.db) {

            throw new Error(
                "Database service not available."
            );

        }

        if (media.mediaType === "series") {

            return await this.saveSeries(media);

        }

        return await this.saveMovie(media);

    }

    /**
     * Speichert einen Film.
     *
     * @param {Object} movie
     */
    async saveMovie(movie) {

        const existing =
            await this.findMovie(movie);

        if (existing) {

            await this.updateMovie(
                existing.id,
                movie
            );

            movie.databaseAction = "updated";
            movie.databaseId = existing.id;

            return movie;

        }

        const id =
            await this.insertMovie(movie);

        movie.databaseAction = "inserted";
        movie.databaseId = id;

        return movie;

    }

    /**
     * Speichert eine Serie.
     *
     * @param {Object} series
     */
    async saveSeries(series) {

        const existing =
            await this.findSeries(series);

        if (existing) {

            await this.updateSeries(
                existing.id,
                series
            );

            movie.databaseAction = "updated";
            series.databaseId = existing.id;

            return series;

        }

        const id =
            await this.insertSeries(series);

        series.databaseAction = "inserted";
        series.databaseId = id;

        return series;

    }

    /**
     * Film suchen.
     */
    async findMovie(movie) {

        return await this.db.movies.findOne({

            tmdbId: movie.tmdbId

        });

    }

    /**
     * Serie suchen.
     */
    async findSeries(series) {

        return await this.db.series.findOne({

            tmdbId: series.tmdbId

        });

    }

    /**
     * Film einfügen.
     */
    async insertMovie(movie) {

        return await this.db.movies.insert({

            ...movie

        });

    }

    /**
     * Serie einfügen.
     */
    async insertSeries(series) {

        return await this.db.series.insert({

            ...series

        });

    }

    /**
     * Film aktualisieren.
     */
    async updateMovie(id, movie) {

        return await this.db.movies.update(

            id,

            {

                ...movie

            }

        );

    }

    /**
     * Serie aktualisieren.
     */
    async updateSeries(id, series) {

        return await this.db.series.update(

            id,

            {

                ...series

            }

        );

    }

}

module.exports = DatabaseWriter;