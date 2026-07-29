/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Collection.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Datenmodell einer Sammlung (Collection).
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Collection extends BaseModel {

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

            overview: '',

            poster: '',

            backdrop: '',

            sort_order: 0,

            library_id: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Collection;