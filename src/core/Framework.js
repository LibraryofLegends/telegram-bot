══════════════════════════════════════════════════════════════
🚀 LIBRARY OF LEGENDS FRAMEWORK (LLF)
══════════════════════════════════════════════════════════════

Version        : v0.1.0
Codename       : Foundation
Phase          : 1 – Core Foundation
Sprint         : 1
Modul          : Core
Paket          : 1
Status         : 🔄 In Entwicklung

Autor          : Thomas Lorenz
Projekt        : Library Of Legends Framework

══════════════════════════════════════════════════════════════

import Version from './Version.js';

export default class Framework {

    #name;

    #version;

    #booted;

    #startedAt;

    constructor() {

        this.#name = Version.NAME;
        this.#version = Version.version;
        this.#booted = false;
        this.#startedAt = null;

    }

    get name() {

        return this.#name;

    }

    get version() {

        return this.#version;

    }

    get startedAt() {

        return this.#startedAt;

    }

    get isBooted() {

        return this.#booted;

    }

    boot() {

        if (this.#booted) {

            return this;

        }

        this.#booted = true;
        this.#startedAt = new Date();

        return this;

    }

    shutdown() {

        this.#booted = false;
        this.#startedAt = null;

        return this;

    }

    getInfo() {

        return {

            name: this.#name,
            version: this.#version,
            booted: this.#booted,
            startedAt: this.#startedAt

        };

    }

}