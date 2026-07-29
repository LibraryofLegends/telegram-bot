/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/events/EventBus.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentraler EventBus.
 *
 * Verwaltet sämtliche Events innerhalb des Systems.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const EventEmitter = require('events');

class EventBus extends EventEmitter {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(logger = console) {

        super();

        this.logger = logger;

        this.setMaxListeners(100);

    }

    /**
     * ============================================================
     * Event registrieren
     * ============================================================
     */

    register(event, listener) {

        this.on(event, listener);

        this.logger.info(
            `[EventBus] Listener registriert: ${event}`
        );

        return this;

    }

    /**
     * ============================================================
     * Einmaliger Listener
     * ============================================================
     */

    registerOnce(event, listener) {

        this.once(event, listener);

        return this;

    }

    /**
     * ============================================================
     * Event auslösen
     * ============================================================
     */

    emitEvent(event, payload = {}) {

        this.logger.info(
            `[EventBus] Event: ${event}`
        );

        return this.emit(event, payload);

    }

    /**
     * ============================================================
     * Async Event
     * ============================================================
     */

    async emitAsync(event, payload = {}) {

        const listeners = this.listeners(event);

        for (const listener of listeners) {

            await listener(payload);

        }

    }

    /**
     * ============================================================
     * Listener entfernen
     * ============================================================
     */

    remove(event, listener) {

        this.off(event, listener);

        return this;

    }

    /**
     * ============================================================
     * Alle entfernen
     * ============================================================
     */

    clear(event) {

        this.removeAllListeners(event);

        return this;

    }

    /**
     * ============================================================
     * Informationen
     * ============================================================
     */

    info() {

        return {

            events: this.eventNames(),

            count: this.eventNames().length

        };

    }

}

module.exports = EventBus;