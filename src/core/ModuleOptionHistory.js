'use strict';

class ModuleOptionHistory {

    constructor() {

        this.history = [];

    }

    add(name, value) {

        this.history.push({

            name,
            value,
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

module.exports = ModuleOptionHistory;