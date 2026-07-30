'use strict';

class ModuleFactoryHistory {

    constructor() {

        this.history = [];

    }

    add(entries) {

        this.history.push({

            entries,
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

module.exports = ModuleFactoryHistory;