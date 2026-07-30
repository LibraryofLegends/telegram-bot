/**
 * ============================================================================
 * Library Of Legends 2.0
 * ---------------------------------------------------------------------------
 * Datei:
 * src/core/ResolutionContext.js
 * ---------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet den aktuellen Auflösungskontext des Containers.
 *
 * Erkennt rekursive Abhängigkeiten und dokumentiert den
 * kompletten Auflösungsweg.
 *
 * ============================================================================
 */

'use strict';

class ResolutionContext {

    constructor() {

        this.stack = [];

    }

    /**
     * Service betreten.
     *
     * @param {String} service
     */

    enter(service) {

        if (this.stack.includes(service)) {

            throw new Error(

                `Zirkuläre Abhängigkeit erkannt: ${this.trace(service)}`

            );

        }

        this.stack.push(service);

    }

    /**
     * Service verlassen.
     */

    leave() {

        this.stack.pop();

    }

    /**
     * Aktueller Service.
     *
     * @returns {*}
     */

    current() {

        if (!this.stack.length) {

            return null;

        }

        return this.stack[this.stack.length - 1];

    }

    /**
     * Tiefe.
     *
     * @returns {Number}
     */

    depth() {

        return this.stack.length;

    }

    /**
     * Stack.
     *
     * @returns {Array}
     */

    getStack() {

        return [...this.stack];

    }

    /**
     * Stack leeren.
     */

    clear() {

        this.stack.length = 0;

    }

    /**
     * Kontext aktiv?
     *
     * @returns {Boolean}
     */

    isResolving() {

        return this.stack.length > 0;

    }

    /**
     * Service enthalten?
     *
     * @param {String} service
     * @returns {Boolean}
     */

    contains(service) {

        return this.stack.includes(service);

    }

    /**
     * Trace erzeugen.
     *
     * @param {String} next
     * @returns {String}
     */

    trace(next = null) {

        const trace = [...this.stack];

        if (next) {

            trace.push(next);

        }

        return trace.join(' -> ');

    }

}

module.exports = ResolutionContext;