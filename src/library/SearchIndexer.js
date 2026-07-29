'use strict';

class SearchIndexer {

    constructor(container) {

        this.container = container;

        this.db =
            container?.resolve?.('Database');

    }

    /**
     * Index für ein Medium erstellen.
     *
     * @param {Object} media
     */
    async index(media) {

        if (!media.databaseId) {
            return;
        }

        await this.remove(media.databaseId);

        const entries = this.buildEntries(media);

        for (const entry of entries) {

            await this.db.searchIndex.insert(entry);

        }

    }

    /**
     * Bestehenden Index entfernen.
     *
     * @param {Number} mediaId
     */
    async remove(mediaId) {

        await this.db.searchIndex.delete({

            mediaId

        });

    }

    /**
     * Suchindex erzeugen.
     *
     * @param {Object} media
     */
    buildEntries(media) {

        const entries = [];

        this.add(entries, media.databaseId, "title", media.title);

        this.add(entries, media.databaseId, "originalTitle", media.originalTitle);

        this.add(entries, media.databaseId, "year", media.year);

        this.add(entries, media.databaseId, "country", media.country);

        this.add(entries, media.databaseId, "language", media.language);

        this.add(entries, media.databaseId, "resolution", media.resolution);

        this.add(entries, media.databaseId, "source", media.source);

        this.add(entries, media.databaseId, "videoCodec", media.videoCodec);

        this.add(entries, media.databaseId, "audioCodec", media.audioCodec);

        this.addArray(entries, media.databaseId, "genre", media.genres);

        this.addArray(entries, media.databaseId, "actor", media.cast);

        this.addArray(entries, media.databaseId, "director", media.directors);

        this.addArray(entries, media.databaseId, "writer", media.writers);

        this.addArray(entries, media.databaseId, "producer", media.producers);

        this.add(entries, media.databaseId, "collection", media.collection?.name);

        return entries;

    }

    /**
     * Einzelnen Eintrag hinzufügen.
     */
    add(entries, mediaId, type, value) {

        if (!value) {
            return;
        }

        entries.push({

            mediaId,

            type,

            value: String(value).trim(),

            normalized: String(value)
                .toLowerCase()
                .trim()

        });

    }

    /**
     * Array hinzufügen.
     */
    addArray(entries, mediaId, type, values) {

        if (!Array.isArray(values)) {
            return;
        }

        for (const value of values) {

            if (!value) {
                continue;
            }

            this.add(

                entries,

                mediaId,

                type,

                value.name ?? value

            );

        }

    }

    /**
     * Suche.
     *
     * @param {String} query
     */
    async search(query) {

        return await this.db.searchIndex.search(

            query.toLowerCase()

        );

    }

}

module.exports = SearchIndexer;