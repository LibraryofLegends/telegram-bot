/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Company.js
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Company extends BaseModel {

    constructor(data = {}) {

        super({

            id: null,

            tmdb_id: null,

            name: '',

            country: '',

            logo: '',

            homepage: '',

            description: '',

            library_id: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Company;