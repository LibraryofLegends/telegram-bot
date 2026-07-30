'use strict';

class ModuleManifestHistory {

    constructor() {

        this.history = [];

    }

    add(manifest) {

        this.history.push({

            manifest,

            timestamp: new Date()

        });

        return this;

    }

    latest() {

        return this.history.at(-1) || null;

    }

    all() {

        return [...this.history];

    }

    clear() {

        this.history = [];

    }

    count() {

        return this.history.length;

    }

}

module.exports = ModuleManifestHistory;