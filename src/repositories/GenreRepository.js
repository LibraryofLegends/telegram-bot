'use strict';

const BaseRepository = require('./BaseRepository');

class GenreRepository extends BaseRepository {

    constructor(database) {

        super(database);

        this.table = 'genres';

    }

    /**
     * Genre anhand der ID.
     */
    findById(id) {

        return super.findById(id);

    }

    /**
     * Genre anhand der TMDb-ID.
     */
    findByTMDB(tmdbId) {

        return this.findOne({

            tmdb_id: tmdbId

        });

    }

    /**
     * Genre anhand des Namens.
     */
    findByName(name) {

        return this.findOne({

            name

        });

    }

    /**
     * Existiert Genre?
     */
    exists(tmdbId) {

        return !!this.findByTMDB(tmdbId);

    }

    /**
     * Alle Genres.
     */
    findAllOrdered() {

        return this.find({

            orderBy: 'name ASC'

        });

    }

    /**
     * Genre speichern.
     */
    save(genre) {

        if (genre.id) {

            return this.update(

                genre.id,

                genre

            );

        }

        return this.create(genre);

    }

    /**
     * Mehrere Genres speichern.
     */
    saveMany(genres = []) {

        const result = [];

        for (const genre of genres) {

            result.push(

                this.save(genre)

            );

        }

        return result;

    }

    /**
     * Genre löschen.
     */
    remove(id) {

        return this.delete(id);

    }

}

module.exports = GenreRepository;