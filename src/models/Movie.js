/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Movie.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Datenmodell eines Films.
 *
 * Dieses Model repräsentiert einen einzelnen Film innerhalb
 * der Library Of Legends Datenbank.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Movie extends BaseModel {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(data = {}) {

        super({

            id: null,

            tmdb_id: null,

            imdb_id: null,

            title: '',

            original_title: '',

            sort_title: '',

            overview: '',

            tagline: '',

            release_date: null,

            year: null,

            runtime: null,

            country: '',

            language: '',

            genres: [],

            studios: [],

            collections: [],

            directors: [],

            writers: [],

            cast: [],

            rating_tmdb: null,

            rating_imdb: null,

            votes: 0,

            poster: '',

            backdrop: '',

            trailer: '',

            file_name: '',

            file_path: '',

            file_size: 0,

            resolution: '',

            source: '',

            quality: '',

            video_codec: '',

            audio_codec: '',

            audio_channels: '',

            hdr: '',

            audio: [],

            subtitles: [],

            checksum: '',

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

module.exports = Movie;