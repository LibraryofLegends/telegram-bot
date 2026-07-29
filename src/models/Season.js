/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Season.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Datenmodell einer Staffel.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Season extends BaseModel {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(data = {}) {

        super({

            id: null,

            series_id: null,

            tmdb_id: null,

            tvdb_id: null,

            season_number: 1,

            title: '',

            original_title: '',

            overview: '',

            air_date: null,

            year: null,

            episode_count: 0,

            watched_episodes: 0,

            runtime: null,

            poster: '',

            backdrop: '',

            trailer: '',

            library_id: '',

            favorite: false,

            watched: false,

            progress: 0,

            notes: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Season;