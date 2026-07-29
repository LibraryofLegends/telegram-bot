/**
 * ========================================================================
 * Library Of Legends 2.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class User extends BaseModel {

    constructor(data = {}) {

        super({

            id: null,

            telegram_id: null,

            username: '',

            first_name: '',

            last_name: '',

            language: 'de',

            role: 'user',

            status: 'active',

            premium: false,

            favorite_genres: [],

            watchlist: [],

            settings: {},

            last_login: null,

            library_id: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = User;