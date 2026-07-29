/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/BaseModel.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Basisklasse für sämtliche Models.
 *
 * Diese Klasse kapselt die gemeinsamen Eigenschaften und
 * Funktionen aller Datenmodelle innerhalb von
 * Library Of Legends.
 *
 * Funktionen:
 * - Datenzuweisung
 * - JSON-Konvertierung
 * - Array-Konvertierung
 * - Werte setzen
 * - Werte lesen
 * - Eigenschaften prüfen
 * - Eigenschaften entfernen
 * - Zurücksetzen
 * - Klonen
 * - Zeitstempel
 *
 * Verwendet von:
 * - Movie
 * - Series
 * - Person
 * - Genre
 * - Collection
 * - Studio
 * - Company
 * - User
 * - Workflow
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

class BaseModel {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(data = {}) {

        this.fill(data);

    }

    /**
     * ============================================================
     * Daten
     * ============================================================
     */

    /**
     * Mehrere Werte setzen
     *
     * @param {Object} data
     * @returns {BaseModel}
     */
    fill(data = {}) {

        if (
            data &&
            typeof data === 'object' &&
            !Array.isArray(data)
        ) {

            Object.assign(this, data);

        }

        return this;

    }

    /**
     * Einzelnen Wert setzen
     *
     * @param {string} key
     * @param {*} value
     * @returns {BaseModel}
     */
    set(key, value) {

        this[key] = value;

        return this;

    }

    /**
     * Einzelnen Wert lesen
     *
     * @param {string} key
     * @returns {*}
     */
    get(key) {

        return this[key];

    }

    /**
     * Eigenschaft vorhanden?
     *
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {

        return Object.prototype.hasOwnProperty.call(
            this,
            key
        );

    }

    /**
     * Eigenschaft entfernen
     *
     * @param {string} key
     * @returns {BaseModel}
     */
    remove(key) {

        delete this[key];

        return this;

    }

    /**
     * ============================================================
     * Konvertierung
     * ============================================================
     */

    /**
     * Objekt zurückgeben
     *
     * @returns {Object}
     */
    toObject() {

        return { ...this };

    }

    /**
     * JSON zurückgeben
     *
     * @returns {Object}
     */
    toJSON() {

        return this.toObject();

    }

    /**
     * Array mit Werten
     *
     * @returns {Array}
     */
    values() {

        return Object.values(this);

    }

    /**
     * Array mit Schlüsseln
     *
     * @returns {Array}
     */
    keys() {

        return Object.keys(this);

    }

    /**
     * Schlüssel/Wert-Paare
     *
     * @returns {Array}
     */
    entries() {

        return Object.entries(this);

    }

    /**
     * ============================================================
     * Status
     * ============================================================
     */

    /**
     * Anzahl der Eigenschaften
     *
     * @returns {number}
     */
    count() {

        return this.keys().length;

    }

    /**
     * Prüfen ob leer
     *
     * @returns {boolean}
     */
    isEmpty() {

        return this.count() === 0;

    }

    /**
     * Model zurücksetzen
     *
     * @returns {BaseModel}
     */
    clear() {

        for (const key of this.keys()) {

            delete this[key];

        }

        return this;

    }

    /**
     * ============================================================
     * Hilfsfunktionen
     * ============================================================
     */

    /**
     * Model klonen
     *
     * @returns {BaseModel}
     */
    clone() {

        return new this.constructor(
            this.toObject()
        );

    }

    /**
     * Aktuellen Zeitstempel
     *
     * @returns {string}
     */
    now() {

        return new Date().toISOString();

    }

    /**
     * Modelinformationen
     *
     * @returns {Object}
     */
    info() {

        return {

            model: this.constructor.name,

            properties: this.keys(),

            count: this.count()

        };

    }

}

module.exports = BaseModel;