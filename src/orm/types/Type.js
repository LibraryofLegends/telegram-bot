/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/types/Type.js
 * ----------------------------------------------------------------------------
 * Basisklasse aller ORM-Datentypen.
 * ============================================================================
 */

'use strict';

class Type {

    /**
     * Name des Typs.
     */

    getName() {

        throw new Error(

            'Type.getName() muss implementiert werden.'

        );

    }

    /**
     * Datenbank → Entity
     */

    fromDatabase(value) {

        return value;

    }

    /**
     * Entity → Datenbank
     */

    toDatabase(value) {

        return value;

    }

    /**
     * Standardwert.
     */

    getDefaultValue() {

        return null;

    }

    /**
     * Validierung.
     */

    isValid(value) {

        return true;

    }

}

module.exports = Type;