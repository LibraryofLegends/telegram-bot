'use strict';

class ModuleDescriptorHistory {

    constructor() {

        this.history = [];

    }

    add(snapshot) {

        this.history.push({

            snapshot,
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

module.exports = ModuleDescriptorHistory;