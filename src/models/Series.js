/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Series.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Datenmodell einer Serie.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Series extends BaseModel {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(data = {}) {

        super({

            id: null,

            tmdb_id: null,

            tvdb_id: null,

            imdb_id: null,

            title: '',

            original_title: '',

            sort_title: '',

            overview: '',

            tagline: '',

            first_air_date: null,

            last_air_date: null,

            year: null,

            status: '',

            type: '',

            seasons: 0,

            episodes: 0,

            runtime: null,

            country: '',

            language: '',

            genres: [],

            studios: [],

            creators: [],

            cast: [],

            rating_tmdb: null,

            rating_imdb: null,

            votes: 0,

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

module.exports = Series;