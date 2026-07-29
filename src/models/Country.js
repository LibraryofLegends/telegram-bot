/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Country.js
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Country extends BaseModel {

    constructor(data = {}) {

        super({

            id: null,

            iso2: '',

            iso3: '',

            name: '',

            native_name: '',

            emoji: '',

            library_id: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Country;