'use strict';

const BaseRepository = require('./BaseRepository');

class EpisodeRepository extends BaseRepository {

    constructor(database) {

        super(database);

        this.table = 'episodes';

    }

    /**
     * Episode anhand der ID.
     */
    findById(id) {

        return super.findById(id);

    }

    /**
     * Alle Episoden einer Staffel.
     */
    findBySeason(seasonId) {

        return this.find({

            season_id: seasonId,

            orderBy: 'episode_number ASC'

        });

    }

    /**
     * Alle Episoden einer Serie.
     */
    findBySeries(seriesId) {

        return this.find({

            series_id: seriesId,

            orderBy: 'season_number ASC, episode_number ASC'

        });

    }

    /**
     * Einzelne Episode.
     */
    findEpisode(seriesId, seasonNumber, episodeNumber) {

        return this.findOne({

            series_id: seriesId,

            season_number: seasonNumber,

            episode_number: episodeNumber

        });

    }

    /**
     * Existiert Episode?
     */
    exists(seriesId, seasonNumber, episodeNumber) {

        return !!this.findEpisode(

            seriesId,

            seasonNumber,

            episodeNumber

        );

    }

    /**
     * Fehlende Episoden.
     */
    findMissing(seriesId, seasonNumber, expectedEpisodes) {

        const existing = this.find({

            series_id: seriesId,

            season_number: seasonNumber

        });

        const numbers = new Set(

            existing.map(

                e => e.episode_number

            )

        );

        const missing = [];

        for (

            let i = 1;

            i <= expectedEpisodes;

            i++

        ) {

            if (!numbers.has(i)) {

                missing.push(i);

            }

        }

        return missing;

    }

    /**
     * Doppelte Episoden.
     */
    findDuplicates(seriesId) {

        const episodes = this.find({

            series_id: seriesId

        });

        const map = new Map();

        const duplicates = [];

        for (const episode of episodes) {

            const key =

                `${episode.season_number}-${episode.episode_number}`;

            if (map.has(key)) {

                duplicates.push(episode);

                continue;

            }

            map.set(key, episode);

        }

        return duplicates;

    }

    /**
     * Neueste Episoden.
     */
    findLatest(limit = 25) {

        return this.find({

            orderBy: 'created_at DESC',

            limit

        });

    }

    /**
     * Episode speichern.
     */
    save(episode) {

        if (episode.id) {

            return this.update(

                episode.id,

                episode

            );

        }

        return this.create(episode);

    }

    /**
     * Episode löschen.
     */
    remove(id) {

        return this.delete(id);

    }

}

module.exports = EpisodeRepository;