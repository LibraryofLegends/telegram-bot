'use strict';

const BaseRepository = require('./BaseRepository');

class CollectionRepository extends BaseRepository {

    constructor(database) {

        super(database);

        this.table = 'collections';

    }

    /**
     * Collection anhand der ID.
     */
    findById(id) {

        return super.findById(id);

    }

    /**
     * Collection anhand der TMDb-ID.
     */
    findByTMDB(tmdbId) {

        return this.findOne({

            tmdb_id: tmdbId

        });

    }

    /**
     * Collection anhand des Namens.
     */
    findByName(name) {

        return this.findOne({

            name

        });

    }

    /**
     * Existiert die Collection?
     */
    exists(tmdbId) {

        return !!this.findByTMDB(tmdbId);

    }

    /**
     * Alle Collections alphabetisch.
     */
    findAllOrdered() {

        return this.find({

            orderBy: 'name ASC'

        });

    }

    /**
     * Collections mit mindestens X Filmen.
     */
    findByMinimumMovies(minimum = 2) {

        return this.find({

            movie_count: {

                operator: '>=',
                value: minimum

            },

            orderBy: 'movie_count DESC'

        });

    }

    /**
     * Collection speichern.
     */
    save(collection) {

        if (collection.id) {

            return this.update(

                collection.id,

                collection

            );

        }

        return this.create(collection);

    }

    /**
     * Filmanzahl aktualisieren.
     */
    updateMovieCount(id, count) {

        return this.update(

            id,

            {

                movie_count: count

            }

        );

    }

    /**
     * Collection löschen.
     */
    remove(id) {

        return this.delete(id);

    }

}

module.exports = CollectionRepository;