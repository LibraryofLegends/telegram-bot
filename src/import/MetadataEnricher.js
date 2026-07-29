'use strict';

const TMDBService = require('../services/TMDBService');
const OMDBService = require('../services/OMDBService');

class MetadataEnricher {

    constructor(container) {

        this.container = container;

        this.tmdb =
            container?.resolve?.('TMDBService') ??
            new TMDBService();

        this.omdb =
            container?.resolve?.('OMDBService') ??
            new OMDBService();

    }

    /**
     * Hauptfunktion
     *
     * @param {Object} media
     * @returns {Promise<Object>}
     */
    async enrich(media) {

        if (!media.title) {
            return media;
        }

        const metadata = await this.search(media);

        if (!metadata) {
            return media;
        }

        this.apply(media, metadata);

        return media;

    }

    /**
     * Sucht passende Metadaten.
     *
     * @param {Object} media
     * @returns {Promise<Object|null>}
     */
    async search(media) {

        let result = null;

        if (media.mediaType === "series") {

            result = await this.tmdb.searchSeries(
                media.title,
                media.year
            );

        } else {

            result = await this.tmdb.searchMovie(
                media.title,
                media.year
            );

        }

        if (!result) {

            result = await this.omdb.search(
                media.title,
                media.year
            );

        }

        return result;

    }

    /**
     * Überträgt Metadaten.
     *
     * @param {Object} media
     * @param {Object} metadata
     */
    apply(media, metadata) {

        media.tmdbId =
            metadata.tmdbId ?? null;

        media.imdbId =
            metadata.imdbId ?? null;

        media.title =
            metadata.title ?? media.title;

        media.originalTitle =
            metadata.originalTitle ?? null;

        media.overview =
            metadata.overview ?? null;

        media.tagline =
            metadata.tagline ?? null;

        media.releaseDate =
            metadata.releaseDate ?? null;

        media.year =
            metadata.year ?? media.year;

        media.runtime =
            metadata.runtime ?? null;

        media.status =
            metadata.status ?? null;

        media.language =
            metadata.language ?? null;

        media.country =
            metadata.country ?? null;

        media.genres =
            metadata.genres ?? [];

        media.studios =
            metadata.studios ?? [];

        media.cast =
            metadata.cast ?? [];

        media.directors =
            metadata.directors ?? [];

        media.writers =
            metadata.writers ?? [];

        media.producers =
            metadata.producers ?? [];

        media.poster =
            metadata.poster ?? null;

        media.backdrop =
            metadata.backdrop ?? null;

        media.logo =
            metadata.logo ?? null;

        media.trailer =
            metadata.trailer ?? null;

        media.collection =
            metadata.collection ?? null;

        media.homepage =
            metadata.homepage ?? null;

        media.voteAverage =
            metadata.voteAverage ?? null;

        media.voteCount =
            metadata.voteCount ?? null;

        media.popularity =
            metadata.popularity ?? null;

        media.keywords =
            metadata.keywords ?? [];

        media.fsk =
            metadata.fsk ?? null;

    }

}

module.exports = MetadataEnricher;