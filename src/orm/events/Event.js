/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/events/Event.js
 * ============================================================================
 */

'use strict';

class Event {

    constructor(name = '') {

        this.name = name;

        this.timestamp = new Date();

        this.propagationStopped = false;

        this.cancelled = false;

        this.data = new Map();

    }

    /**
     * ------------------------------------------------------------------------
     * Name
     * ------------------------------------------------------------------------
     */

    getName() {

        return this.name;

    }

    /**
     * ------------------------------------------------------------------------
     * Zeit
     * ------------------------------------------------------------------------
     */

    getTimestamp() {

        return this.timestamp;

    }

    /**
     * ------------------------------------------------------------------------
     * Propagation
     * ------------------------------------------------------------------------
     */

    stopPropagation() {

        this.propagationStopped = true;

        return this;

    }

    isPropagationStopped() {

        return this.propagationStopped;

    }

    /**
     * ------------------------------------------------------------------------
     * Cancel
     * ------------------------------------------------------------------------
     */

    cancel() {

        this.cancelled = true;

        return this;

    }

    isCancelled() {

        return this.cancelled;

    }

    /**
     * ------------------------------------------------------------------------
     * Daten
     * ------------------------------------------------------------------------
     */

    set(key, value) {

        this.data.set(

            key,

            value

        );

        return this;

    }

    get(key, defaultValue = null) {

        return this.data.has(key)

            ? this.data.get(key)

            : defaultValue;

    }

    has(key) {

        return this.data.has(key);

    }

    remove(key) {

        this.data.delete(key);

        return this;

    }

    clear() {

        this.data.clear();

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Export
     * ------------------------------------------------------------------------
     */

    toJSON() {

        return {

            name: this.name,

            timestamp: this.timestamp,

            cancelled: this.cancelled,

            propagationStopped:

                this.propagationStopped,

            data:

                Object.fromEntries(

                    this.data

                )

        };

    }

}

module.exports = Event;