/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/Person.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Datenmodell einer Person.
 *
 * Dieses Model repräsentiert Schauspieler, Regisseure,
 * Produzenten, Autoren, Komponisten und weitere Mitwirkende.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class Person extends BaseModel {

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

            name: '',

            original_name: '',

            sort_name: '',

            biography: '',

            birthday: null,

            deathday: null,

            birthplace: '',

            gender: null,

            known_for: '',

            profile_image: '',

            backdrop: '',

            homepage: '',

            popularity: 0,

            roles: [],

            aliases: [],

            social_media: {},

            library_id: '',

            favorite: false,

            notes: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = Person;