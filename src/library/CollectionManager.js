'use strict';

class CollectionManager {

    constructor(container) {

        this.container = container;

        this.db =
            container?.resolve?.('Database');

    }

    /**
     * Aktualisiert eine Collection.
     *
     * @param {Object} media
     */
    async update(media) {

        if (!media.collection) {
            return;
        }

        const collection =
            await this.findCollection(media.collection);

        if (!collection) {

            return await this.createCollection(media);

        }

        return await this.updateCollection(
            collection,
            media
        );

    }

    /**
     * Collection suchen.
     */
    async findCollection(collection) {

        return await this.db.collections.findOne({

            tmdbId: collection.id

        });

    }

    /**
     * Neue Collection anlegen.
     */
    async createCollection(media) {

        return await this.db.collections.insert({

            tmdbId: collection.id,

            name: media.collection.name,

            poster: media.collection.poster,

            backdrop: media.collection.backdrop,

            overview: media.collection.overview,

            movieCount: 1

        });

    }

    /**
     * Collection aktualisieren.
     */
    async updateCollection(collection, media) {

        return await this.db.collections.update(

            collection.id,

            {

                movieCount:
                    collection.movieCount + 1,

                poster:
                    media.collection.poster,

                backdrop:
                    media.collection.backdrop

            }

        );

    }

    /**
     * Medium einer Collection zuordnen.
     */
    async assign(media) {

        if (!media.collection) {
            return;
        }

        const collection =
            await this.findCollection(
                media.collection
            );

        if (!collection) {
            return;
        }

        await this.db.collectionMovies.insert({

            collectionId: collection.id,

            movieId: media.databaseId,

            order:
                media.collection.order ?? 0

        });

    }

}

module.exports = CollectionManager;