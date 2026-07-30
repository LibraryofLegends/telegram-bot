'use strict';

class ModuleMetadataHistory {

    constructor() {

        this.history = [];

    }

    add(metadata) {

        this.history.push({

            metadata,

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

module.exports = ModuleMetadataHistory;