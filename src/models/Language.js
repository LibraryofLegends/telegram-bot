/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Language.js
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Language extends BaseModel {

    constructor(data = {}) {

        super({

            id: null,

            iso639_1: '',

            iso639_2: '',

            name: '',

            native_name: '',

            library_id: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Language;