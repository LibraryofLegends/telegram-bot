/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/types/TypeRegistry.js
 * ============================================================================
 */

'use strict';

class TypeRegistry {

    constructor() {

        this.types = new Map();

    }

    /**
     * Registrieren
     */

    register(type) {

        this.types.set(

            type.getName(),

            type

        );

        return this;

    }

    /**
     * Abrufen
     */

    get(name) {

        if (

            !this.types.has(name)

        ) {

            throw new Error(

                `Unbekannter Typ: ${name}`

            );

        }

        return this.types.get(name);

    }

    /**
     * Existiert?
     */

    has(name) {

        return this.types.has(name);

    }

    /**
     * Entfernen
     */

    remove(name) {

        return this.types.delete(name);

    }

    /**
     * Alle
     */

    all() {

        return [

            ...this.types.values()

        ];

    }

    /**
     * Anzahl
     */

    count() {

        return this.types.size;

    }

    /**
     * Leeren
     */

    clear() {

        this.types.clear();

    }

}

module.exports = TypeRegistry;