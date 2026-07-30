'use strict';

const BaseRepository = require('./BaseRepository');

class SeriesRepository extends BaseRepository {

    constructor(database) {

        super(database);

        this.table = 'series';

    }

    /**
     * Serie anhand der TMDb-ID finden.
     */
    findByTMDB(tmdbId) {

        return this.findOne({

            tmdb_id: tmdbId

        });

    }

    /**
     * Serie anhand der IMDb-ID finden.
     */
    findByIMDb(imdbId) {

        return this.findOne({

            imdb_id: imdbId

        });

    }

    /**
     * Serie anhand des Titels finden.
     */
    findByTitle(title) {

        return this.findOne({

            title

        });

    }

    /**
     * Existiert die Serie bereits?
     */
    exists(tmdbId) {

        return !!this.findByTMDB(tmdbId);

    }

    /**
     * Alle Serien alphabetisch.
     */
    findAllOrdered() {

        return this.find({

            orderBy: 'title ASC'

        });

    }

    /**
     * Serien nach Jahr.
     */
    findByYear(year) {

        return this.find({

            year

        });

    }

    /**
     * Serien aktualisieren.
     */
    save(series) {

        if (series.id) {

            return this.update(

                series.id,

                series

            );

        }

        return this.create(series);

    }

}

module.exports = SeriesRepository;