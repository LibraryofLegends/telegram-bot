/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Genre.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Datenmodell eines Genres.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Genre extends BaseModel {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(data = {}) {

        super({

            id: null,

            tmdb_id: null,

            name: '',

            slug: '',

            description: '',

            color: '',

            icon: '',

            sort_order: 0,

            library_id: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Genre;