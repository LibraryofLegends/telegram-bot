/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/plugins/PluginManager.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet sämtliche Plugins der Anwendung.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

class PluginManager {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(container, logger = console) {

        this.container = container;

        this.logger = logger;

        this.plugins = new Map();

    }

    /**
     * ============================================================
     * Plugin registrieren
     * ============================================================
     */

    register(plugin) {

        if (!plugin) {

            throw new Error('Plugin fehlt.');

        }

        if (this.plugins.has(plugin.name)) {

            throw new Error(
                `Plugin '${plugin.name}' existiert bereits.`
            );

        }

        this.plugins.set(plugin.name, plugin);

        this.logger.info(
            `[PluginManager] ${plugin.name} registriert`
        );

        return this;

    }

    /**
     * ============================================================
     * Plugin laden
     * ============================================================
     */

    async load(name) {

        const plugin = this.get(name);

        await plugin.load(this.container);

    }

    /**
     * ============================================================
     * Plugin starten
     * ============================================================
     */

    async start(name) {

        const plugin = this.get(name);

        await plugin.start(this.container);

    }

    /**
     * ============================================================
     * Plugin stoppen
     * ============================================================
     */

    async stop(name) {

        const plugin = this.get(name);

        await plugin.stop(this.container);

    }

    /**
     * ============================================================
     * Plugin entladen
     * ============================================================
     */

    async unload(name) {

        const plugin = this.get(name);

        await plugin.unload(this.container);

    }

    /**
     * ============================================================
     * Alle laden
     * ============================================================
     */

    async loadAll() {

        for (const plugin of this.plugins.values()) {

            await plugin.load(this.container);

        }

    }

    /**
     * ============================================================
     * Alle starten
     * ============================================================
     */

    async startAll() {

        for (const plugin of this.plugins.values()) {

            if (plugin.isEnabled()) {

                await plugin.start(this.container);

            }

        }

    }

    /**
     * ============================================================
     * Alle stoppen
     * ============================================================
     */

    async stopAll() {

        for (const plugin of [...this.plugins.values()].reverse()) {

            await plugin.stop(this.container);

        }

    }

    /**
     * ============================================================
     * Alle entladen
     * ============================================================
     */

    async unloadAll() {

        for (const plugin of [...this.plugins.values()].reverse()) {

            await plugin.unload(this.container);

        }

    }

    /**
     * ============================================================
     * Plugin abrufen
     * ============================================================
     */

    get(name) {

        if (!this.plugins.has(name)) {

            throw new Error(
                `Plugin '${name}' wurde nicht gefunden.`
            );

        }

        return this.plugins.get(name);

    }

    /**
     * ============================================================
     * Plugin vorhanden
     * ============================================================
     */

    has(name) {

        return this.plugins.has(name);

    }

    /**
     * ============================================================
     * Plugin entfernen
     * ============================================================
     */

    remove(name) {

        this.plugins.delete(name);

    }

    /**
     * ============================================================
     * Liste
     * ============================================================
     */

    list() {

        return [...this.plugins.keys()];

    }

    /**
     * ============================================================
     * Informationen
     * ============================================================
     */

    info() {

        return {

            count: this.plugins.size,

            plugins: this.list()

        };

    }

}

module.exports = PluginManager;