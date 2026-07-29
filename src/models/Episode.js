/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Episode.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Datenmodell einer Serienepisode.
 *
 * Dieses Model repräsentiert eine einzelne Episode einer Staffel
 * und bildet die Grundlage für Import, Verwaltung und Wiedergabe.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Episode extends BaseModel {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(data = {}) {

        super({

            id: null,

            series_id: null,

            season_id: null,

            tmdb_id: null,

            tvdb_id: null,

            imdb_id: null,

            episode_number: 1,

            season_number: 1,

            absolute_number: null,

            title: '',

            original_title: '',

            overview: '',

            air_date: null,

            runtime: null,

            rating_tmdb: null,

            rating_imdb: null,

            votes: 0,

            still_image: '',

            thumbnail: '',

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

            checksum: '',

            audio: [],

            subtitles: [],

            telegram_chat_id: null,

            telegram_message_id: null,

            telegram_file_id: '',

            telegram_unique_file_id: '',

            library_id: '',

            favorite: false,

            watched: false,

            progress: 0,

            play_count: 0,

            notes: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Episode;