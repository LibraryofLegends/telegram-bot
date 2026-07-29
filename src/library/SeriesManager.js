'use strict';

class SeriesManager {

    constructor(container) {

        this.container = container;

        this.db =
            container?.resolve?.('Database');

    }

    /**
     * Speichert eine Serie.
     *
     * @param {Object} media
     */
    async save(media) {

        if (media.mediaType !== "series") {
            return media;
        }

        let series =
            await this.findSeries(media);

        if (!series) {

            const id =
                await this.createSeries(media);

            series = {

                id,

                tmdbId: media.tmdbId

            };

        } else {

            await this.updateSeries(
                series.id,
                media
            );

        }

        media.seriesId = series.id;

        if (media.season) {

            const season =
                await this.saveSeason(
                    series.id,
                    media
                );

            media.seasonId = season.id;

        }

        if (media.episode) {

            const episode =
                await this.saveEpisode(
                    media.seasonId,
                    media
                );

            media.episodeId = episode.id;

        }

        return media;

    }

    /**
     * Serie suchen.
     */
    async findSeries(media) {

        return await this.db.series.findOne({

            tmdbId: media.tmdbId

        });

    }

    /**
     * Serie erstellen.
     */
    async createSeries(media) {

        return await this.db.series.insert({

            tmdbId: media.tmdbId,

            imdbId: media.imdbId,

            title: media.title,

            originalTitle: media.originalTitle,

            overview: media.overview,

            poster: media.poster,

            backdrop: media.backdrop,

            logo: media.logo,

            genres: media.genres,

            firstAirDate: media.releaseDate,

            status: media.status,

            language: media.language,

            voteAverage: media.voteAverage,

            voteCount: media.voteCount,

            createdAt: new Date()

        });

    }

    /**
     * Serie aktualisieren.
     */
    async updateSeries(id, media) {

        return await this.db.series.update(

            id,

            {

                title: media.title,

                overview: media.overview,

                poster: media.poster,

                backdrop: media.backdrop,

                logo: media.logo,

                voteAverage: media.voteAverage,

                voteCount: media.voteCount,

                updatedAt: new Date()

            }

        );

    }

    /**
     * Staffel speichern.
     */
    async saveSeason(seriesId, media) {

        let season =
            await this.db.seasons.findOne({

                seriesId,

                seasonNumber:
                    media.season

            });

        if (!season) {

            const id =
                await this.db.seasons.insert({

                    seriesId,

                    seasonNumber:
                        media.season,

                    poster:
                        media.seasonPoster,

                    episodeCount: 0

                });

            season = {

                id

            };

        }

        return season;

    }

    /**
     * Episode speichern.
     */
    async saveEpisode(seasonId, media) {

        let episode =
            await this.db.episodes.findOne({

                seasonId,

                episodeNumber:
                    media.episode

            });

        if (episode) {

            return episode;

        }

        const id =
            await this.db.episodes.insert({

                seasonId,

                episodeNumber:
                    media.episode,

                title:
                    media.episodeTitle,

                overview:
                    media.episodeOverview,

                runtime:
                    media.runtime,

                still:
                    media.episodeStill,

                voteAverage:
                    media.voteAverage

            });

        return {

            id

        };

    }

}

module.exports = SeriesManager;