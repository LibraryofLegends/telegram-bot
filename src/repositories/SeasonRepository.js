'use strict';

const BaseRepository = require('./BaseRepository');

class SeasonRepository extends BaseRepository {

    constructor(database) {

        super(database);

        this.table = 'seasons';

    }

    /**
     * Staffel anhand der ID.
     */
    findById(id) {

        return super.findById(id);

    }

    /**
     * Staffel einer Serie.
     */
    findBySeries(seriesId) {

        return this.find({

            series_id: seriesId,

            orderBy: 'season_number ASC'

        });

    }

    /**
     * Einzelne Staffel.
     */
    findSeason(seriesId, seasonNumber) {

        return this.findOne({

            series_id: seriesId,

            season_number: seasonNumber

        });

    }

    /**
     * Existiert Staffel?
     */
    exists(seriesId, seasonNumber) {

        return !!this.findSeason(

            seriesId,

            seasonNumber

        );

    }

    /**
     * Staffel speichern.
     */
    save(season) {

        if (season.id) {

            return this.update(

                season.id,

                season

            );

        }

        return this.create(season);

    }

    /**
     * Staffel löschen.
     */
    remove(id) {

        return this.delete(id);

    }

    /**
     * Episodenanzahl aktualisieren.
     */
    updateEpisodeCount(id, count) {

        return this.update(

            id,

            {

                episode_count: count

            }

        );

    }

}

module.exports = SeasonRepository;