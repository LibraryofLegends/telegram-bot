/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/config/Defaults.js
 * ------------------------------------------------------------------------
 * Standardkonfiguration
 * ========================================================================
 */

'use strict';

module.exports = Object.freeze({

    APP: {

        NAME: 'Library Of Legends',

        VERSION: '2.0.0',

        ENV: 'development',

        DEBUG: false

    },

    DATABASE: {

        CLIENT: 'sqlite',

        FILE: './database/library.db'

    },

    API: {

        HOST: '0.0.0.0',

        PORT: 3000

    },

    TELEGRAM: {

        BOT_TOKEN: '',

        API_ID: '',

        API_HASH: ''

    },

    TMDB: {

        API_KEY: ''

    },

    OMDB: {

        API_KEY: ''

    },

    CACHE: {

        ENABLED: true,

        TTL: 3600

    },

    LOGGING: {

        LEVEL: 'INFO'

    }

});